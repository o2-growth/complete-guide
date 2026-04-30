import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
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
      const patch: Record<string, unknown> = { assignee_id: assigneeId };
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