import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export interface ForecastPoint { d: string; value: number; kind: "history" | "forecast" }
export interface ForecastResponse {
  ok: boolean; series: ForecastPoint[];
  avgHist: number; avgFore: number; trendPct: number;
  narrative: string | null;
}

export function useForecast() {
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { source: "tasks" | "posts"; metric: string; days_back?: number; days_ahead?: number }) => {
      const { data, error } = await supabase.functions.invoke("forecast-metric", {
        body: { tenant_id: tenantId, ...input },
      });
      if (error) throw error;
      return data as ForecastResponse;
    },
    onError: (e: Error) => toast.error(e.message),
  });
}