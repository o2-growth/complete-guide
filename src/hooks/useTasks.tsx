import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { parseQuickAdd } from "@/lib/quick-add-parser";
import { toast } from "sonner";

export interface TaskRow {
  id: string;
  tenant_id: string;
  project_id: string;
  code: string | null;
  number: number;
  title: string;
  description: string | null;
  priority: "none" | "low" | "medium" | "high" | "urgent";
  status_id: string | null;
  assignee_id: string | null;
  start_at: string | null;
  due_at: string | null;
  estimate_minutes: number | null;
  spent_minutes: number;
  archived: boolean;
  done_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SmartList = "inbox" | "today" | "next7" | "overdue" | "assigned";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
function endOfDayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function useTasks(list: SmartList) {
  const { user } = useAuth();
  const { tenantId, inboxProjectId, loading: wsLoading } = useWorkspace();

  return useQuery({
    queryKey: ["tasks", list, user?.id, tenantId, inboxProjectId],
    enabled: !!user && !wsLoading && !!tenantId,
    queryFn: async (): Promise<TaskRow[]> => {
      let q = supabase
        .from("tasks")
        .select("*")
        .eq("archived", false)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);

      if (list === "inbox" && inboxProjectId) {
        q = q.eq("project_id", inboxProjectId);
      } else if (list === "today") {
        q = q.gte("due_at", startOfToday().toISOString()).lte("due_at", endOfToday().toISOString());
      } else if (list === "next7") {
        q = q.gte("due_at", startOfToday().toISOString()).lte("due_at", endOfDayPlus(7).toISOString());
      } else if (list === "overdue") {
        q = q.lt("due_at", startOfToday().toISOString()).is("done_at", null);
      } else if (list === "assigned" && user) {
        q = q.eq("assignee_id", user.id).is("done_at", null);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TaskRow[];
    },
  });
}

export function useTaskStatuses() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["task-statuses", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_statuses")
        .select("id, name, slug, color, position, is_done")
        .eq("tenant_id", tenantId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useQuickAdd() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { tenantId, inboxProjectId } = useWorkspace();
  const { data: statuses } = useTaskStatuses();

  return useMutation({
    mutationFn: async (input: string) => {
      if (!user || !tenantId || !inboxProjectId) {
        throw new Error("Workspace ainda não está pronto");
      }
      const parsed = parseQuickAdd(input);
      const todoStatus = statuses?.find((s) => s.slug === "todo");

      const payload = {
        tenant_id: tenantId,
        project_id: inboxProjectId,
        title: parsed.title,
        priority: parsed.priority,
        status_id: todoStatus?.id ?? null,
        due_at: parsed.dueAt?.toISOString() ?? null,
        start_at: parsed.startAt?.toISOString() ?? null,
        estimate_minutes: parsed.estimateMinutes,
        assignee_id: user.id,
        reporter_id: user.id,
        created_by: user.id,
        number: 0, // será setado pelo trigger
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as TaskRow;
    },
    onSuccess: (task) => {
      toast.success(`Tarefa criada: ${task.code ?? task.title}`);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: Error) => toast.error("Erro ao criar tarefa: " + err.message),
  });
}

export function useToggleTaskDone() {
  const qc = useQueryClient();
  const { data: statuses } = useTaskStatuses();

  return useMutation({
    mutationFn: async (task: TaskRow) => {
      const doneStatus = statuses?.find((s) => s.is_done);
      const todoStatus = statuses?.find((s) => s.slug === "todo");
      const isDone = !!task.done_at;
      const { error } = await supabase
        .from("tasks")
        .update({
          done_at: isDone ? null : new Date().toISOString(),
          status_id: isDone ? todoStatus?.id ?? task.status_id : doneStatus?.id ?? task.status_id,
        })
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").update({ archived: true }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tarefa arquivada");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}

/**
 * Tarefas para o Kanban: todas ativas do tenant (até 500), agrupadas por status_id.
 * Filtro opcional por projeto.
 */
export function useKanbanTasks(projectId?: string | null) {
  const { tenantId, loading: wsLoading } = useWorkspace();

  return useQuery({
    queryKey: ["tasks", "kanban", tenantId, projectId ?? "all"],
    enabled: !wsLoading && !!tenantId,
    queryFn: async (): Promise<TaskRow[]> => {
      let q = supabase
        .from("tasks")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .order("priority", { ascending: false })
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(500);
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TaskRow[];
    },
  });
}

/**
 * Move uma tarefa para outro status. O trigger tg_auto_assign cuida do auto-assign.
 * Atualiza done_at quando o status destino é "done".
 */
export function useMoveTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      statusId,
      isDone,
    }: {
      taskId: string;
      statusId: string;
      isDone: boolean;
    }) => {
      const patch: Record<string, unknown> = { status_id: statusId };
      patch.done_at = isDone ? new Date().toISOString() : null;
      const { error } = await supabase.from("tasks").update(patch).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task"] });
    },
    onError: (e: Error) => toast.error("Erro ao mover: " + e.message),
  });
}