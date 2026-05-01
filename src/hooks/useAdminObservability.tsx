import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

export interface ErrorEventRow {
  id: string;
  source: string;
  level: string;
  message: string;
  stack: string | null;
  url: string | null;
  user_agent: string | null;
  context: Record<string, unknown> | null;
  created_at: string;
  user_id: string | null;
}

export function useErrorEvents(limit = 100) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["error_events", tenantId, limit],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_events")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as ErrorEventRow[];
    },
  });
}

export interface PerfMetricRow {
  id: string;
  route: string;
  metric: string;
  value: number;
  rating: string | null;
  created_at: string;
}

export function usePerfMetrics(metric?: string) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["perf_metrics", tenantId, metric],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase.from("perf_metrics").select("*").eq("tenant_id", tenantId!).order("created_at", { ascending: false }).limit(200);
      if (metric) q = q.eq("metric", metric);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as PerfMetricRow[];
    },
  });
}

export interface HealthSnapshot {
  webhook_pending: number;
  webhook_failed_24h: number;
  automation_events_pending: number;
  errors_24h: number;
  errors_1h: number;
  scheduled_publishes_pending: number;
  snapshot_at: string;
}

export function useHealthSnapshot() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["health_snapshot", tenantId],
    enabled: !!tenantId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("health_snapshot", { _tenant: tenantId! });
      if (error) throw error;
      return data as unknown as HealthSnapshot;
    },
  });
}
