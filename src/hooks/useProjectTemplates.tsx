import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export interface ProjectTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  suggested_squad_id: string | null;
  payload: { tasks?: Array<Record<string, unknown>> };
  created_at: string;
  updated_at: string;
}

export function useProjectTemplates() {
  const { tenantId, loading } = useWorkspace();
  return useQuery({
    queryKey: ["project-templates", tenantId],
    enabled: !loading && !!tenantId,
    queryFn: async (): Promise<ProjectTemplate[]> => {
      const { data, error } = await supabase
        .from("project_templates" as never)
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProjectTemplate[];
    },
  });
}

export function useSaveProjectAsTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { project_id: string; name: string; description?: string }) => {
      const { data, error } = await supabase.rpc("save_project_as_template" as never, {
        p_project_id: input.project_id,
        p_name: input.name,
        p_description: input.description ?? null,
      } as never);
      if (error) throw error;
      return data as unknown as string;
    },
    onSuccess: () => {
      toast.success("Template criado");
      qc.invalidateQueries({ queryKey: ["project-templates"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useApplyProjectTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      template_id: string;
      name: string;
      key: string;
      squad_id?: string | null;
    }) => {
      const { data, error } = await supabase.rpc("apply_project_template" as never, {
        p_template_id: input.template_id,
        p_name: input.name,
        p_key: input.key.toUpperCase(),
        p_squad_id: input.squad_id ?? null,
      } as never);
      if (error) throw error;
      return data as unknown as string;
    },
    onSuccess: () => {
      toast.success("Projeto criado a partir do template");
      qc.invalidateQueries({ queryKey: ["projects-list"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteProjectTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_templates" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template removido");
      qc.invalidateQueries({ queryKey: ["project-templates"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}