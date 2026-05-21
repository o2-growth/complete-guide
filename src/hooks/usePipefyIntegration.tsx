import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

export interface PipefyIntegration {
  id: string;
  tenant_id: string;
  pipe_id: string;
  pipe_name: string | null;
  enabled: boolean;
  active_only: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_count: number | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export function usePipefyIntegrations() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["pipefy-integrations", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<PipefyIntegration[]> => {
      const { data, error } = await supabase
        .from("pipefy_integrations")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PipefyIntegration[];
    },
  });
}

export function useUpsertPipefyIntegration() {
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      pipe_id: string;
      pipe_name?: string | null;
      enabled?: boolean;
      active_only?: boolean;
    }) => {
      if (!tenantId) throw new Error("Sem workspace ativo");
      const payload = {
        tenant_id: tenantId,
        pipe_id: input.pipe_id.trim(),
        pipe_name: input.pipe_name ?? null,
        enabled: input.enabled ?? true,
        active_only: input.active_only ?? true,
        ...(input.id ? { id: input.id } : {}),
      };
      const { data, error } = await supabase
        .from("pipefy_integrations")
        .upsert(payload, { onConflict: "tenant_id,pipe_id" })
        .select()
        .single();
      if (error) throw error;
      return data as PipefyIntegration;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pipefy-integrations", tenantId] });
      toast.success("Integração salva.");
    },
    onError: (e) => toast.error(`Erro ao salvar: ${e.message}`),
  });
}

export function useDeletePipefyIntegration() {
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pipefy_integrations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pipefy-integrations", tenantId] });
      toast.success("Integração removida.");
    },
    onError: (e) => toast.error(`Erro ao remover: ${e.message}`),
  });
}

export function useSyncPipefyNow() {
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pipe_id?: string) => {
      const { data, error } = await supabase.functions.invoke("pipefy-sync", {
        body: { tenant_id: tenantId, ...(pipe_id ? { pipe_id } : {}) },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pipefy-integrations", tenantId] });
      void qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Sincronização concluída.");
    },
    onError: (e) => toast.error(`Falha na sincronização: ${e.message}`),
  });
}
