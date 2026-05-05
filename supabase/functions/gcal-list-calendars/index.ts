import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { data: conn } = await supabase
      .from("oauth_connections")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle();

    if (!conn?.access_token) {
      return new Response(
        JSON.stringify([{ id: "primary", summary: "Calendário principal", primary: true }]),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const r = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${conn.access_token}` },
    });
    const json = await r.json();
    const calendars = (json.items || []).map((c: { id: string; summary: string; primary?: boolean }) => ({
      id: c.id, summary: c.summary, primary: !!c.primary,
    }));
    return new Response(JSON.stringify(calendars), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(
      JSON.stringify([{ id: "primary", summary: "Calendário principal", primary: true }]),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});