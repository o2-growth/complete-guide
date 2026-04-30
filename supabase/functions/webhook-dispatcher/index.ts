import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacSha256(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: pending, error } = await supabase.rpc("pending_webhook_deliveries", { _limit: 50 });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];
  for (const d of pending ?? []) {
    const body = JSON.stringify({ event: d.event, payload: d.payload, ts: new Date().toISOString() });
    const sig = await hmacSha256(d.secret, body);
    let httpStatus = 0;
    let respBody = "";
    let ok = false;
    try {
      const resp = await fetch(d.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Oxy-Signature": `sha256=${sig}`,
          "X-Oxy-Event": d.event,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });
      httpStatus = resp.status;
      respBody = (await resp.text()).slice(0, 500);
      ok = resp.ok;
    } catch (e) {
      respBody = String(e).slice(0, 500);
    }
    const newAttempts = d.attempts + 1;
    const status = ok ? "sent" : (newAttempts >= 5 ? "failed" : "pending");
    await supabase.from("webhook_deliveries").update({
      status,
      http_status: httpStatus || null,
      response_body: respBody || null,
      attempts: newAttempts,
      delivered_at: ok ? new Date().toISOString() : null,
    }).eq("id", d.delivery_id);
    if (ok) {
      await supabase.from("webhooks").update({
        last_delivery_at: new Date().toISOString(),
        last_status: httpStatus,
      }).eq("id", d.webhook_id);
    }
    results.push({ id: d.delivery_id, ok, status: httpStatus });
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});