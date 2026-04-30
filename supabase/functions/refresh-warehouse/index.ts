import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let tenants: string[] = [];
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body?.tenant_id) tenants = [body.tenant_id as string];
    }
    if (tenants.length === 0) {
      const { data } = await supabase.from("tenants").select("id");
      tenants = (data ?? []).map((t: { id: string }) => t.id);
    }

    const results: Array<{ tenant: string; rows: unknown }> = [];
    for (const t of tenants) {
      const { data, error } = await supabase.rpc("refresh_warehouse", { _tenant: t });
      if (error) {
        results.push({ tenant: t, rows: { error: error.message } });
      } else {
        results.push({ tenant: t, rows: data });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});