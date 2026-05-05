import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export type SimKind = "boost_budget" | "team_capacity" | "cadence_change";

export interface SimResult {
  result?: {
    kind?: SimKind;
    current?: { spent_cents: number; revenue_cents: number; roas: number };
    projected?: { spent_cents: number; revenue_cents: number; roas: number };
    delta_revenue_cents?: number;
    avg_task_minutes?: number;
    extra_tasks_per_week?: number;
    extra_tasks_per_month?: number;
    avg_engagement_per_post?: number;
    current_engagement_30d?: number;
    projected_engagement_30d?: number;
    delta?: number;
    assumptions?: string;
  };
  narrative?: string;
}

export interface SimScenario {
  id: string;
  name: string | null;
  kind: SimKind;
  inputs: Record<string, unknown>;
  result: SimResult["result"];
  created_at: string;
  [key: string]: unknown;
}

export function useSimulations() {
  const { tenantId } = useWorkspace();
  const [scenarios, setScenarios] = useState<SimScenario[]>([]);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<SimResult | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("simulation_scenarios")
      .select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(50);
    setScenarios((data ?? []) as SimScenario[]);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const run = async (kind: SimKind, inputs: Record<string, unknown>, opts?: { save?: boolean; name?: string }) => {
    if (!tenantId) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("what-if-simulate", {
        body: { tenant_id: tenantId, kind, inputs, save: opts?.save, name: opts?.name },
      });
      if (error) throw error;
      setLastResult(data as SimResult);
      if (opts?.save) { toast.success("Cenário salvo"); await load(); }
      return data;
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)); } finally { setRunning(false); }
  };

  const remove = async (id: string) => {
    await supabase.from("simulation_scenarios").delete().eq("id", id);
    await load();
  };

  return { scenarios, run, running, lastResult, remove, load };
}