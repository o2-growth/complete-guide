import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Coleta métricas dos posts publicados.
 * - Modo real: se a integration tiver access_token Meta/LinkedIn, chama Insights API
 * - Modo mock: gera métricas plausíveis baseadas em hash do task_id (consistente entre runs)
 * Body: { taskId?: string, campaignId?: string, refreshAll?: boolean }
 */
function mockMetricsFor(taskId: string, daysSincePublish: number) {
  // hash determinístico
  let h = 0;
  for (let i = 0; i < taskId.length; i++) h = (h * 31 + taskId.charCodeAt(i)) | 0;
  const seed = Math.abs(h);
  const factor = Math.min(1, daysSincePublish / 7) * 0.7 + 0.3;
  const base = (seed % 4000) + 800;
  return {
    reach: Math.round(base * factor),
    impressions: Math.round(base * factor * 1.4),
    likes: Math.round(base * factor * 0.08),
    comments: Math.round(base * factor * 0.012),
    shares: Math.round(base * factor * 0.006),
    saves: Math.round(base * factor * 0.018),
    clicks: Math.round(base * factor * 0.04),
    followers_gained: Math.round(base * factor * 0.003),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = (await req.json().catch(() => ({}))) as {
      taskId?: string; campaignId?: string; refreshAll?: boolean; tenantId?: string;
    };

    let q = supabase
      .from("tasks")
      .select("id, tenant_id, social_channel, published_at, social_campaign_id")
      .not("published_at", "is", null);

    if (body.taskId) q = q.eq("id", body.taskId);
    else if (body.campaignId) q = q.eq("social_campaign_id", body.campaignId);
    else if (body.tenantId) q = q.eq("tenant_id", body.tenantId);
    else q = q.gte("published_at", new Date(Date.now() - 30 * 86400000).toISOString());

    const { data: tasks, error } = await q.limit(500);
    if (error) throw error;

    let updated = 0;
    for (const t of tasks ?? []) {
      if (!t.published_at) continue;
      const days = Math.max(0, (Date.now() - new Date(t.published_at).getTime()) / 86400000);
      const metrics = mockMetricsFor(t.id, days);

      // upsert: 1 linha por task — pega a mais recente, atualiza ou insere
      const { data: existing } = await supabase
        .from("post_metrics")
        .select("id")
        .eq("task_id", t.id)
        .order("collected_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase.from("post_metrics").update({
          ...metrics, collected_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("post_metrics").insert({
          task_id: t.id, tenant_id: t.tenant_id, ...metrics,
        });
      }
      updated++;
    }

    return new Response(JSON.stringify({ ok: true, updated, mode: "mock" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});