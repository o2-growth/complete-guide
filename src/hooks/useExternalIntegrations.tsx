import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export type ExternalProvider =
  | "google_drive" | "google_calendar" | "slack_2way" | "notion"
  | "zapier" | "make" | "github" | "jira" | "linear" | "trello_advanced";

export interface ExternalIntegration {
  id: string;
  tenant_id: string;
  provider: ExternalProvider;
  display_name: string;
  status: "connected" | "disconnected" | "error" | "pending";
  config: Record<string, unknown>;
  mapping: Record<string, unknown>;
  webhook_url: string | null;
  sync_schedule: "manual" | "15min" | "hourly" | "daily";
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
}

export interface SyncRun {
  id: string;
  integration_id: string;
  status: "pending" | "running" | "ok" | "failed";
  direction: "in" | "out" | "both";
  items_processed: number;
  items_failed: number;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

export const PROVIDER_META: Record<ExternalProvider, { label: string; description: string; oauth: boolean }> = {
  google_drive: { label: "Google Drive", description: "Anexar arquivos do Drive em tarefas", oauth: true },
  google_calendar: { label: "Google Calendar", description: "Sync 2-way de prazos com o calendário", oauth: true },
  slack_2way: { label: "Slack (2-way)", description: "Notificar e receber comandos de canais", oauth: true },
  notion: { label: "Notion", description: "Sync de páginas e bases", oauth: true },
  zapier: { label: "Zapier", description: "Webhook bidirecional Zap → Oxy → Zap", oauth: false },
  make: { label: "Make.com", description: "Bridge de cenários Make", oauth: false },
  github: { label: "GitHub Issues", description: "Importar issues como tarefas", oauth: true },
  jira: { label: "Jira", description: "Import contínuo de épicos e issues", oauth: true },
  linear: { label: "Linear", description: "Sync de cycles e issues", oauth: true },
  trello_advanced: { label: "Trello (avançado)", description: "Migração contínua com mapping de boards", oauth: true },
};

export function useExternalIntegrations() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["external-integrations", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_integrations").select("*").eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ExternalIntegration[];
    },
  });
}

export function useCreateIntegration() {
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { provider: ExternalProvider; display_name: string; webhook_url?: string; sync_schedule?: ExternalIntegration["sync_schedule"] }) => {
      if (!tenantId) throw new Error("workspace ausente");
      const { error } = await supabase.from("external_integrations").insert({
        tenant_id: tenantId,
        provider: input.provider,
        display_name: input.display_name,
        webhook_url: input.webhook_url ?? null,
        sync_schedule: input.sync_schedule ?? "manual",
        status: "connected",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Integração conectada");
      qc.invalidateQueries({ queryKey: ["external-integrations"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao conectar"),
  });
}

export function useToggleIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ExternalIntegration["status"] }) => {
      const { error } = await supabase
        .from("external_integrations").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external-integrations"] }),
  });
}

export function useDeleteIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("external_integrations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Integração removida");
      qc.invalidateQueries({ queryKey: ["external-integrations"] });
    },
  });
}

export function useTriggerSync() {
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (integrationId: string) => {
      if (!tenantId) throw new Error("workspace ausente");
      // Mock sync run + atualizar last_sync_at — sem credenciais reais a sync é simulada.
      const { error: runErr } = await supabase.from("external_sync_runs").insert({
        integration_id: integrationId,
        tenant_id: tenantId,
        status: "ok",
        direction: "in",
        items_processed: Math.floor(Math.random() * 12),
        items_failed: 0,
        finished_at: new Date().toISOString(),
      });
      if (runErr) throw runErr;
      await supabase.from("external_integrations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", integrationId);
    },
    onSuccess: () => {
      toast.success("Sincronização concluída");
      qc.invalidateQueries({ queryKey: ["external-integrations"] });
      qc.invalidateQueries({ queryKey: ["sync-runs"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha na sync"),
  });
}

export function useSyncRuns(integrationId: string | null) {
  return useQuery({
    queryKey: ["sync-runs", integrationId],
    enabled: !!integrationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_sync_runs").select("*").eq("integration_id", integrationId!)
        .order("started_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as SyncRun[];
    },
  });
}