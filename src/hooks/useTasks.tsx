import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { parseQuickAdd } from "@/lib/quick-add-parser";
import { queryProfile } from "@/lib/query-config";
import { useConfetti } from "@/hooks/useConfetti";
import { useTaskTypes } from "@/hooks/useTaskTypes";
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
  type_id?: string | null;
  parent_task_id?: string | null;
  archived: boolean;
  done_at: string | null;
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, unknown> | null;
  checklist?: unknown;
  progress_pct?: number | null;
  persona_id?: string | null;
  audience_id?: string | null;
  gcal_event_id?: string | null;
  gcal_calendar_id?: string | null;
  gcal_etag?: string | null;
  gcal_last_synced_at?: string | null;
  social_channel?: string | null;
  social_caption?: string | null;
  publish_state?: string | null;
  campaign_id?: string | null;
  scheduled_at?: string | null;
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
    ...queryProfile("workload"),
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

const TASKS_PAGE_SIZE = 50;

export interface TasksPage {
  rows: TaskRow[];
  nextCursor: string | undefined;
}

export interface TasksInfiniteFilters {
  /** Filtro extra por projeto. */
  projectId?: string | null;
}

/**
 * Versão paginada de tasks para listas grandes (next7/assigned).
 * Cursor é `created_at` desc — escolhi created_at em vez de due_at porque é
 * NOT NULL em todas as tasks (due_at é opcional) e monotônico, garantindo
 * paginação estável mesmo quando muitas tasks compartilham o mesmo due_at.
 */
export function useTasksInfinite(list: SmartList, filters: TasksInfiniteFilters = {}) {
  const { user } = useAuth();
  const { tenantId, inboxProjectId, loading: wsLoading } = useWorkspace();

  return useInfiniteQuery({
    ...queryProfile("workload"),
    queryKey: [
      "tasks-infinite",
      list,
      user?.id,
      tenantId,
      inboxProjectId,
      filters.projectId ?? "all",
    ],
    enabled: !!user && !wsLoading && !!tenantId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: TasksPage) => lastPage.nextCursor,
    queryFn: async ({ pageParam }): Promise<TasksPage> => {
      let q = supabase
        .from("tasks")
        .select("*")
        .eq("archived", false)
        .order("created_at", { ascending: false })
        .limit(TASKS_PAGE_SIZE);

      if (pageParam) q = q.lt("created_at", pageParam);

      if (list === "inbox" && inboxProjectId) {
        q = q.eq("project_id", inboxProjectId);
      } else if (list === "today") {
        q = q
          .gte("due_at", startOfToday().toISOString())
          .lte("due_at", endOfToday().toISOString());
      } else if (list === "next7") {
        q = q
          .gte("due_at", startOfToday().toISOString())
          .lte("due_at", endOfDayPlus(7).toISOString());
      } else if (list === "overdue") {
        q = q.lt("due_at", startOfToday().toISOString()).is("done_at", null);
      } else if (list === "assigned" && user) {
        q = q.eq("assignee_id", user.id).is("done_at", null);
      }

      if (filters.projectId) q = q.eq("project_id", filters.projectId);

      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as TaskRow[];
      const nextCursor =
        rows.length === TASKS_PAGE_SIZE ? rows[rows.length - 1].created_at : undefined;
      return { rows, nextCursor };
    },
  });
}

export function useTaskStatuses() {
  const { tenantId } = useWorkspace();
  return useQuery({
    ...queryProfile("workload"),
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
  const { data: taskTypes } = useTaskTypes();

  return useMutation({
    mutationFn: async (input: string) => {
      if (!user || !tenantId || !inboxProjectId) {
        throw new Error("Workspace ainda não está pronto");
      }
      const parsed = parseQuickAdd(input);
      const todoStatus = statuses?.find((s) => s.slug === "todo");

      // Default estimate: se o parser não capturou ~Xm/h, herda do tipo default
      // do tenant (slug "task" tem prioridade; senão, primeiro tipo com
      // default_estimate_minutes setado).
      let estimate = parsed.estimateMinutes;
      if (estimate == null && taskTypes && taskTypes.length > 0) {
        const fallback =
          taskTypes.find((t) => t.slug === "task" && t.default_estimate_minutes) ??
          taskTypes.find((t) => t.default_estimate_minutes != null);
        if (fallback?.default_estimate_minutes) {
          estimate = fallback.default_estimate_minutes;
        }
      }

      const payload = {
        tenant_id: tenantId,
        project_id: inboxProjectId,
        title: parsed.title,
        priority: parsed.priority,
        status_id: todoStatus?.id ?? null,
        due_at: parsed.dueAt?.toISOString() ?? null,
        start_at: parsed.startAt?.toISOString() ?? null,
        estimate_minutes: estimate,
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
  const fireConfetti = useConfetti();

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
      return { task, wasDone: isDone };
    },
    onSuccess: ({ task, wasDone }) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      if (!wasDone) {
        // useConfetti já respeita prefers-reduced-motion internamente.
        fireConfetti(undefined, undefined, 50);
        toast.success("Tarefa concluída", {
          description: "Boa! Mais uma fora da lista.",
          action: {
            label: "Desfazer",
            onClick: async () => {
              await supabase
                .from("tasks")
                .update({ done_at: null, status_id: task.status_id })
                .eq("id", task.id);
              qc.invalidateQueries({ queryKey: ["tasks"] });
            },
          },
        });
      }
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").update({ archived: true }).eq("id", taskId);
      if (error) throw error;
      return taskId;
    },
    onSuccess: (taskId) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa arquivada", {
        action: {
          label: "Desfazer",
          onClick: async () => {
            await supabase.from("tasks").update({ archived: false }).eq("id", taskId);
            qc.invalidateQueries({ queryKey: ["tasks"] });
          },
        },
      });
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
    ...queryProfile("workload"),
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
      const { error } = await supabase
        .from("tasks")
        .update({ status_id: statusId, done_at: isDone ? new Date().toISOString() : null })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task"] });
    },
    onError: (e: Error) => toast.error("Erro ao mover: " + e.message),
  });
}

