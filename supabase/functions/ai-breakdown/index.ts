import { authenticate, callAI, aiErrorResponse, aiUnavailableResponse, corsHeaders, logInteraction, SYSTEM_TONE } from "../_shared/ai-helpers.ts";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  let ctx;
  try { ctx = await authenticate(req); }
  catch (e) { if (e instanceof Response) return e; return new Response("err", { status: 500, headers: corsHeaders }); }

  try {
    const { taskId } = await req.json();
    if (!taskId) return new Response(JSON.stringify({ error: "taskId obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: task } = await ctx.serviceClient.from("tasks").select("id, title, description, tenant_id, project_id").eq("id", taskId).maybeSingle();
    if (!task) return new Response(JSON.stringify({ error: "task não encontrada" }), { status: 404, headers: corsHeaders });

    const model = "google/gemini-2.5-flash";
    const started = Date.now();

    let upstream: Response;
    try {
      upstream = await withErrorBoundary((signal) => callAI({
      model,
      messages: [
        { role: "system", content: SYSTEM_TONE },
        { role: "user", content: `Quebre a tarefa abaixo em 3 a 7 subtarefas acionáveis, na ordem de execução. Cada subtarefa deve ter um verbo claro no início.\n\nTítulo: ${task.title}\nDescrição: ${task.description ?? "(vazia)"}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "breakdown",
          description: "Quebra uma tarefa em subtarefas",
          parameters: {
            type: "object",
            properties: {
              subtasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    estimate_minutes: { type: "integer" },
                  },
                  required: ["title", "estimate_minutes"],
                  additionalProperties: false,
                },
              },
            },
            required: ["subtasks"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "breakdown" } },
    }, signal), { source: "ai-breakdown", timeoutMs: 25000, retries: 3 });
    } catch {
      await logInteraction(ctx, { feature: "ai-breakdown", model, status: "error", error: "boundary failed", taskId, latencyMs: Date.now() - started });
      return aiUnavailableResponse();
    }

    if (!upstream.ok) {
      await logInteraction(ctx, { feature: "ai-breakdown", model, status: "error", error: `${upstream.status}`, taskId, latencyMs: Date.now() - started });
      return aiErrorResponse(upstream.status);
    }
    const json = await upstream.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : { subtasks: [] };

    await logInteraction(ctx, {
      feature: "ai-breakdown", model, taskId,
      tokensIn: json.usage?.prompt_tokens, tokensOut: json.usage?.completion_tokens,
      latencyMs: Date.now() - started,
      promptSummary: task.title, responseSummary: JSON.stringify(args).slice(0, 500),
    });

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});