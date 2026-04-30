import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Varre scheduled_publishes pendentes com scheduled_at <= now() e dispara social-publish para cada um.
 * Pode ser chamado por:
 *  - cron externo (HTTP)
 *  - efeito do client (best-effort no foreground)
 *  - pg_net (se pg_cron for habilitado depois)
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: pendings } = await supabase
    .from("scheduled_publishes")
    .select("id")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(20);

  const list = pendings ?? [];
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const p of list) {
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/social-publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ publishId: p.id }),
      });
      const j = await r.json().catch(() => ({}));
      results.push({ id: p.id, ok: r.ok, error: r.ok ? undefined : (j.error ?? "fail") });
    } catch (e) {
      results.push({ id: p.id, ok: false, error: e instanceof Error ? e.message : "fail" });
    }
  }

  return new Response(JSON.stringify({ processed: list.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});