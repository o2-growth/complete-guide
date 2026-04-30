import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/* ============== Saved Reports ============== */
export type ReportSource = "tasks" | "posts";
export type ChartType = "bar" | "line" | "pie" | "table";

export interface SavedReport {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  source: ReportSource;
  metrics: string[];
  dimensions: string[];
  filters: Record<string, string>;
  chart_type: ChartType;
  is_favorite: boolean;
  created_at: string;
}

export const TASK_METRICS = [
  { key: "created_count", label: "Criadas" },
  { key: "done_count", label: "Concluídas" },
  { key: "overdue_count", label: "Atrasadas" },
  { key: "spent_minutes", label: "Tempo gasto (min)" },
  { key: "estimate_minutes", label: "Estimativa (min)" },
] as const;

export const TASK_DIMENSIONS = [
  { key: "d", label: "Data" },
  { key: "squad_id", label: "Squad" },
  { key: "project_id", label: "Projeto" },
  { key: "assignee_id", label: "Responsável" },
  { key: "type_id", label: "Tipo" },
] as const;

export const POST_METRICS = [
  { key: "posts_published", label: "Posts publicados" },
  { key: "reach", label: "Alcance" },
  { key: "impressions", label: "Impressões" },
  { key: "likes", label: "Curtidas" },
  { key: "comments", label: "Comentários" },
  { key: "shares", label: "Compart." },
  { key: "saves", label: "Salvos" },
  { key: "clicks", label: "Cliques" },
] as const;

export const POST_DIMENSIONS = [
  { key: "d", label: "Data" },
  { key: "channel", label: "Canal" },
  { key: "campaign_id", label: "Campanha" },
] as const;

export function useSavedReports() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["saved_reports", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_reports").select("*")
        .eq("tenant_id", tenantId!).order("is_favorite", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SavedReport[];
    },
  });
}

export function useUpsertReport() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<SavedReport> & { id?: string }) => {
      if (!tenantId) throw new Error("Workspace");
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from("saved_reports").update(patch as never).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from("saved_reports").insert({
        tenant_id: tenantId,
        name: input.name ?? "Novo relatório",
        description: input.description ?? null,
        source: input.source ?? "tasks",
        metrics: (input.metrics ?? ["done_count"]) as unknown as never,
        dimensions: (input.dimensions ?? ["d"]) as unknown as never,
        filters: (input.filters ?? {}) as unknown as never,
        chart_type: input.chart_type ?? "bar",
        is_favorite: input.is_favorite ?? false,
        created_by: user?.id ?? null,
      }).select("id").maybeSingle();
      if (error) throw error;
      return data?.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved_reports"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved_reports"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRunReport(reportId: string | null) {
  return useQuery({
    queryKey: ["run_report", reportId],
    enabled: !!reportId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("run_report", { _report_id: reportId! });
      if (error) throw error;
      return data as { rows: Array<Record<string, number | string>>; name: string; chart_type: ChartType };
    },
  });
}

export function useRefreshWarehouse() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("refresh-warehouse", {
        body: { tenant_id: tenantId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["run_report"] });
      toast.success("Warehouse atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ============== Anomalies ============== */
export interface Anomaly {
  id: string; tenant_id: string; detected_at: string;
  source: string; metric: string;
  expected: number; observed: number; delta_pct: number;
  severity: "info" | "warning" | "critical";
  explanation: string | null; suggested_action: string | null;
  status: "open" | "ack" | "dismissed";
}

export function useAnomalies() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["anomalies", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("metric_anomalies").select("*")
        .eq("tenant_id", tenantId!).order("detected_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as Anomaly[];
    },
  });
}

export function useDetectAnomalies() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("detect-anomalies", {
        body: { tenant_id: tenantId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anomalies"] });
      toast.success("Anomalias atualizadas");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAnomalyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: "open" | "ack" | "dismissed" }) => {
      const { error } = await supabase.from("metric_anomalies")
        .update({ status: input.status, acknowledged_at: input.status !== "open" ? new Date().toISOString() : null })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["anomalies"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}