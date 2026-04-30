import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Tick central de automações. Aceita {job: "warehouse"|"anomalies"|"krs"|"notifications"|"reports"|"all"}.
 * Roda os jobs sequencialmente, encadeando RPCs e edge functions internas.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json().catch(() => ({}));
    const job = (body?.job as string) ?? "all";

    const { data: tenants } = await supabase.from("tenants").select("id");
    const tenantIds = (tenants ?? []).map((t: { id: string }) => t.id);

    const log: Array<{ job: string; tenant?: string; result: unknown }> = [];

    const run = async (j: string) => {
      for (const t of tenantIds) {
        if (j === "warehouse") {
          const { data } = await supabase.rpc("refresh_warehouse", { _tenant: t });
          log.push({ job: j, tenant: t, result: data });
        } else if (j === "anomalies") {
          const { data } = await supabase.rpc("detect_anomalies", { _tenant: t });
          log.push({ job: j, tenant: t, result: data });
        } else if (j === "krs") {
          const { data } = await supabase.rpc("kr_progress", { _tenant: t });
          log.push({ job: j, tenant: t, result: data });
        } else if (j === "notifications") {
          const { data } = await supabase.rpc("scan_notifications", { _tenant: t });
          log.push({ job: j, tenant: t, result: data });
        }
      }
      if (j === "reports") {
        // delega à função existente
        const r = await supabase.functions.invoke("send-scheduled-reports", { body: {} });
        log.push({ job: j, result: r.data });
      }
    };

    if (job === "all") {
      await run("warehouse");
      await run("krs");
      await run("anomalies");
      await run("notifications");
      await run("reports");
    } else {
      await run(job);
    }

    return new Response(JSON.stringify({ ok: true, ran: job, log }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});