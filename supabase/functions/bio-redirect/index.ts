import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GET /bio-redirect?id=<bio_link_id>
 * Registra clique e devolve 302 para a URL final com UTMs.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return new Response("missing id", { status: 400, headers: corsHeaders });

    const { data: link, error } = await supabase
      .from("bio_links")
      .select("id, tenant_id, url, active, utm_source, utm_medium, utm_campaign, utm_content, starts_at, ends_at")
      .eq("id", id)
      .maybeSingle();
    if (error || !link || !link.active) {
      return new Response("not found", { status: 404, headers: corsHeaders });
    }
    const now = Date.now();
    if (link.starts_at && new Date(link.starts_at).getTime() > now) {
      return new Response("not yet active", { status: 410, headers: corsHeaders });
    }
    if (link.ends_at && new Date(link.ends_at).getTime() < now) {
      return new Response("expired", { status: 410, headers: corsHeaders });
    }

    // monta URL final com UTMs
    const target = new URL(link.url);
    const set = (k: string, v: string | null | undefined) => {
      if (v && !target.searchParams.has(k)) target.searchParams.set(k, v);
    };
    set("utm_source", link.utm_source);
    set("utm_medium", link.utm_medium);
    set("utm_campaign", link.utm_campaign);
    set("utm_content", link.utm_content);

    const ua = req.headers.get("user-agent") ?? "";
    const referer = req.headers.get("referer") ?? "";
    const country = req.headers.get("cf-ipcountry") ?? req.headers.get("x-country") ?? null;
    const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";

    // fire-and-forget: insere clique e incrementa contador
    await supabase.from("link_clicks").insert({
      tenant_id: link.tenant_id,
      bio_link_id: link.id,
      utm_source: link.utm_source,
      utm_medium: link.utm_medium,
      utm_campaign: link.utm_campaign,
      utm_content: link.utm_content,
      referer, user_agent: ua, country, device,
    });
    // incrementa contador (read+write — sem race crítica em link-in-bio)
    const { data: cur } = await supabase.from("bio_links").select("clicks").eq("id", link.id).maybeSingle();
    await supabase.from("bio_links").update({ clicks: (cur?.clicks ?? 0) + 1 }).eq("id", link.id);

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: target.toString() },
    });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "erro", {
      status: 500, headers: corsHeaders,
    });
  }
});