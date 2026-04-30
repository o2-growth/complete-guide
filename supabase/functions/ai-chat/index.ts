import { authenticate, callAI, aiErrorResponse, corsHeaders, logInteraction, SYSTEM_TONE } from "../_shared/ai-helpers.ts";

interface ChatMessage { role: "user" | "assistant" | "system"; content: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let ctx;
  try {
    ctx = await authenticate(req);
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
    const taskContext: { id?: string; title?: string; description?: string } | null = body.taskContext ?? null;

    let systemPrompt = SYSTEM_TONE;
    if (taskContext?.title) {
      systemPrompt += `\n\nContexto da tarefa atual:\nTítulo: ${taskContext.title}`;
      if (taskContext.description) systemPrompt += `\nDescrição: ${taskContext.description.slice(0, 800)}`;
    }

    const model = "google/gemini-2.5-pro";
    const started = Date.now();

    const upstream = await callAI({
      model,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    if (!upstream.ok || !upstream.body) {
      const status = upstream.status;
      await logInteraction(ctx, {
        feature: "ai-chat", model, status: "error",
        error: `gateway ${status}`, latencyMs: Date.now() - started,
      });
      return aiErrorResponse(status);
    }

    // Não dá para "tee" facilmente sem consumir; logamos um marcador simples.
    await logInteraction(ctx, {
      feature: "ai-chat", model, taskId: taskContext?.id ?? null,
      promptSummary: messages[messages.length - 1]?.content,
      latencyMs: Date.now() - started,
    });

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});