import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Condition { field: string; op: string; value: unknown }
interface Action { kind: string; params: Record<string, unknown> }

function evalCondition(cond: Condition, payload: Record<string, unknown>): boolean {
  const actual = (payload as Record<string, unknown>)[cond.field];
  switch (cond.op) {
    case "eq": return actual === cond.value;
    case "ne": return actual !== cond.value;
    case "in": return Array.isArray(cond.value) && (cond.value as unknown[]).includes(actual);
    case "exists": return actual !== null && actual !== undefined;
    case "not_exists": return actual === null || actual === undefined;
    default: return true;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, key);
    const body = await req.json().catch(() => ({}));
    const tenantFilter = body?.tenant_id as string | undefined;

    let q = sb.from("automation_events").select("*").is("processed_at", null).order("created_at").limit(100);
    if (tenantFilter) q = q.eq("tenant_id", tenantFilter);
    const { data: events, error: evErr } = await q;
    if (evErr) throw evErr;

    let processed = 0;
    for (const ev of events ?? []) {
      const { data: rules } = await sb
        .from("automation_rules")
        .select("*")
        .eq("tenant_id", ev.tenant_id)
        .eq("trigger_event", ev.event)
        .eq("active", true);

      for (const rule of rules ?? []) {
        const conds = (rule.conditions as Condition[]) ?? [];
        const ok = conds.every(c => evalCondition(c, ev.payload as Record<string, unknown>));
        if (!ok) {
          await sb.from("automation_runs").insert({
            tenant_id: ev.tenant_id, rule_id: rule.id, trigger_event: ev.event,
            payload: ev.payload, status: "skipped", actions_executed: 0,
          });
          continue;
        }
        const actions = (rule.actions as Action[]) ?? [];
        let executed = 0;
        let error: string | null = null;
        try {
          for (const a of actions) {
            await runAction(sb, ev.tenant_id, ev.payload as Record<string, unknown>, a);
            executed += 1;
          }
        } catch (e) {
          error = (e as Error).message;
        }
        await sb.from("automation_runs").insert({
          tenant_id: ev.tenant_id, rule_id: rule.id, trigger_event: ev.event,
          payload: ev.payload, status: error ? "failed" : "ok", error, actions_executed: executed,
        });
        await sb.from("automation_rules").update({
          run_count: (rule.run_count ?? 0) + 1, last_run_at: new Date().toISOString(),
        }).eq("id", rule.id);
      }
      await sb.from("automation_events").update({ processed_at: new Date().toISOString() }).eq("id", ev.id);
      processed += 1;
    }
    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function runAction(sb: ReturnType<typeof createClient>, tenantId: string, payload: Record<string, unknown>, a: Action) {
  const p = a.params || {};
  switch (a.kind) {
    case "create_task": {
      await sb.from("tasks").insert({
        tenant_id: tenantId,
        project_id: (p.project_id as string) ?? (payload.project_id as string),
        title: (p.title as string) || "Tarefa via automação",
        priority: (p.priority as string) ?? "medium",
      });
      break;
    }
    case "set_status": {
      const taskId = payload.task_id as string;
      if (taskId && p.status_id) {
        await sb.from("tasks").update({ status_id: p.status_id as string }).eq("id", taskId);
      }
      break;
    }
    case "assign_to": {
      const taskId = payload.task_id as string;
      if (taskId && p.user_id) {
        await sb.from("tasks").update({ assignee_id: p.user_id as string }).eq("id", taskId);
      }
      break;
    }
    case "notify": {
      if (p.user_id) {
        await sb.from("notifications").insert({
          tenant_id: tenantId,
          user_id: p.user_id as string,
          kind: "system",
          severity: "info",
          title: (p.title as string) || "Alerta de automação",
          body: (p.body as string) || null,
          link: payload.task_id ? `/app/projetos` : null,
          payload,
        });
      }
      break;
    }
    case "chat_notify": {
      await sb.functions.invoke("chat-notify", {
        body: { tenant_id: tenantId, title: (p.title as string) || "Automação disparada", text: (p.text as string) || JSON.stringify(payload).slice(0, 200) },
      });
      break;
    }
    case "webhook": {
      await sb.rpc("enqueue_webhook", { tenant_id: tenantId, event: "automation.triggered", payload });
      break;
    }
  }
}
