import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: corsHeaders });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401, headers: corsHeaders });

    const { tenant_id, period_month } = await req.json();
    if (!tenant_id) return new Response(JSON.stringify({ error: "tenant_id required" }), { status: 400, headers: corsHeaders });

    const month = period_month || new Date().toISOString().slice(0, 7) + "-01";

    const [{ data: ctx }, { data: bench }] = await Promise.all([
      supabase.rpc("copilot_context", { _tenant: tenant_id }),
      supabase.rpc("benchmark_compare", { _tenant: tenant_id }),
    ]);

    let summary = "";
    let recommendations: any[] = [];
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (apiKey) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Você é um consultor sênior de growth. Gere um scorecard mensal em PT-BR com: (1) parágrafo executivo de 4 frases destacando o que foi melhor/pior vs benchmark e (2) JSON com 3 recomendações priorizadas {priority:'high|medium|low', title, rationale, expected_impact}. Resposta no formato: SUMMARY:\\n<texto>\\nRECOMMENDATIONS:\\n<json array>" },
            { role: "user", content: `Métricas do mês:\n${JSON.stringify(ctx)}\n\nBenchmarks:\n${JSON.stringify(bench)}` },
          ],
        }),
      });
      if (aiResp.ok) {
        const ai = await aiResp.json();
        const txt = ai.choices?.[0]?.message?.content ?? "";
        const sumMatch = txt.match(/SUMMARY:\s*([\s\S]*?)(?:RECOMMENDATIONS:|$)/i);
        const recMatch = txt.match(/RECOMMENDATIONS:\s*([\s\S]*)/i);
        summary = sumMatch?.[1]?.trim() ?? txt;
        if (recMatch) {
          try { recommendations = JSON.parse(recMatch[1].trim().replace(/^```json|```$/g, "").trim()); } catch { recommendations = []; }
        }
      }
    }

    const { data: saved } = await supabase.from("monthly_scorecards").upsert({
      tenant_id, period_month: month, metrics: ctx, benchmarks: bench, ai_summary: summary, recommendations,
    }, { onConflict: "tenant_id,period_month" }).select().single();

    return new Response(JSON.stringify({ scorecard: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});