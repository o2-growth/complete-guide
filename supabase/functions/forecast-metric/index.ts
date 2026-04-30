import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Roda forecast_metric e (opcional) gera narrativa IA explicando a tendência. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const body = await req.json().catch(() => ({}));
    const tenant_id = body?.tenant_id as string | undefined;
    const source = (body?.source as string) ?? "tasks";
    const metric = (body?.metric as string) ?? "done_count";
    const days_back = Number(body?.days_back ?? 60);
    const days_ahead = Number(body?.days_ahead ?? 30);
    if (!tenant_id) return new Response(JSON.stringify({ error: "tenant_id required" }), { status: 400, headers: corsHeaders });

    const { data: rows, error } = await supabase.rpc("forecast_metric", {
      _tenant: tenant_id, _source: source, _metric: metric, _days_back: days_back, _days_ahead: days_ahead,
    });
    if (error) throw error;

    const series = (rows ?? []) as Array<{ d: string; value: number; kind: string }>;
    const history = series.filter((s) => s.kind === "history");
    const forecast = series.filter((s) => s.kind === "forecast");
    const avgHist = history.length ? history.reduce((a, b) => a + Number(b.value), 0) / history.length : 0;
    const avgFore = forecast.length ? forecast.reduce((a, b) => a + Number(b.value), 0) / forecast.length : 0;
    const trendPct = avgHist > 0 ? Math.round(((avgFore - avgHist) / avgHist) * 100) : 0;

    let narrative: string | null = null;
    if (LOVABLE_KEY && history.length >= 5) {
      try {
        const prompt = `Você é um analista de Growth. Em 2 frases curtas e em português, descreva a tendência prevista para a métrica "${metric}" (${source}).
Média histórica (últimos ${days_back}d): ${avgHist.toFixed(1)}
Média prevista (próximos ${days_ahead}d): ${avgFore.toFixed(1)}
Variação prevista: ${trendPct}%
Seja direto, traga 1 ação prática.`;
        const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_KEY}` },
          body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: prompt }] }),
        });
        if (r.ok) {
          const j = await r.json();
          narrative = j?.choices?.[0]?.message?.content?.trim() ?? null;
        }
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({ ok: true, series, avgHist, avgFore, trendPct, narrative }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});