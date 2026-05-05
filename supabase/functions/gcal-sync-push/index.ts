import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OAuthConn {
  id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
}

async function ensureFreshToken(
  supabase: SupabaseClient,
  conn: OAuthConn,
): Promise<string> {
  const expiresAt = conn.expires_at ? new Date(conn.expires_at).getTime() : 0;
  if (expiresAt - Date.now() > 60_000) return conn.access_token;
  if (!conn.refresh_token) return conn.access_token;

  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) return conn.access_token;

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: conn.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) return conn.access_token;
  const j = await r.json();
  const newToken = j.access_token as string;
  const newExpiresAt = new Date(Date.now() + (j.expires_in ?? 3600) * 1000).toISOString();
  await supabase.from("oauth_connections")
    .update({ access_token: newToken, expires_at: newExpiresAt })
    .eq("id", conn.id);
  return newToken;
}

function buildEventBody(t: {
  title: string; description: string | null;
  start_at: string | null; due_at: string;
}) {
  return {
    summary: t.title,
    description: t.description ?? undefined,
    start: { dateTime: t.start_at ?? t.due_at },
    end: { dateTime: t.due_at },
  };
}

async function pushForUser(
  supabase: SupabaseClient,
  config: {
    user_id: string; tenant_id: string; oauth_connection_id: string;
    target_calendar_id: string; last_push_at: string | null;
  },
): Promise<{ ok: boolean; processed: number; error?: string }> {
  const { data: conn } = await supabase.from("oauth_connections")
    .select("id, access_token, refresh_token, expires_at")
    .eq("id", config.oauth_connection_id).maybeSingle();
  if (!conn?.access_token) return { ok: false, processed: 0, error: "no_oauth" };

  const token = await ensureFreshToken(supabase, conn as OAuthConn);
  const calId = encodeURIComponent(config.target_calendar_id);
  const since = config.last_push_at ?? new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: tasks } = await supabase.from("tasks")
    .select("id, title, description, start_at, due_at, archived, gcal_event_id, gcal_etag, updated_at")
    .eq("tenant_id", config.tenant_id)
    .eq("assignee_id", config.user_id)
    .gt("updated_at", since)
    .limit(500);

  let processed = 0;
  for (const t of (tasks ?? []) as Array<{
    id: string; title: string; description: string | null;
    start_at: string | null; due_at: string | null;
    archived: boolean; gcal_event_id: string | null;
  }>) {
    try {
      // Archived + linked → DELETE
      if (t.archived && t.gcal_event_id) {
        const r = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${encodeURIComponent(t.gcal_event_id)}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
        );
        if (r.ok || r.status === 404 || r.status === 410) {
          await supabase.from("tasks").update({
            gcal_event_id: null, gcal_etag: null,
            gcal_last_synced_at: new Date().toISOString(),
          }).eq("id", t.id);
          processed++;
        }
        continue;
      }
      if (t.archived || !t.due_at) continue;

      const body = buildEventBody({ title: t.title, description: t.description, start_at: t.start_at, due_at: t.due_at });

      if (t.gcal_event_id) {
        const r = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${encodeURIComponent(t.gcal_event_id)}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              ...(t.gcal_etag ? { "If-Match": "*" } : {}),
            },
            body: JSON.stringify(body),
          },
        );
        if (r.ok) {
          const j = await r.json();
          await supabase.from("tasks").update({
            gcal_etag: j.etag ?? null,
            gcal_calendar_id: config.target_calendar_id,
            gcal_last_synced_at: new Date().toISOString(),
          }).eq("id", t.id);
          processed++;
        }
      } else {
        const r = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calId}/events`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        if (r.ok) {
          const j = await r.json();
          await supabase.from("tasks").update({
            gcal_event_id: j.id,
            gcal_etag: j.etag ?? null,
            gcal_calendar_id: config.target_calendar_id,
            gcal_last_synced_at: new Date().toISOString(),
          }).eq("id", t.id);
          processed++;
        }
      }
    } catch (_e) {
      // continue with next task
    }
  }

  await supabase.from("gcal_sync_config")
    .update({ last_push_at: new Date().toISOString() })
    .eq("user_id", config.user_id);

  return { ok: true, processed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: configs } = await supabase.from("gcal_sync_config")
      .select("user_id, tenant_id, oauth_connection_id, target_calendar_id, last_push_at")
      .eq("sync_push_enabled", true);

    const results: Array<Record<string, unknown>> = [];
    for (const cfg of (configs ?? [])) {
      try {
        const out = await withErrorBoundary(
          () => pushForUser(supabase, cfg),
          { source: "gcal-sync-push", timeoutMs: 25000, retries: 3, baseDelayMs: 500,
            fallback: () => ({ ok: false, processed: 0, error: "fallback" }) },
        );
        results.push({ user_id: cfg.user_id, ...out });
      } catch (e) {
        results.push({ user_id: cfg.user_id, ok: false, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});