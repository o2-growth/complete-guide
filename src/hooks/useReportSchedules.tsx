import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export interface ReportSchedule {
  id: string; tenant_id: string; report_id: string;
  cadence: "daily" | "weekly" | "monthly"; recipients: string[];
  next_run_at: string | null; last_run_at: string | null; active: boolean;
}

export function useReportSchedules(reportId: string | null) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["report_schedules", tenantId, reportId],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase.from("report_schedules").select("*").eq("tenant_id", tenantId!);
      if (reportId) q = q.eq("report_id", reportId);
      const { data, error } = await q.order("next_run_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as ReportSchedule[];
    },
  });
}

export function useUpsertSchedule() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { id?: string; report_id: string; cadence: "daily" | "weekly" | "monthly"; recipients: string[]; active?: boolean }) => {
      if (!tenantId) throw new Error("Workspace");
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from("report_schedules").update(patch as never).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data: nextRun } = await supabase.rpc("compute_next_run", { _cadence: input.cadence });
      const { data, error } = await supabase.from("report_schedules").insert({
        tenant_id: tenantId,
        report_id: input.report_id,
        cadence: input.cadence,
        recipients: input.recipients,
        active: input.active ?? true,
        next_run_at: nextRun,
      }).select("id").maybeSingle();
      if (error) throw error;
      return data?.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report_schedules"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("report_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report_schedules"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRunSchedulesNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-scheduled-reports", { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["report_schedules"] });
      const r = d as { processed?: number };
      toast.success(`Processados: ${r?.processed ?? 0}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}