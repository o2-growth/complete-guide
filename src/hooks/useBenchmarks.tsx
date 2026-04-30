import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export interface BenchComparison {
  metric: string; unit: string; tenant: number;
  p25: number; p50: number; p75: number;
  status: "top" | "good" | "avg" | "low";
  industry: string; source?: string;
}

const METRIC_LABEL: Record<string, string> = {
  engagement_rate: "Engajamento (%)",
  reach_per_post: "Alcance médio por post",
  ctr_link_in_bio: "CTR link-in-bio (%)",
  roas: "ROAS",
  ontime_delivery: "Entregas no prazo (%)",
  task_cycle_days: "Ciclo médio de tarefa (dias)",
  overdue_rate: "% tarefas atrasadas",
  approval_cycle_hours: "Ciclo de aprovação (h)",
};

export function useBenchmarks() {
  const { tenantId } = useWorkspace();
  const [data, setData] = useState<{ industry: string; comparisons: BenchComparison[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [building, setBuilding] = useState(false);

  const refresh = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data: r, error } = await supabase.rpc("benchmark_compare", { _tenant: tenantId });
    if (error) toast.error(error.message); else setData(r as any);
    setLoading(false);
  }, [tenantId]);

  const loadScorecards = useCallback(async () => {
    if (!tenantId) return;
    const { data: r } = await supabase.from("monthly_scorecards")
      .select("*").eq("tenant_id", tenantId).order("period_month", { ascending: false }).limit(12);
    setScorecards(r ?? []);
  }, [tenantId]);

  useEffect(() => { refresh(); loadScorecards(); }, [refresh, loadScorecards]);

  const buildScorecard = async () => {
    if (!tenantId) return;
    setBuilding(true);
    try {
      const { error } = await supabase.functions.invoke("scorecard-monthly", { body: { tenant_id: tenantId } });
      if (error) throw error;
      toast.success("Scorecard gerado");
      await loadScorecards();
    } catch (e: any) { toast.error(e.message || String(e)); } finally { setBuilding(false); }
  };

  return { data, loading, refresh, scorecards, buildScorecard, building, METRIC_LABEL };
}