import { authenticate, callAI, aiErrorResponse, aiUnavailableResponse, corsHeaders, logInteraction, SYSTEM_TONE } from "../_shared/ai-helpers.ts";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";

const PLATFORM_HINTS: Record<string, string> = {
  ig_feed: "Post para feed do Instagram. Até 2200 caracteres. Use 1 hook forte na primeira linha, parágrafos curtos, emojis pontuais e CTA claro. Inclua 5-10 hashtags relevantes ao final.",
  ig_story: "Story do Instagram. Texto curtíssimo (máx. 80 caracteres por tela), 1 ideia por tela, CTA claro.",
  ig_reel: "Roteiro de Reels (15-60s). Estrutura: hook (3s) → desenvolvimento → CTA. Inclua descrição da legenda e hashtags.",
  linkedin: "Post de LinkedIn profissional. Até 3000 caracteres. Hook nos 3 primeiros parágrafos, espaçamento generoso, storytelling, encerre com pergunta para engajar.",
  email: "E-mail marketing. Forneça subject (máx 78 chars), preheader curto e corpo HTML simples com CTA.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let ctx;
  try { ctx = await authenticate(req); }
  catch (e) { if (e instanceof Response) return e; return new Response("err", { status: 500, headers: corsHeaders }); }

  try {
    const { brief, platform = "ig_feed", tone = "profissional", taskId } = await req.json();
    if (!brief || typeof brief !== "string") {
      return new Response(JSON.stringify({ error: "brief obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const model = "google/gemini-2.5-pro";
    const started = Date.now();
    const hint = PLATFORM_HINTS[platform] ?? PLATFORM_HINTS.ig_feed;

    let upstream: Response;
    try {
      upstream = await withErrorBoundary((signal) => callAI({
      model,
      messages: [
        { role: "system", content: `${SYSTEM_TONE}\n\n${hint}\nTom: ${tone}.` },
        { role: "user", content: `Briefing:\n${brief}\n\nGere a copy completa pronta para publicar. Não inclua explicações antes ou depois — apenas a copy.` },
      ],
    }, signal), { source: "ai-generate-copy", timeoutMs: 25000, retries: 3 });
    } catch {
      await logInteraction(ctx, { feature: "ai-generate-copy", model, status: "error", error: "boundary failed", latencyMs: Date.now() - started });
      return aiUnavailableResponse();
    }

    if (!upstream.ok) {
      await logInteraction(ctx, { feature: "ai-generate-copy", model, status: "error", error: `${upstream.status}`, latencyMs: Date.now() - started });
      return aiErrorResponse(upstream.status);
    }
    const json = await upstream.json();
    const text = json.choices?.[0]?.message?.content ?? "";
    const usage = json.usage ?? {};

    await logInteraction(ctx, {
      feature: "ai-generate-copy", model, taskId: taskId ?? null,
      tokensIn: usage.prompt_tokens, tokensOut: usage.completion_tokens,
      latencyMs: Date.now() - started,
      promptSummary: brief, responseSummary: text,
    });

    return new Response(JSON.stringify({ text, platform }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});