import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export type SimKind = "boost_budget" | "team_capacity" | "cadence_change";

export function useSimulations() {
  const { tenantId } = useWorkspace();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("simulation_scenarios")
      .select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(50);
    setScenarios(data ?? []);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const run = async (kind: SimKind, inputs: Record<string, any>, opts?: { save?: boolean; name?: string }) => {
    if (!tenantId) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("what-if-simulate", {
        body: { tenant_id: tenantId, kind, inputs, save: opts?.save, name: opts?.name },
      });
      if (error) throw error;
      setLastResult(data);
      if (opts?.save) { toast.success("Cenário salvo"); await load(); }
      return data;
    } catch (e: any) { toast.error(e.message || String(e)); } finally { setRunning(false); }
  };

  const remove = async (id: string) => {
    await supabase.from("simulation_scenarios").delete().eq("id", id);
    await load();
  };

  return { scenarios, run, running, lastResult, remove, load };
}