import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { queryProfile } from "@/lib/query-config";
import { toast } from "sonner";

export interface TaskType {
  id: string;
  tenant_id: string;
  squad_id: string | null;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  default_estimate_minutes: number | null;
  description: string | null;
  checklist: Array<{ label: string; done?: boolean }> | null;
  workflow: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function useTaskTypes() {
  const { tenantId, loading } = useWorkspace();
  return useQuery({
    ...queryProfile("static"),
    queryKey: ["task-types", tenantId],
    enabled: !loading && !!tenantId,
    queryFn: async (): Promise<TaskType[]> => {
      const { data, error } = await supabase
        .from("task_types")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as TaskType[];
    },
  });
}

export function useUpsertTaskType() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (payload: Partial<TaskType> & { name: string; slug: string }) => {
      if (!tenantId) throw new Error("Workspace não pronto");
      const row = {
        ...payload,
        tenant_id: tenantId,
        checklist: (payload.checklist ?? []) as unknown as never,
        workflow: (payload.workflow ?? {}) as unknown as never,
      };
      const { data, error } = payload.id
        ? await supabase.from("task_types").update(row).eq("id", payload.id).select().single()
        : await supabase.from("task_types").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Tipo salvo");
      qc.invalidateQueries({ queryKey: ["task-types"] });
    },
    onError: (e: Error) => toast.error("Erro ao salvar: " + e.message),
  });
}

export function useDeleteTaskType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tipo removido");
      qc.invalidateQueries({ queryKey: ["task-types"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useReseedTaskTypes() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("Workspace não pronto");
      const { error } = await supabase.rpc("seed_default_task_types", { p_tenant_id: tenantId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tipos default restaurados");
      qc.invalidateQueries({ queryKey: ["task-types"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
