import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildPayload(provider: string, title: string, text: string, url?: string) {
  if (provider === "slack") {
    return {
      text: `*${title}*\n${text}${url ? `\n<${url}|Abrir no Oxy>` : ""}`,
    };
  }
  if (provider === "discord") {
    return {
      embeds: [{
        title,
        description: text,
        url,
        color: 0x0ea5e9,
        timestamp: new Date().toISOString(),
      }],
    };
  }
  // teams (MessageCard)
  return {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    summary: title,
    themeColor: "0EA5E9",
    title,
    text,
    potentialAction: url ? [{
      "@type": "OpenUri",
      name: "Abrir no Oxy",
      targets: [{ os: "default", uri: url }],
    }] : undefined,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tenant_id, event, title, text, url, integration_id } = await req.json();
    if (!tenant_id || !title || !text) {
      return new Response(JSON.stringify({ error: "tenant_id, title, text required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let query = supabase.from("chat_integrations").select("*").eq("tenant_id", tenant_id).eq("active", true);
    if (integration_id) query = query.eq("id", integration_id);
    const { data: integrations } = await query;

    const results: any[] = [];
    for (const integ of integrations ?? []) {
      if (event && !integ.events.includes(event) && !integration_id) continue;
      const payload = buildPayload(integ.provider, title, text, url);
      try {
        const resp = await fetch(integ.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });
        const ok = resp.ok;
        await supabase.from("chat_integrations").update({ last_sent_at: new Date().toISOString() }).eq("id", integ.id);
        results.push({ id: integ.id, provider: integ.provider, ok, status: resp.status });
      } catch (e) {
        results.push({ id: integ.id, provider: integ.provider, ok: false, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ sent: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});