import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Gera um briefing executivo em PT-BR usando os KPIs do tenant
 * (exec_kpis RPC) + Lovable AI (Gemini Flash). Retorna narrativa curta.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const body = await req.json().catch(() => ({}));
    const tenantId = body?.tenant_id as string | undefined;
    if (!tenantId) {
      return new Response(JSON.stringify({ error: "tenant_id obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: kpis, error } = await supabase.rpc("exec_kpis", { _tenant: tenantId });
    if (error) throw error;

    let narrative = "Resumo indisponível (chave IA ausente).";
    if (LOVABLE_KEY) {
      const k = kpis as Record<string, number | string>;
      const prompt = `Você é um Chief of Staff. Em 4 frases, escreva o briefing executivo da semana com base nestes KPIs:
- Tarefas concluídas (7d): ${k.done_7d} (vs ${k.done_prev_7d} semana anterior, ${k.done_delta_pct}%)
- Tarefas atrasadas hoje: ${k.overdue}
- Anomalias abertas: ${k.anomalies_open}
- Goals em risco: ${k.goals_at_risk}
- ROAS acumulado: ${k.roas}
- Engajamento social (7d): ${k.engagement_7d}

Comece pelo destaque positivo, depois aponte 1 risco prioritário e 1 ação concreta para a semana. PT-BR, sem listas, tom executivo.`;

      try {
        const r = await withErrorBoundary(
          (signal) => fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: prompt }] }),
            signal,
          }),
          { source: "exec-briefing", timeoutMs: 25000, retries: 3 },
        );
        if (r.ok) {
          const j = await r.json();
          narrative = j?.choices?.[0]?.message?.content ?? narrative;
        }
      } catch {
        narrative = "Serviço de IA temporariamente indisponível. Tente novamente em alguns segundos.";
      }
    }

    return new Response(JSON.stringify({ kpis, narrative }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});