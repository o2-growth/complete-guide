/**
 * process-demand
 *
 * Endpoints (POST /process-demand body { action, ... }):
 *
 *   action: "submit"
 *     body: { slug: string, payload: object, requester_name?, requester_email? }
 *     Public. Cria demand_submission no formulário cujo slug bate.
 *     Retorna { id, approval_token, approval_url }.
 *
 *   action: "decide"
 *     body: { token: uuid, decision: "approve" | "reject", note?: string }
 *     Public (autoriza por posse do token).
 *     Em "approve": cria task no projeto do form (ou inbox do tenant), liga
 *     submission.task_id e marca status="approved".
 *     Em "reject": marca status="rejected".
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SubmitSchema = z.object({
  action: z.literal("submit"),
  slug: z.string().trim().min(1).max(80),
  payload: z.record(z.unknown()),
  requester_name: z.string().trim().max(120).optional(),
  requester_email: z.string().trim().email().max(180).optional(),
});

const DecideSchema = z.object({
  action: z.literal("decide"),
  token: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(500).optional(),
});

const BodySchema = z.discriminatedUnion("action", [SubmitSchema, DecideSchema]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, 400);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  /* ---------------- SUBMIT ---------------- */
  if (parsed.data.action === "submit") {
    const { slug, payload, requester_name, requester_email } = parsed.data;

    const { data: form, error: fErr } = await admin
      .from("demand_forms")
      .select("id, tenant_id, active, title")
      .eq("slug", slug)
      .maybeSingle();
    if (fErr) return json({ error: fErr.message }, 500);
    if (!form || !form.active) return json({ error: "form not found" }, 404);

    const { data: sub, error: sErr } = await admin
      .from("demand_submissions")
      .insert({
        tenant_id: form.tenant_id,
        form_id: form.id,
        payload,
        requester_name: requester_name ?? null,
        requester_email: requester_email ?? null,
        status: "pending",
      })
      .select("id, approval_token")
      .single();
    if (sErr) return json({ error: sErr.message }, 500);

    const origin = req.headers.get("origin") ?? "";
    const approval_url = origin
      ? `${origin}/aprovar/${sub.approval_token}`
      : `/aprovar/${sub.approval_token}`;

    return json({
      id: sub.id,
      approval_token: sub.approval_token,
      approval_url,
      form_title: form.title,
    });
  }

  /* ---------------- DECIDE ---------------- */
  const { token, decision, note } = parsed.data;

  const { data: sub, error: subErr } = await admin
    .from("demand_submissions")
    .select("id, tenant_id, form_id, status, payload, requester_name, requester_email, task_id")
    .eq("approval_token", token)
    .maybeSingle();
  if (subErr) return json({ error: subErr.message }, 500);
  if (!sub) return json({ error: "submission not found" }, 404);
  if (sub.status !== "pending") {
    return json({ error: "already decided", status: sub.status }, 409);
  }

  if (decision === "reject") {
    const { error } = await admin
      .from("demand_submissions")
      .update({ status: "rejected", payload: { ...(sub.payload as object), reject_note: note ?? null } })
      .eq("id", sub.id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, status: "rejected" });
  }

  // approve: cria tarefa
  const { data: form } = await admin
    .from("demand_forms")
    .select("project_id, squad_id, title")
    .eq("id", sub.form_id)
    .maybeSingle();

  let projectId = form?.project_id ?? null;
  if (!projectId) {
    // pega o primeiro projeto do tenant (fallback: inbox/qualquer)
    const { data: anyProject } = await admin
      .from("projects")
      .select("id")
      .eq("tenant_id", sub.tenant_id)
      .eq("archived", false)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    projectId = anyProject?.id ?? null;
  }
  if (!projectId) {
    return json({ error: "tenant has no project to receive the task" }, 422);
  }

  const p = sub.payload as Record<string, unknown>;
  const title =
    typeof p.title === "string" && p.title.trim()
      ? String(p.title).slice(0, 200)
      : `Demanda: ${form?.title ?? "nova solicitação"}`;
  const description =
    typeof p.description === "string"
      ? String(p.description).slice(0, 4000)
      : Object.entries(p)
          .filter(([k]) => k !== "title")
          .map(([k, v]) => `**${k}:** ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
          .join("\n\n");

  // Status inicial = "todo" do tenant (se houver)
  const { data: todoStatus } = await admin
    .from("task_statuses")
    .select("id")
    .eq("tenant_id", sub.tenant_id)
    .eq("slug", "todo")
    .maybeSingle();

  const { data: task, error: tErr } = await admin
    .from("tasks")
    .insert({
      tenant_id: sub.tenant_id,
      project_id: projectId,
      title,
      description,
      priority: "medium",
      status_id: todoStatus?.id ?? null,
      number: 0, // trigger seta
      custom_fields: {
        from_demand: true,
        submission_id: sub.id,
        requester_name: sub.requester_name,
        requester_email: sub.requester_email,
        approver_note: note ?? null,
      },
    })
    .select("id, code")
    .single();
  if (tErr) return json({ error: tErr.message }, 500);

  const { error: updErr } = await admin
    .from("demand_submissions")
    .update({ status: "approved", task_id: task.id })
    .eq("id", sub.id);
  if (updErr) return json({ error: updErr.message }, 500);

  return json({ ok: true, status: "approved", task_id: task.id, task_code: task.code });
});