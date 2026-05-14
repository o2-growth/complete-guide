import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { invitation_id } = await req.json();
    if (!invitation_id) throw new Error("invitation_id required");

    const { data: inv, error } = await sb
      .from("invitations")
      .select("*")
      .eq("id", invitation_id)
      .maybeSingle();
    if (error) {
      console.error("[send-invite] query error:", error);
      throw new Error(`invitation lookup failed: ${error.message}`);
    }
    if (!inv) throw new Error(`invitation not found: ${invitation_id}`);

    const { data: tenant } = await sb
      .from("tenants")
      .select("name, primary_color")
      .eq("id", inv.tenant_id)
      .maybeSingle();

    const baseUrl = req.headers.get("origin") || "https://app.example.com";
    const acceptUrl = `${baseUrl}/aceitar-convite/${inv.token}`;
    const tenantName = tenant?.name ?? "workspace";

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      // dry-run: registra link no log
      console.log(`[send-invite DRY-RUN] would email ${inv.email} → ${acceptUrl}`);
      return new Response(JSON.stringify({ status: "dry_run", accept_url: acceptUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#f5f7fa;padding:32px">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,.06)">
        <h1 style="margin:0 0 12px;font-size:22px">Você foi convidado para <strong>${tenantName}</strong></h1>
        <p style="color:#475569;line-height:1.6">Você recebeu um convite para colaborar como <strong>${inv.role}</strong> no workspace <strong>${tenantName}</strong> no Oxy Growth OS.</p>
        <p style="margin:24px 0">
          <a href="${acceptUrl}" style="background:#0ea5e9;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Aceitar convite</a>
        </p>
        <p style="color:#94a3b8;font-size:12px">Este convite expira em 14 dias.</p>
      </div></body></html>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Oxy <onboarding@resend.dev>",
        to: [inv.email],
        subject: `Convite para ${tenantName} no Oxy Growth OS`,
        html,
      }),
    });
    const result = await r.json();
    return new Response(JSON.stringify({ status: "sent", result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