/**
 * Tarefas com due_at dentro de um intervalo (para o calendário).
 */
export function useTasksInRange(from: Date | null, to: Date | null) {
  const { tenantId, loading: wsLoading } = useWorkspace();
  return useQuery({
    ...queryProfile("workload"),
    queryKey: ["tasks", "range", tenantId, from?.toISOString(), to?.toISOString()],
    enabled: !wsLoading && !!tenantId && !!from && !!to,
    queryFn: async (): Promise<TaskRow[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .not("due_at", "is", null)
        .gte("due_at", from!.toISOString())
        .lte("due_at", to!.toISOString())
        .order("due_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as TaskRow[];
    },
  });
}

export type TaskPriority = TaskRow["priority"];

/**
 * Tarefas ativas do tenant agrupadas por prioridade — alimenta a Matriz
 * Eisenhower. Não filtra por done_at: a página decide se quer só pendentes.
 */
export function useTasksByPriority() {
  const { tenantId, loading: wsLoading } = useWorkspace();

  return useQuery({
    ...queryProfile("workload"),
    queryKey: ["tasks-by-priority", tenantId],
    enabled: !wsLoading && !!tenantId,
    queryFn: async (): Promise<Record<TaskPriority, TaskRow[]>> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .is("done_at", null)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const rows = (data ?? []) as TaskRow[];
      const grouped: Record<TaskPriority, TaskRow[]> = {
        urgent: [],
        high: [],
        medium: [],
        low: [],
        none: [],
      };
      rows.forEach((t) => grouped[t.priority]?.push(t));
      return grouped;
    },
  });
}

/**
 * Versão da Eisenhower agrupada por projeto + bucket "open" / "done".
 * - `open`: tasks pendentes (done_at IS NULL) agrupadas por project_id.
 * - `done`: concluídas nos últimos 30 dias (done_at IS NOT NULL),
 *   pra povoar a seção "Concluído" colapsável de cada quadrante.
 */
export function useTasksByPriorityGrouped() {
  const { tenantId, loading: wsLoading } = useWorkspace();

  return useQuery({
    ...queryProfile("workload"),
    queryKey: ["tasks-by-priority-grouped", tenantId],
    enabled: !wsLoading && !!tenantId,
    queryFn: async (): Promise<
      Record<TaskPriority, { open: Record<string, TaskRow[]>; done: TaskRow[] }>
    > => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      cutoff.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .or(`done_at.is.null,done_at.gte.${cutoff.toISOString()}`)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;

      const rows = (data ?? []) as TaskRow[];
      const result: Record<TaskPriority, { open: Record<string, TaskRow[]>; done: TaskRow[] }> = {
        urgent: { open: {}, done: [] },
        high: { open: {}, done: [] },
        medium: { open: {}, done: [] },
        low: { open: {}, done: [] },
        none: { open: {}, done: [] },
      };

      rows.forEach((t) => {
        const bucket = result[t.priority];
        if (!bucket) return;
        if (t.done_at) {
          bucket.done.push(t);
        } else {
          const pid = t.project_id || "_none";
          if (!bucket.open[pid]) bucket.open[pid] = [];
          bucket.open[pid].push(t);
        }
      });

      return result;
    },
  });
}

/**
 * Atualiza só a prioridade — usado pelo drag entre quadrantes da matriz
 * Eisenhower.
 */
export function useUpdateTaskPriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, priority }: { taskId: string; priority: TaskPriority }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ priority })
        .eq("id", taskId);
      if (error) throw error;
      return { taskId, priority };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks-by-priority"] });
      qc.invalidateQueries({ queryKey: ["tasks-by-priority-grouped"] });
    },
    onError: (e: Error) => toast.error("Erro ao repriorizar: " + e.message),
  });
}

/**
 * Reagendar tarefa (drag no calendário). Preserva o horário original quando
 * possível e só troca a data.
 */
export function useRescheduleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      newDate,
      keepTime = true,
      currentDueAt,
    }: {
      taskId: string;
      newDate: Date;
      keepTime?: boolean;
      currentDueAt?: string | null;
    }) => {
      const target = new Date(newDate);
      if (keepTime && currentDueAt) {
        const prev = new Date(currentDueAt);
        target.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
      } else if (keepTime) {
        target.setHours(9, 0, 0, 0);
      }
      const { error } = await supabase
        .from("tasks")
        .update({ due_at: target.toISOString() })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tarefa reagendada");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task"] });
    },
    onError: (e: Error) => toast.error("Erro ao reagendar: " + e.message),
  });
}