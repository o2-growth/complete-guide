import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type Priority = "none" | "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  tenant_id: string;
  list_id: string;
  parent_task_id: string | null;
  number: number;
  title: string;
  description: string | null;
  status_id: string | null;
  priority: Priority;
  start_at: string | null;
  due_at: string | null;
  completed_at: string | null;
  estimate_minutes: number | null;
  progress_pct: number | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assignees: { user_id: string; full_name: string | null; avatar_url: string | null }[];
}

export interface ListStatus { id: string; name: string; color: string; sort_order: number; is_done: boolean; }

export function useListStatuses(listId: string | null) {
  return useQuery({
    queryKey: ["statuses", listId],
    enabled: !!listId,
    staleTime: 60_000,
    queryFn: async (): Promise<ListStatus[]> => {
      if (!listId) return [];
      const { data } = await supabase
        .from("list_statuses")
        .select("id,name,color,sort_order,is_done")
        .eq("list_id", listId)
        .order("sort_order");
      return (data ?? []) as ListStatus[];
    },
  });
}

export function useTasks(listId: string | null) {
  return useQuery({
    queryKey: ["tasks", listId],
    enabled: !!listId,
    staleTime: 15_000,
    queryFn: async (): Promise<Task[]> => {
      if (!listId) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("*, task_assignees(user_id)")
        .eq("list_id", listId)
        .is("archived_at", null)
        .is("parent_task_id", null)
        .order("sort_order");
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<Omit<Task, "assignees"> & { task_assignees: { user_id: string }[] | null }>;
      const userIds = Array.from(new Set(rows.flatMap((r) => (r.task_assignees ?? []).map((a) => a.user_id))));
      const profMap = await fetchProfileMap(userIds);
      return rows.map((t) => ({
        ...(t as Omit<Task, "assignees">),
        assignees: (t.task_assignees ?? []).map((a) => ({
          user_id: a.user_id,
          full_name: profMap[a.user_id]?.full_name ?? null,
          avatar_url: profMap[a.user_id]?.avatar_url ?? null,
        })),
      })) as Task[];
    },
  });
}

export function useMyTasks() {
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["my-tasks", user?.id, tenantId],
    enabled: !!user?.id && !!tenantId,
    queryFn: async (): Promise<Task[]> => {
      if (!user || !tenantId) return [];
      const { data: rows } = await supabase
        .from("task_assignees")
        .select("tasks!inner(*)")
        .eq("user_id", user.id);
      const tasks = (rows ?? [])
        .map((r) => (r as unknown as { tasks: Task }).tasks)
        .filter((t) => t && !t.completed_at && t.tenant_id === tenantId);
      return tasks.map((t) => ({ ...t, assignees: t.assignees ?? [] }));
    },
  });
}

async function fetchProfileMap(ids: string[]): Promise<Record<string, { full_name: string | null; avatar_url: string | null }>> {
  if (!ids.length) return {};
  const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids);
  const map: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  (data ?? []).forEach((p) => {
    map[(p as { id: string }).id] = { full_name: (p as { full_name: string | null }).full_name, avatar_url: (p as { avatar_url: string | null }).avatar_url };
  });
  return map;
}

export function useTaskAssignees(taskId: string | null) {
  return useQuery({
    queryKey: ["task-assignees", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      if (!taskId) return [] as string[];
      const { data } = await supabase.from("task_assignees").select("user_id").eq("task_id", taskId);
      return (data ?? []).map((r) => (r as { user_id: string }).user_id);
    },
  });
}

export function useToggleAssignee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ task_id, user_id, present }: { task_id: string; user_id: string; present: boolean }) => {
      if (present) {
        const { error } = await supabase.from("task_assignees").delete().eq("task_id", task_id).eq("user_id", user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("task_assignees").insert({ task_id, user_id });
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["task-assignees", v.task_id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { list_id: string; title: string; status_id?: string | null }) => {
      if (!tenantId || !user) throw new Error("workspace_not_ready");
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          tenant_id: tenantId,
          list_id: input.list_id,
          title: input.title,
          status_id: input.status_id ?? null,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["tasks", v.list_id] });
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao criar tarefa"),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      const { assignees: _omit, ...rest } = patch as Record<string, unknown> & { assignees?: unknown };
      void _omit;
      const { data, error } = await supabase.from("tasks").update(rest as never).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["tasks", d.list_id] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao atualizar"),
  });
}

export function useToggleComplete() {
  const upd = useUpdateTask();
  return (t: Task) =>
    upd.mutate({ id: t.id, patch: { completed_at: t.completed_at ? null : new Date().toISOString() } as Partial<Task> });
}