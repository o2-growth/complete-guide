import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Sub-fase 6E — Recomenda 3 tarefas pra focar hoje + 1 padrão observado.
 * Chamada por usuário autenticado (frontend) ou pelo cron-tick (job=ai_suggest_daily).
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tenant_id, user_id } = await req.json();
    if (!tenant_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "tenant_id e user_id obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const nowIso = new Date().toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    const [openTasks, overdueTasks, pomodoros, weekdayStats] = await Promise.all([
      supabase.from("tasks")
        .select("id, code, title, priority, due_at, project_id")
        .eq("tenant_id", tenant_id).eq("assignee_id", user_id)
        .is("done_at", null).eq("archived", false)
        .order("priority", { ascending: false })
        .order("due_at", { ascending: true })
        .limit(10),
      supabase.from("tasks")
        .select("id, code, title")
        .eq("tenant_id", tenant_id).eq("assignee_id", user_id)
        .is("done_at", null).lt("due_at", nowIso).limit(5),
      supabase.from("pomodoros")
        .select("planned_minutes, started_at")
        .eq("user_id", user_id).eq("completed", true)
        .gte("started_at", sevenDaysAgo),
      supabase.from("tasks")
        .select("done_at")
        .eq("tenant_id", tenant_id).eq("assignee_id", user_id)
        .gte("done_at", thirtyDaysAgo)
        .not("done_at", "is", null),
    ]);

    const focusedMinutes = (pomodoros.data || []).reduce(
      (s: number, p: { planned_minutes: number }) => s + (p.planned_minutes || 0), 0);
    const dailyAvg = Math.round(focusedMinutes / 7);

    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    (weekdayStats.data || []).forEach((t: { done_at: string }) => {
      const d = new Date(t.done_at).getDay();
      dayCounts[d]++;
    });
    const bestDay = dayCounts.indexOf(Math.max(...dayCounts));
    const bestDayName = ["domingos","segundas","terças","quartas","quintas","sextas","sábados"][bestDay];

    const openList = (openTasks.data || []) as Array<{
      id: string; code: string | null; title: string; priority: string; due_at: string | null;
    }>;
    const overdueList = (overdueTasks.data || []) as Array<{ id: string; code: string | null }>;

    const prompt = `Você é um assistente de produtividade direto e motivador (sem ser piegas), em português brasileiro, tratando o usuário por "você". Não use a palavra "consultoria".

Tarefas abertas atribuídas (top 10 por prioridade):
${openList.map((t) => `- id=${t.id} [${t.priority}] ${t.code ?? ""} ${t.title} (vence: ${t.due_at || "sem prazo"})`).join("\n")}

${overdueList.length ? `Atrasadas (${overdueList.length}): ${overdueList.map((t) => t.code).join(", ")}` : "Nenhuma atrasada."}

Foco últimos 7 dias: ${focusedMinutes} minutos (média ${dailyAvg} min/dia).
Dia mais produtivo: ${bestDayName} (${dayCounts[bestDay]} tarefas concluídas).

Responda APENAS com JSON válido no formato:
{
  "recommendations": [
    {"task_id": "uuid-1", "title": "título da task 1", "reason": "uma frase curta justificando"},
    {"task_id": "uuid-2", "title": "...", "reason": "..."},
    {"task_id": "uuid-3", "title": "...", "reason": "..."}
  ],
  "pattern": "Uma frase observando padrão (ex: 'Você completa 40% mais nas terças')."
}

Escolha 3 tasks da lista priorizando: atrasadas > urgent > high > vence hoje. Use os ids reais (campo id=) das tarefas listadas.`;

    const aiResponse = await withErrorBoundary(
      async (signal) => {
        const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
          signal,
        });
        if (!r.ok) {
          const t = await r.text();
          throw new Error(`AI Gateway ${r.status}: ${t.slice(0, 200)}`);
        }
        return await r.json();
      },
      { source: "ai-suggest-daily", timeoutMs: 25000, retries: 3, baseDelayMs: 500 },
    );

    const content = JSON.parse(aiResponse.choices[0].message.content);

    await supabase.from("ai_interactions").insert({
      tenant_id,
      user_id,
      feature: "ai-suggest-daily",
      model: "google/gemini-2.5-flash",
      tokens_in: aiResponse.usage?.prompt_tokens || 0,
      tokens_out: aiResponse.usage?.completion_tokens || 0,
    });

    return new Response(
      JSON.stringify({
        recommendations: content.recommendations || [],
        pattern: content.pattern || "",
        generated_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("ai-suggest-daily error:", msg);
    return new Response(
      JSON.stringify({
        error: "Não conseguimos gerar sua sugestão agora. Tente em alguns minutos.",
        detail: msg,
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});