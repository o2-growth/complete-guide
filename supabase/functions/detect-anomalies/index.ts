import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Roda detect_anomalies(tenant) e enriquece anomalias abertas sem `explanation`
 * usando Lovable AI (Gemini Flash) para gerar uma explicação curta e acionável.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

    let tenants: string[] = [];
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body?.tenant_id) tenants = [body.tenant_id as string];
    }
    if (tenants.length === 0) {
      const { data } = await supabase.from("tenants").select("id");
      tenants = (data ?? []).map((t: { id: string }) => t.id);
    }

    const summary: Array<{ tenant: string; detected: number; explained: number }> = [];

    for (const t of tenants) {
      const { data: detected, error } = await supabase.rpc("detect_anomalies", { _tenant: t });
      if (error) {
        summary.push({ tenant: t, detected: 0, explained: 0 });
        continue;
      }

      let explained = 0;
      if (LOVABLE_KEY) {
        const { data: open } = await supabase
          .from("metric_anomalies")
          .select("id, source, metric, expected, observed, delta_pct, severity, suggested_action")
          .eq("tenant_id", t)
          .eq("status", "open")
          .is("explanation", null)
          .limit(10);

        for (const a of open ?? []) {
          try {
            const prompt = `Você é um analista de Growth. Em 2 frases, explique a possível causa dessa anomalia e a próxima ação.
Métrica: ${a.metric} (${a.source})
Esperado (média): ${a.expected}
Observado: ${a.observed}
Variação: ${a.delta_pct}%
Severidade: ${a.severity}
Ação sugerida no sistema: ${a.suggested_action ?? "—"}
Responda em português, direto, sem listas.`;

            const r = await withErrorBoundary(
              (signal) => fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_KEY}` },
                body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: prompt }] }),
                signal,
              }),
              { source: "detect-anomalies", timeoutMs: 25000, retries: 3, fallback: () => new Response("{}", { status: 599 }) },
            );
            if (r.ok) {
              const j = await r.json();
              const text = j?.choices?.[0]?.message?.content?.trim();
              if (text) {
                await supabase.from("metric_anomalies").update({ explanation: text }).eq("id", a.id);
                explained++;
              }
            }
          } catch (_e) { /* ignore single failure */ }
        }
      }

      summary.push({ tenant: t, detected: Number(detected ?? 0), explained });
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});