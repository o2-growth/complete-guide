import { authenticate, corsHeaders, logInteraction, aiErrorResponse } from "../_shared/ai-helpers.ts";

/**
 * Gera uma imagem com Nano Banana (google/gemini-2.5-flash-image) e devolve data URL base64.
 * Body: { prompt, aspect? ("square"|"portrait"|"landscape") }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  let ctx;
  try { ctx = await authenticate(req); }
  catch (e) { if (e instanceof Response) return e; return new Response("err", { status: 500, headers: corsHeaders }); }

  try {
    const { prompt, aspect = "square" } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ error: "prompt obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const aspectHint = aspect === "portrait" ? "vertical 4:5 (formato Instagram feed)" : aspect === "landscape" ? "horizontal 16:9" : "quadrada 1:1";
    const fullPrompt = `${prompt}. Estilo: profissional, alta qualidade, pronto para publicação em redes sociais. Formato ${aspectHint}.`;

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), { status: 500, headers: corsHeaders });

    const model = "google/gemini-2.5-flash-image";
    const started = Date.now();
    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!upstream.ok) {
      await logInteraction(ctx, { feature: "ai-generate-image", model, status: "error", error: `${upstream.status}`, latencyMs: Date.now() - started });
      return aiErrorResponse(upstream.status);
    }
    const json = await upstream.json();
    const imageUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;

    await logInteraction(ctx, {
      feature: "ai-generate-image", model,
      tokensIn: json.usage?.prompt_tokens, tokensOut: json.usage?.completion_tokens,
      latencyMs: Date.now() - started, promptSummary: prompt, responseSummary: imageUrl ? "ok" : "no-image",
    });

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});