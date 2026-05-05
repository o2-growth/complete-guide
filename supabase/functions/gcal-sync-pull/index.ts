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

interface GCalEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  etag?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

async function pullForUser(
  supabase: SupabaseClient,
  config: {
    user_id: string; tenant_id: string; oauth_connection_id: string;
    target_calendar_id: string; last_pull_sync_token: string | null;
  },
): Promise<{ ok: boolean; processed: number; error?: string }> {
  const { data: conn } = await supabase.from("oauth_connections")
    .select("id, access_token, refresh_token, expires_at")
    .eq("id", config.oauth_connection_id).maybeSingle();
  if (!conn?.access_token) return { ok: false, processed: 0, error: "no_oauth" };

  const token = await ensureFreshToken(supabase, conn as OAuthConn);
  const calId = encodeURIComponent(config.target_calendar_id);

  // Pick a fallback project for new task creation
  const { data: anyProject } = await supabase.from("projects")
    .select("id").eq("tenant_id", config.tenant_id).limit(1).maybeSingle();
  const fallbackProjectId = anyProject?.id ?? null;

  let pageToken: string | undefined;
  let syncToken: string | null = config.last_pull_sync_token;
  let nextSyncToken: string | null = syncToken;
  let processed = 0;

  do {
    const params = new URLSearchParams();
    if (syncToken) params.set("syncToken", syncToken);
    else {
      params.set("timeMin", new Date(Date.now() - 30 * 86400000).toISOString());
      params.set("singleEvents", "true");
    }
    if (pageToken) params.set("pageToken", pageToken);
    params.set("maxResults", "250");

    const r = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (r.status === 410) {
      // sync token invalid — restart full sync
      syncToken = null;
      pageToken = undefined;
      continue;
    }
    if (!r.ok) {
      const t = await r.text();
      return { ok: false, processed, error: `gcal_${r.status}: ${t.slice(0, 200)}` };
    }
    const j = await r.json();
    const items: GCalEvent[] = j.items ?? [];

    for (const ev of items) {
      const dueAt = ev.end?.dateTime ?? (ev.end?.date ? `${ev.end.date}T23:59:59Z` : null);
      const startAt = ev.start?.dateTime ?? (ev.start?.date ? `${ev.start.date}T00:00:00Z` : null);

      const { data: existing } = await supabase.from("tasks")
        .select("id").eq("gcal_event_id", ev.id).maybeSingle();

      if (ev.status === "cancelled") {
        if (existing) {
          await supabase.from("tasks")
            .update({ archived: true, gcal_last_synced_at: new Date().toISOString() })
            .eq("id", existing.id);
          processed++;
        }
        continue;
      }

      const payload = {
        title: ev.summary ?? "(sem título)",
        description: ev.description ?? null,
        due_at: dueAt,
        start_at: startAt,
        gcal_etag: ev.etag ?? null,
        gcal_calendar_id: config.target_calendar_id,
        gcal_last_synced_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from("tasks").update(payload).eq("id", existing.id);
      } else if (fallbackProjectId) {
        await supabase.from("tasks").insert({
          ...payload,
          tenant_id: config.tenant_id,
          project_id: fallbackProjectId,
          assignee_id: config.user_id,
          gcal_event_id: ev.id,
        });
      }
      processed++;
    }

    pageToken = j.nextPageToken;
    if (j.nextSyncToken) nextSyncToken = j.nextSyncToken;
  } while (pageToken);

  if (nextSyncToken && nextSyncToken !== config.last_pull_sync_token) {
    await supabase.from("gcal_sync_config")
      .update({ last_pull_sync_token: nextSyncToken })
      .eq("user_id", config.user_id);
  }

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
      .select("user_id, tenant_id, oauth_connection_id, target_calendar_id, last_pull_sync_token")
      .eq("sync_pull_enabled", true);

    const results: Array<Record<string, unknown>> = [];
    for (const cfg of (configs ?? [])) {
      try {
        const out = await withErrorBoundary(
          () => pullForUser(supabase, cfg),
          { source: "gcal-sync-pull", timeoutMs: 25000, retries: 3, baseDelayMs: 500,
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