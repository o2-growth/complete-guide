import { authenticate, callAI, aiErrorResponse, corsHeaders, logInteraction, SYSTEM_TONE } from "../_shared/ai-helpers.ts";

/**
 * Gera uma pauta de conteúdo (content brief) com 3-5 ângulos + 5 hooks acionáveis.
 * Body: { topic, channels, audience?, tone? }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  let ctx;
  try { ctx = await authenticate(req); }
  catch (e) { if (e instanceof Response) return e; return new Response("err", { status: 500, headers: corsHeaders }); }

  try {
    const { topic, channels = ["instagram"], audience = "público geral", tone = "profissional, próximo" } = await req.json();
    if (!topic) return new Response(JSON.stringify({ error: "topic obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const model = "google/gemini-2.5-pro";
    const started = Date.now();

    const upstream = await callAI({
      model,
      messages: [
        { role: "system", content: SYSTEM_TONE },
        { role: "user", content:
`Gere uma pauta de conteúdo para os canais: ${(channels as string[]).join(", ")}.
Tema: ${topic}
Audiência: ${audience}
Tom: ${tone}

Retorne JSON puro (sem markdown) com este schema:
{
  "title": "string curto",
  "objective": "qual transformação esse conteúdo gera",
  "angles": [{"name":"...", "summary":"...", "format":"reel|carousel|story|post|email"}],   // 3 a 5 itens
  "hooks": ["frase 1", "frase 2", ...]   // 5 hooks fortes (primeira linha)
}` },
      ],
    });

    if (!upstream.ok) {
      await logInteraction(ctx, { feature: "ai-content-brief", model, status: "error", error: `${upstream.status}`, latencyMs: Date.now() - started });
      return aiErrorResponse(upstream.status);
    }
    const json = await upstream.json();
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let brief: Record<string, unknown> = {};
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      brief = JSON.parse(cleaned);
    } catch {
      brief = { title: topic, objective: "", angles: [], hooks: [], raw };
    }

    await logInteraction(ctx, {
      feature: "ai-content-brief", model,
      tokensIn: json.usage?.prompt_tokens, tokensOut: json.usage?.completion_tokens,
      latencyMs: Date.now() - started, promptSummary: topic, responseSummary: JSON.stringify(brief).slice(0, 500),
    });

    return new Response(JSON.stringify({ brief }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});