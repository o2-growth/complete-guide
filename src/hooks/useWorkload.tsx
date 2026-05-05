import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { queryProfile } from "@/lib/query-config";
import { toast } from "sonner";

export interface WorkloadTask {
  id: string;
  title: string;
  code: string | null;
  priority: "none" | "low" | "medium" | "high" | "urgent";
  assignee_id: string | null;
  due_at: string | null;
  estimate_minutes: number | null;
  status_id: string | null;
  type_id: string | null;
  project_id: string;
}

export interface MemberLite {
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  capacity_minutes_day: number;
}

/**
 * Lista pessoas do tenant com capacidade diária estimada.
 * Capacidade vem da soma de squad_members.capacity_hours_week (default 40h/sem).
 */
export function useTenantMembers() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["tenant-members", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<MemberLite[]> => {
      const { data: members, error } = await supabase
        .from("tenant_members")
        .select("user_id, role")
        .eq("tenant_id", tenantId!);
      if (error) throw error;
      const ids = (members ?? []).map((m) => m.user_id);
      if (ids.length === 0) return [];
      const [{ data: profiles }, { data: squads }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, full_name, email, avatar_url")
          .in("id", ids),
        supabase
          .from("squad_members")
          .select("user_id, capacity_hours_week, squad_id, squads!inner(tenant_id)")
          .in("user_id", ids)
          .eq("squads.tenant_id", tenantId!),
      ]);
      const capByUser = new Map<string, number>();
      (squads ?? []).forEach((s) => {
        const cur = capByUser.get(s.user_id) ?? 0;
        capByUser.set(s.user_id, cur + Number(s.capacity_hours_week ?? 0));
      });
      return (members ?? []).map((m) => {
        const p = (profiles ?? []).find((x) => x.id === m.user_id);
        const hoursWeek = capByUser.get(m.user_id) ?? 40;
        return {
          user_id: m.user_id,
          display_name: p?.display_name ?? null,
          full_name: p?.full_name ?? null,
          email: p?.email ?? null,
          avatar_url: p?.avatar_url ?? null,
          role: m.role,
          // 5 dias úteis
          capacity_minutes_day: Math.round((hoursWeek * 60) / 5),
        };
      });
    },
  });
}

/**
 * Tarefas dentro de [from, to] com due_at não nulo, do tenant. Usadas no heatmap.
 */
export function useWorkloadTasks(from: Date | null, to: Date | null) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: [
      "workload-tasks",
      tenantId,
      from?.toISOString(),
      to?.toISOString(),
    ],
    enabled: !!tenantId && !!from && !!to,
    queryFn: async (): Promise<WorkloadTask[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "id, title, code, priority, assignee_id, due_at, estimate_minutes, status_id, type_id, project_id"
        )
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .is("done_at", null)
        .not("due_at", "is", null)
        .gte("due_at", from!.toISOString())
        .lte("due_at", to!.toISOString())
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as WorkloadTask[];
    },
  });
}

/**
 * Reatribui uma tarefa para outro usuário e/ou outra data.
 * Usado no drag entre células do heatmap.
 */
