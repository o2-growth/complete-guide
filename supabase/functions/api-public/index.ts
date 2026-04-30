import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Auth: X-API-Key header
  const apiKey = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!apiKey) return json({ error: "Missing X-API-Key" }, 401);

  const hash = await sha256(apiKey);
  const { data: token } = await supabase.from("api_tokens").select("*").eq("token_hash", hash).maybeSingle();
  if (!token || token.revoked_at || (token.expires_at && new Date(token.expires_at) < new Date())) {
    return json({ error: "Invalid or expired token" }, 401);
  }

  await supabase.from("api_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", token.id);

  const url = new URL(req.url);
  // path looks like: /api-public/<resource> (after function name)
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("api-public");
  const resource = idx >= 0 ? parts[idx + 1] : parts[parts.length - 1];
  const id = idx >= 0 ? parts[idx + 2] : undefined;
  const tenantId = token.tenant_id;

  try {
    if (resource === "tasks") {
      if (req.method === "GET" && !id) {
        const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);
        const { data, error } = await supabase.from("tasks").select("id,title,status,priority,due_date,assignee_id,project_id,created_at")
          .eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(limit);
        if (error) return json({ error: error.message }, 500);
        return json({ data });
      }
      if (req.method === "GET" && id) {
        const { data, error } = await supabase.from("tasks").select("*").eq("tenant_id", tenantId).eq("id", id).maybeSingle();
        if (error) return json({ error: error.message }, 500);
        return data ? json({ data }) : json({ error: "Not found" }, 404);
      }
      if (req.method === "POST" && !id) {
        if (!token.scopes.includes("write")) return json({ error: "Token lacks 'write' scope" }, 403);
        const body = await req.json();
        const { data, error } = await supabase.from("tasks").insert({
          tenant_id: tenantId,
          title: body.title,
          status: body.status ?? "todo",
          priority: body.priority ?? 3,
          due_date: body.due_date ?? null,
          project_id: body.project_id ?? null,
          assignee_id: body.assignee_id ?? null,
          created_by: token.created_by,
        }).select().maybeSingle();
        if (error) return json({ error: error.message }, 500);
        return json({ data }, 201);
      }
    }

    if (resource === "projects" && req.method === "GET") {
      const { data, error } = await supabase.from("projects").select("id,name,squad_id,status,created_at")
        .eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(100);
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }

    if (resource === "anomalies" && req.method === "GET") {
      const { data, error } = await supabase.from("metric_anomalies").select("*")
        .eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(100);
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }

    if (resource === "ping") {
      return json({ ok: true, tenant_id: tenantId, scopes: token.scopes });
    }

    return json({ error: "Unknown resource", available: ["tasks", "projects", "anomalies", "ping"] }, 404);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});