import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

type TimeEntryInsert = Database["public"]["Tables"]["time_entries"]["Insert"];
type TimeEntryUpdate = Database["public"]["Tables"]["time_entries"]["Update"];

/**
 * Hooks de Time Tracking nativo (Sub-fase 7C).
 */

export interface TimeEntryRow {
  id: string;
  tenant_id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  minutes: number | null;
  note: string | null;
  source: string | null;
  billable: boolean;
  hourly_rate: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  author?: {
    display_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

type TimeEntryRaw = {
  id: string;
  tenant_id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  minutes: number | null;
  note: string | null;
  source: string | null;
  billable?: boolean | null;
  hourly_rate?: number | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
};

function normalize(row: TimeEntryRaw): TimeEntryRow {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    task_id: row.task_id,
    user_id: row.user_id,
    started_at: row.started_at,
    ended_at: row.ended_at,
    minutes: row.minutes,
    note: row.note,
    source: row.source,
    billable: !!row.billable,
    hourly_rate: row.hourly_rate ?? null,
    tags: row.tags ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/* ------------- Listagem por task ------------- */

export function useTaskTimeEntries(taskId: string | null) {
  return useQuery({
    queryKey: ["time-entries", taskId],
    enabled: !!taskId,
    queryFn: async (): Promise<TimeEntryRow[]> => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("task_id", taskId!)
        .order("started_at", { ascending: false });
      if (error) throw error;
      const rows = ((data ?? []) as unknown as TimeEntryRaw[]).map(normalize);
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, email")
          .in("id", userIds);
        const byId = new Map((profs ?? []).map((p) => [p.id, p]));
        rows.forEach((r) => {
          const p = byId.get(r.user_id);
          if (p) {
            r.author = {
              display_name: p.display_name,
              avatar_url: p.avatar_url,
              email: p.email,
            };
          }
        });
      }
      return rows;
    },
  });
}

/* ------------- Totais por task ------------- */

export interface TaskTotalTime {
  totalMinutes: number;
  billableMinutes: number;
  estimatedMinutes: number;
}

export function useTaskTotalTime(taskId: string | null): {
  data: TaskTotalTime | undefined;
  isLoading: boolean;
} {
  const entries = useTaskTimeEntries(taskId);
  const taskQ = useQuery({
    queryKey: ["task-estimate", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("estimate_minutes")
        .eq("id", taskId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.estimate_minutes as number | null) ?? 0;
    },
  });
  if (!entries.data) {
    return { data: undefined, isLoading: entries.isLoading || taskQ.isLoading };
  }
  const totalMinutes = entries.data.reduce((acc, e) => acc + (e.minutes ?? 0), 0);
  const billableMinutes = entries.data.reduce(
    (acc, e) => acc + (e.billable ? (e.minutes ?? 0) : 0),
    0,
  );
  return {
    data: {
      totalMinutes,
      billableMinutes,
      estimatedMinutes: taskQ.data ?? 0,
    },
    isLoading: false,
  };
}

/**
 * Soma de minutos da task (apenas entries finalizadas).
 * Query leve — não busca rows, só faz aggregate via select com `head:false`.
 */
export function useTaskMinutesSum(taskId: string | null) {
  return useQuery({
    queryKey: ["task-minutes-sum", taskId],
    enabled: !!taskId,
    staleTime: 60_000,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("minutes")
        .eq("task_id", taskId!)
        .not("ended_at", "is", null);
      if (error) throw error;
      return (data ?? []).reduce(
        (acc, r) => acc + ((r as { minutes: number | null }).minutes ?? 0),
        0,
      );
    },
  });
}

/* ------------- Mutations ------------- */

interface ManualEntryInput {
  taskId: string;
  startedAt: string;
  endedAt: string;
  minutes?: number;
  note?: string | null;
  billable?: boolean;
  hourlyRate?: number | null;
  tags?: string[];
}

export function useAddManualTimeEntry() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: ManualEntryInput) => {
      if (!user || !tenantId) throw new Error("Sem usuário/tenant");
      const start = new Date(input.startedAt);
      const end = new Date(input.endedAt);
      const minutes =
        input.minutes ?? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
      if (minutes <= 0) throw new Error("Duração precisa ser maior que zero");
      const payload: TimeEntryInsert = {
        tenant_id: tenantId,
        task_id: input.taskId,
        user_id: user.id,
        started_at: input.startedAt,
        ended_at: input.endedAt,
        minutes,
        note: input.note ?? null,
        billable: input.billable ?? false,
        hourly_rate: input.hourlyRate ?? null,
        tags: input.tags ?? [],
        source: "manual",
      };
      const { error } = await supabase.from("time_entries").insert(payload);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["time-entries", vars.taskId] });
      qc.invalidateQueries({ queryKey: ["timesheet"] });
      toast.success("Entrada adicionada");
    },
    onError: (e: Error) => toast.error("Erro ao adicionar: " + e.message),
  });
}

interface UpdateEntryInput {
  id: string;
  taskId: string;
  patch: Partial<{
    started_at: string;
    ended_at: string;
    minutes: number;
    note: string | null;
    billable: boolean;
    hourly_rate: number | null;
    tags: string[];
  }>;
}

export function useUpdateTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: UpdateEntryInput) => {
      const { error } = await supabase
        .from("time_entries")
        .update(patch as TimeEntryUpdate)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["time-entries", vars.taskId] });
      qc.invalidateQueries({ queryKey: ["timesheet"] });
      toast.success("Entrada atualizada");
    },
    onError: (e: Error) => toast.error("Erro ao atualizar: " + e.message),
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; taskId: string }) => {
      const { error } = await supabase.from("time_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["time-entries", vars.taskId] });
      qc.invalidateQueries({ queryKey: ["timesheet"] });
      toast.success("Entrada removida");
    },
    onError: (e: Error) => toast.error("Erro ao remover: " + e.message),
  });
}

/* ------------- Timesheet (RPC user_timesheet) ------------- */

export interface TimesheetDayRow {
  day: string;
  total_minutes: number;
  billable_minutes: number;
  total_amount: number;
  task_count: number;
}

export function useUserTimesheet(
  userId: string | null,
  start: Date | null,
  end: Date | null,
) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: [
      "timesheet",
      tenantId,
      userId,
      start?.toISOString(),
      end?.toISOString(),
    ],
    enabled: !!tenantId && !!userId && !!start && !!end,
    queryFn: async (): Promise<TimesheetDayRow[]> => {
      const { data, error } = await supabase.rpc("user_timesheet", {
        _tenant: tenantId!,
        _user: userId!,
        _start: start!.toISOString(),
        _end: end!.toISOString(),
      });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        day: r.day,
        total_minutes: Number(r.total_minutes ?? 0),
        billable_minutes: Number(r.billable_minutes ?? 0),
        total_amount: Number(r.total_amount ?? 0),
        task_count: Number(r.task_count ?? 0),
      }));
    },
  });
}
