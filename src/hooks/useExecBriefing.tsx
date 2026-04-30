import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export interface ExecKpis {
  done_7d: number;
  done_prev_7d: number;
  done_delta_pct: number;
  overdue: number;
  anomalies_open: number;
  goals_at_risk: number;
  revenue_cents: number;
  spent_cents: number;
  roas: number;
  engagement_7d: number;
  generated_at: string;
}

export function useExecKpis() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["exec_kpis", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("exec_kpis", { _tenant: tenantId! });
      if (error) throw error;
      return data as unknown as ExecKpis;
    },
  });
}

export function useExecBriefing() {
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("exec-briefing", {
        body: { tenant_id: tenantId },
      });
      if (error) throw error;
      return data as { kpis: ExecKpis; narrative: string };
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRunCronJob() {
  return useMutation({
    mutationFn: async (job: "warehouse" | "anomalies" | "krs" | "notifications" | "reports" | "all") => {
      const { data, error } = await supabase.functions.invoke("cron-tick", { body: { job } });
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, job) => toast.success(`Job ${job} executado`),
    onError: (e: Error) => toast.error(e.message),
  });
}