export function useReassignTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      assigneeId,
      newDate,
      currentDueAt,
    }: {
      taskId: string;
      assigneeId: string | null;
      newDate?: Date | null;
      currentDueAt?: string | null;
    }) => {
      const patch: { assignee_id: string | null; due_at?: string } = {
        assignee_id: assigneeId,
      };
      if (newDate) {
        const target = new Date(newDate);
        if (currentDueAt) {
          const prev = new Date(currentDueAt);
          target.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
        } else {
          target.setHours(9, 0, 0, 0);
        }
        patch.due_at = target.toISOString();
      }
      const { error } = await supabase.from("tasks").update(patch).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tarefa realocada");
      qc.invalidateQueries({ queryKey: ["workload-tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

/* --------------- Assignment Matrix --------------- */

export interface AssignmentRule {
  id: string;
  tenant_id: string;
  project_id: string | null;
  type_id: string | null;
  status_id: string | null;
  assignee_id: string | null;
  priority: number;
}

export function useAssignmentMatrix() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["assignment-matrix", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<AssignmentRule[]> => {
      const { data, error } = await supabase
        .from("assignment_matrix")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("priority", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AssignmentRule[];
    },
  });
}

export function useUpsertAssignmentRule() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (rule: Partial<AssignmentRule> & { assignee_id: string }) => {
      if (!tenantId) throw new Error("Workspace ainda não pronto");
      const payload = {
        tenant_id: tenantId,
        project_id: rule.project_id ?? null,
        type_id: rule.type_id ?? null,
        status_id: rule.status_id ?? null,
        assignee_id: rule.assignee_id,
        priority: rule.priority ?? 0,
      };
      if (rule.id) {
        const { error } = await supabase
          .from("assignment_matrix")
          .update(payload)
          .eq("id", rule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("assignment_matrix").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Regra salva");
      qc.invalidateQueries({ queryKey: ["assignment-matrix"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteAssignmentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assignment_matrix").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regra removida");
      qc.invalidateQueries({ queryKey: ["assignment-matrix"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

/* --------------- User Workload (carga semanal por usuário) --------------- */

export type WorkloadStatus = "low" | "mid" | "high" | "overload";

export interface UserWorkload {
  user_id: string;
  tenant_id: string;
  week_start: string;
  allocated_minutes: number;
  capacity_minutes: number;
  percentage: number;
  status: WorkloadStatus;
}

function startOfCurrentWeekISO(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0=domingo
  // date_trunc('week', ...) no Postgres usa segunda como início; replicamos.
  const diff = (day + 6) % 7; // 0 se segunda
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff, 0, 0, 0));
  return monday.toISOString();
}

function statusFromPct(pct: number): WorkloadStatus {
  if (pct >= 100) return "overload";
  if (pct >= 80) return "high";
  if (pct >= 50) return "mid";
  return "low";
}

/**
 * Carga semanal de um usuário lida da MV mv_workload_by_user.
 * Capacidade vem de user_capacity (autoritativa) com fallback para
 * a soma de squad_members.capacity_hours_week (default 40h/sem).
 *
 * Profile realtime (10s stale) — a MV é refreshada a cada 5min via pg_cron,
 * então não vale segurar mais que isso.
 */
export function useUserWorkload(userId: string | null | undefined, tenantId?: string | null) {
  const ws = useWorkspace();
  const tenant = tenantId ?? ws.tenantId ?? null;
  const weekStart = startOfCurrentWeekISO();

  return useQuery({
    ...queryProfile("realtime"),
    queryKey: ["user-workload", tenant, userId, weekStart],
    enabled: !!tenant && !!userId,
    queryFn: async (): Promise<UserWorkload> => {
      const [{ data: mv }, { data: cap }, { data: squads }] = await Promise.all([
        supabase
          .from("mv_workload_by_user")
          .select("estimated_minutes, spent_minutes, task_count, week_start")
          .eq("tenant_id", tenant!)
          .eq("user_id", userId!)
          .eq("week_start", weekStart)
          .maybeSingle(),
        supabase
          .from("user_capacity")
          .select("hours_per_week")
          .eq("tenant_id", tenant!)
          .eq("user_id", userId!)
          .maybeSingle(),
        supabase
          .from("squad_members")
          .select("capacity_hours_week, squads!inner(tenant_id)")
          .eq("user_id", userId!)
          .eq("squads.tenant_id", tenant!),
      ]);

      const allocated = Number(mv?.estimated_minutes ?? 0);
      const capacityHoursFromUserCap = Number(cap?.hours_per_week ?? 0);
      const capacityHoursFromSquads = (squads ?? []).reduce(
        (acc, s) => acc + Number(s.capacity_hours_week ?? 0),
        0,
      );
      const capacityHours =
        capacityHoursFromUserCap > 0
          ? capacityHoursFromUserCap
          : capacityHoursFromSquads > 0
            ? capacityHoursFromSquads
            : 40;
      const capacityMinutes = Math.round(capacityHours * 60);
      const pct = capacityMinutes > 0 ? Math.round((allocated / capacityMinutes) * 100) : 0;

      return {
        user_id: userId!,
        tenant_id: tenant!,
        week_start: weekStart,
        allocated_minutes: allocated,
        capacity_minutes: capacityMinutes,
        percentage: pct,
        status: statusFromPct(pct),
      };
    },
  });
}

export function useProjects() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["projects", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, key, color")
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* --------------- Team Workload (carga agregada por membro) --------------- */

export interface TeamWorkloadMember {
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  capacity_minutes_week: number;
  allocated_minutes_week: number;
  percentage: number;
  status: WorkloadStatus;
  open_tasks: number;
  overdue_tasks: number;
  next_due_at: string | null;
  next_task_title: string | null;
}

function weekStartUTC(anchor: Date): Date {
  const day = anchor.getUTCDay();
  const diff = (day + 6) % 7;
  return new Date(
    Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate() - diff, 0, 0, 0),
  );
}

/**
 * Workload agregado por membro do tenant para a semana âncora.
 * Soma `estimate_minutes` das tasks abertas com due_at na semana,
 * conta tasks abertas totais, atrasadas e a próxima entrega.
 *
 * Capacidade: user_capacity (autoritativo) → fallback squad_members
 * → fallback 40h/sem.
 */
export function useTeamWorkload(weekAnchor: Date) {
  const { tenantId } = useWorkspace();
  const ws = weekStartUTC(weekAnchor);
  const we = new Date(ws);
  we.setUTCDate(we.getUTCDate() + 7);

  return useQuery({
    queryKey: ["team-workload", tenantId, ws.toISOString()],
    enabled: !!tenantId,
    queryFn: async (): Promise<TeamWorkloadMember[]> => {
      const { data: members, error } = await supabase
        .from("tenant_members")
        .select("user_id, role")
        .eq("tenant_id", tenantId!);
      if (error) throw error;
      const ids = (members ?? []).map((m) => m.user_id);
      if (ids.length === 0) return [];

      const nowIso = new Date().toISOString();
      const [
        { data: profiles },
        { data: squads },
        { data: caps },
        { data: weekTasks },
        { data: openTasks },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, full_name, email, avatar_url")
          .in("id", ids),
        supabase
          .from("squad_members")
          .select("user_id, capacity_hours_week, squads!inner(tenant_id)")
          .in("user_id", ids)
          .eq("squads.tenant_id", tenantId!),
        supabase
          .from("user_capacity")
          .select("user_id, hours_per_week")
          .eq("tenant_id", tenantId!)
          .in("user_id", ids),
        supabase
          .from("tasks")
          .select("assignee_id, estimate_minutes, due_at")
          .eq("tenant_id", tenantId!)
          .eq("archived", false)
          .is("done_at", null)
          .not("assignee_id", "is", null)
          .gte("due_at", ws.toISOString())
          .lt("due_at", we.toISOString())
          .limit(5000),
        supabase
          .from("tasks")
          .select("id, title, assignee_id, due_at")
          .eq("tenant_id", tenantId!)
          .eq("archived", false)
          .is("done_at", null)
          .not("assignee_id", "is", null)
          .order("due_at", { ascending: true, nullsFirst: false })
          .limit(5000),
      ]);

      const capByUser = new Map<string, number>();
      (squads ?? []).forEach((s) => {
        const cur = capByUser.get(s.user_id) ?? 0;
        capByUser.set(s.user_id, cur + Number(s.capacity_hours_week ?? 0));
      });
      const userCap = new Map<string, number>();
      (caps ?? []).forEach((c) => {
        userCap.set(c.user_id, Number(c.hours_per_week ?? 0));
      });

      const allocByUser = new Map<string, number>();
      (weekTasks ?? []).forEach((t) => {
        if (!t.assignee_id) return;
        const cur = allocByUser.get(t.assignee_id) ?? 0;
        allocByUser.set(t.assignee_id, cur + Number(t.estimate_minutes ?? 0));
      });

      const openByUser = new Map<string, number>();
      const overdueByUser = new Map<string, number>();
      const nextByUser = new Map<string, { id: string; title: string; due_at: string | null }>();
      (openTasks ?? []).forEach((t) => {
        if (!t.assignee_id) return;
        openByUser.set(t.assignee_id, (openByUser.get(t.assignee_id) ?? 0) + 1);
        if (t.due_at && t.due_at < nowIso) {
          overdueByUser.set(t.assignee_id, (overdueByUser.get(t.assignee_id) ?? 0) + 1);
        }
        const cur = nextByUser.get(t.assignee_id);
        if (t.due_at && (!cur?.due_at || t.due_at < (cur.due_at ?? ""))) {
          nextByUser.set(t.assignee_id, { id: t.id, title: t.title, due_at: t.due_at });
        }
      });

      return (members ?? []).map<TeamWorkloadMember>((m) => {
        const p = (profiles ?? []).find((x) => x.id === m.user_id);
        const hoursWeek =
          (userCap.get(m.user_id) ?? 0) > 0
            ? userCap.get(m.user_id)!
            : (capByUser.get(m.user_id) ?? 0) > 0
              ? capByUser.get(m.user_id)!
              : 40;
        const capacityMin = Math.round(hoursWeek * 60);
        const allocated = allocByUser.get(m.user_id) ?? 0;
        const pct = capacityMin > 0 ? Math.round((allocated / capacityMin) * 100) : 0;
        const next = nextByUser.get(m.user_id) ?? null;
        return {
          user_id: m.user_id,
          display_name: p?.display_name ?? null,
          full_name: p?.full_name ?? null,
          email: p?.email ?? null,
          avatar_url: p?.avatar_url ?? null,
          role: m.role,
          capacity_minutes_week: capacityMin,
          allocated_minutes_week: allocated,
          percentage: pct,
          status: statusFromPct(pct),
          open_tasks: openByUser.get(m.user_id) ?? 0,
          overdue_tasks: overdueByUser.get(m.user_id) ?? 0,
          next_due_at: next?.due_at ?? null,
          next_task_title: next?.title ?? null,
        };
      });
    },
  });
}

/**
 * Tarefas candidatas pra realocação: abertas, com assignee, atrasadas
 * ou nas próximas 4 semanas.
 */
export function useReallocatableTasks() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["reallocatable-tasks", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const horizon = new Date();
      horizon.setDate(horizon.getDate() + 28);
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "id, title, code, priority, assignee_id, due_at, estimate_minutes, project_id",
        )
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .is("done_at", null)
        .not("due_at", "is", null)
        .lte("due_at", horizon.toISOString())
        .order("due_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as WorkloadTask[];
    },
  });
}