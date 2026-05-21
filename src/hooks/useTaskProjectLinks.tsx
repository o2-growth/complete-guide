import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface TaskProjectLinkRow {
  id: string;
  task_id: string;
  project_id: string;
  link_kind: "related" | "product";
  project?: {
    id: string;
    name: string;
    key: string;
    color: string | null;
    pipefy_card_id: string | null;
    pipefy_url: string | null;
    pipefy_phase_name: string | null;
  };
}

export function useTaskProjectLinks(taskId: string | undefined) {
  const { tenantId, loading } = useWorkspace();
  return useQuery({
    queryKey: ["task-project-links", taskId, tenantId],
    enabled: !loading && !!tenantId && !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_project_links")
        .select(
          "id, task_id, project_id, link_kind, project:projects(id, name, key, color, pipefy_card_id, pipefy_url, pipefy_phase_name)",
        )
        .eq("task_id", taskId!)
        .eq("tenant_id", tenantId!);
      if (error) throw error;
      return (data ?? []) as TaskProjectLinkRow[];
    },
  });
}

export function useAddTaskProjectLink() {
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      taskId: string;
      projectId: string;
      linkKind?: "related" | "product";
    }) => {
      const { error } = await supabase.from("task_project_links").insert({
        tenant_id: tenantId!,
        task_id: input.taskId,
        project_id: input.projectId,
        link_kind: input.linkKind ?? "product",
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["task-project-links", vars.taskId] });
      toast.success("Produto vinculado à tarefa");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveTaskProjectLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; taskId: string }) => {
      const { error } = await supabase.from("task_project_links").delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["task-project-links", vars.taskId] });
      toast.success("Vínculo removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
