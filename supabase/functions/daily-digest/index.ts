import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: prefs } = await sb.from("notification_preferences").select("*").eq("digest", "daily");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    let sent = 0;

    for (const p of prefs ?? []) {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: notifs } = await sb
        .from("notifications")
        .select("kind, title, body, severity")
        .eq("user_id", p.user_id)
        .gte("created_at", since)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!notifs || notifs.length === 0) continue;

      const { data: prof } = await sb.from("profiles").select("email, display_name").eq("id", p.user_id).maybeSingle();
      if (!prof?.email) continue;

      const items = notifs.map(n => `<li><strong>${n.title}</strong>${n.body ? ` — <span style="color:#64748b">${n.body}</span>` : ""}</li>`).join("");
      const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#f5f7fa;padding:32px">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
          <h1 style="margin:0 0 12px;font-size:20px">Resumo de hoje 📋</h1>
          <p style="color:#475569">Olá ${prof.display_name ?? ""}, ${notifs.length} novidades nas últimas 24h:</p>
          <ul style="line-height:1.8;color:#0f172a">${items}</ul>
        </div></body></html>`;

      if (resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: "Oxy <digest@resend.dev>", to: [prof.email], subject: "Seu resumo diário Oxy", html }),
        });
      } else {
        console.log(`[daily-digest DRY-RUN] would email ${prof.email}`);
      }
      sent += 1;
    }

    return new Response(JSON.stringify({ sent, mode: resendKey ? "live" : "dry_run" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
