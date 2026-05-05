import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { queryProfile } from "@/lib/query-config";
import { toast } from "sonner";

export interface Project {
  id: string;
  tenant_id: string;
  squad_id: string | null;
  name: string;
  key: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  archived: boolean;
  task_seq: number;
  created_at: string;
}

export interface ProjectWithStats extends Project {
  squadName: string | null;
  squadColor: string | null;
  totalTasks: number;
  doneTasks: number;
  openTasks: number;
  overdue: number;
  progress: number;
}

export function useProjects() {
  const { tenantId, loading } = useWorkspace();
  return useQuery({
    ...queryProfile("structural"),
    queryKey: ["projects-list", tenantId],
    enabled: !loading && !!tenantId,
    queryFn: async (): Promise<ProjectWithStats[]> => {
      const nowIso = new Date().toISOString();
      const [projRes, squadsRes, tasksRes] = await Promise.all([
        supabase.from("projects").select("*").eq("tenant_id", tenantId!).order("created_at", { ascending: false }),
        supabase.from("squads").select("id,name,color").eq("tenant_id", tenantId!),
        supabase.from("tasks").select("project_id,done_at,due_at,archived").eq("tenant_id", tenantId!),
      ]);
      if (projRes.error) throw projRes.error;

      const squadMap = new Map((squadsRes.data ?? []).map((s) => [s.id, s]));
      const tasks = tasksRes.data ?? [];

      return (projRes.data ?? []).map((p) => {
        const projectTasks = tasks.filter((t) => t.project_id === p.id && !t.archived);
        const total = projectTasks.length;
        const done = projectTasks.filter((t) => !!t.done_at).length;
        const open = total - done;
        const overdue = projectTasks.filter(
          (t) => !t.done_at && t.due_at && t.due_at < nowIso,
        ).length;
        const sq = p.squad_id ? squadMap.get(p.squad_id) : null;
        return {
          ...(p as Project),
          squadName: sq?.name ?? null,
          squadColor: sq?.color ?? null,
          totalTasks: total,
          doneTasks: done,
          openTasks: open,
          overdue,
          progress: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      });
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    ...queryProfile("structural"),
    queryKey: ["project", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as Project | null;
    },
  });
}

export function useProjectTasks(projectId: string | undefined) {
  return useQuery({
    ...queryProfile("structural"),
    queryKey: ["project-tasks", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId!)
        .eq("archived", false)
        .order("position", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { name: string; key: string; squad_id?: string | null; description?: string; color?: string }) => {
      if (!tenantId) throw new Error("Sem workspace");
      const { error } = await supabase.from("projects").insert([
        {
          tenant_id: tenantId,
          name: input.name,
          key: input.key.toUpperCase(),
          squad_id: input.squad_id ?? null,
          description: input.description ?? null,
          color: input.color ?? null,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects-list", tenantId] });
      toast.success("Projeto criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useArchiveProject() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase.from("projects").update({ archived }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects-list", tenantId] });
      toast.success("Projeto atualizado");
    },
  });
}