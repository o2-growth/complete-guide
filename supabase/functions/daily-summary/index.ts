import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Gera resumo diário ("morning_briefing" ou "squad_summary") por squad em PT-BR
 * usando estado do tenant + Lovable AI Gemini Flash.
 * Body: { tenant_id, squad_id?, kind?: 'morning_briefing'|'squad_summary' }
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
    const squadId = (body?.squad_id ?? null) as string | null;
    const kind = (body?.kind ?? "morning_briefing") as "morning_briefing" | "squad_summary";

    if (!tenantId) {
      return new Response(JSON.stringify({ error: "tenant_id obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    // métricas básicas
    const { count: openCount } = await supabase
      .from("tasks").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).not("status", "in", "(done,cancelled)");
    const { count: dueToday } = await supabase
      .from("tasks").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).eq("status", "todo")
      .gte("due_at", `${today}T00:00:00`).lt("due_at", `${today}T23:59:59`);
    const { count: doneYesterday } = await supabase
      .from("tasks").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).eq("status", "done")
      .gte("updated_at", new Date(Date.now() - 86400000).toISOString());

    const metrics = {
      open: openCount ?? 0,
      due_today: dueToday ?? 0,
      done_yesterday: doneYesterday ?? 0,
    };

    let content = `Bom dia! Hoje há ${metrics.due_today} tarefa(s) com prazo. Ontem o time concluiu ${metrics.done_yesterday}. Total em aberto: ${metrics.open}.`;

    if (LOVABLE_KEY) {
      const prompt = `Você é o Chief of Staff de uma agência. Em 3 frases curtas, escreva o briefing matinal em PT-BR para o time, baseado em:
- Tarefas em aberto: ${metrics.open}
- Tarefas vencendo hoje: ${metrics.due_today}
- Concluídas nas últimas 24h: ${metrics.done_yesterday}

Tom motivador mas direto. Sem bullets, sem emojis em excesso (no máximo 1).`;
      try {
        const r = await withErrorBoundary(
          (signal) => fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: prompt }] }),
            signal,
          }),
          { source: "daily-summary", timeoutMs: 25000, retries: 3, fallback: () => new Response(JSON.stringify({ choices: [] }), { status: 599 }) },
        );
        if (r.ok) {
          const j = await r.json();
          content = j?.choices?.[0]?.message?.content ?? content;
        }
      } catch (_e) { /* fallback ao texto base */ }
    }

    // upsert idempotente do dia
    const { error: upErr } = await supabase
      .from("ai_summaries")
      .upsert({
        tenant_id: tenantId,
        squad_id: squadId,
        kind,
        period_date: today,
        content,
        metrics,
      }, { onConflict: "tenant_id,squad_id,kind,period_date" });
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ ok: true, content, metrics }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});