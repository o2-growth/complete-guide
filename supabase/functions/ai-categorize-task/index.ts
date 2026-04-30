import { authenticate, callAI, aiErrorResponse, corsHeaders, logInteraction, SYSTEM_TONE } from "../_shared/ai-helpers.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  let ctx;
  try { ctx = await authenticate(req); }
  catch (e) { if (e instanceof Response) return e; return new Response("err", { status: 500, headers: corsHeaders }); }

  try {
    const { taskId } = await req.json();
    if (!taskId) return new Response(JSON.stringify({ error: "taskId obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: task } = await ctx.serviceClient.from("tasks").select("id, title, description, tenant_id").eq("id", taskId).maybeSingle();
    if (!task) return new Response(JSON.stringify({ error: "task não encontrada" }), { status: 404, headers: corsHeaders });

    const { data: types } = await ctx.serviceClient.from("task_types")
      .select("slug, name, description").eq("tenant_id", task.tenant_id);

    const typesList = (types ?? []).map((t) => `- ${t.slug}: ${t.name} (${t.description ?? ""})`).join("\n");

    const model = "google/gemini-2.5-flash";
    const started = Date.now();

    const upstream = await callAI({
      model,
      messages: [
        { role: "system", content: SYSTEM_TONE },
        { role: "user", content: `Tarefa:\nTítulo: ${task.title}\nDescrição: ${task.description ?? "(vazia)"}\n\nTipos disponíveis:\n${typesList}\n\nClassifique a tarefa.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "categorize",
          description: "Sugere classificação para uma tarefa",
          parameters: {
            type: "object",
            properties: {
              type_slug: { type: "string", description: "slug do tipo escolhido" },
              priority: { type: "string", enum: ["none", "low", "medium", "high", "urgent"] },
              estimate_minutes: { type: "integer", description: "estimativa total em minutos" },
              tags: { type: "array", items: { type: "string" }, description: "3-6 tags curtas" },
              reasoning: { type: "string", description: "1 frase explicando" },
            },
            required: ["type_slug", "priority", "estimate_minutes", "tags", "reasoning"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "categorize" } },
    });

    if (!upstream.ok) {
      await logInteraction(ctx, { feature: "ai-categorize-task", model, status: "error", error: `${upstream.status}`, taskId, latencyMs: Date.now() - started });
      return aiErrorResponse(upstream.status);
    }
    const json = await upstream.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : null;

    await logInteraction(ctx, {
      feature: "ai-categorize-task", model, taskId,
      tokensIn: json.usage?.prompt_tokens, tokensOut: json.usage?.completion_tokens,
      latencyMs: Date.now() - started,
      promptSummary: task.title, responseSummary: JSON.stringify(args),
    });

    return new Response(JSON.stringify({ suggestion: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});