import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface UserCapacity {
  id: string;
  tenant_id: string;
  user_id: string;
  hours_per_week: number;
  workdays: number[];
  daily_hours: number;
  notes: string | null;
}

export type TimeOffKind = "vacation" | "sick" | "holiday" | "personal" | "other";
export type TimeOffStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface TimeOff {
  id: string;
  tenant_id: string;
  user_id: string;
  kind: TimeOffKind;
  status: TimeOffStatus;
  start_date: string;
  end_date: string;
  reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

export interface MemberLite {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export function useCapacityData() {
  const { tenantId, loading: wsLoading } = useWorkspace();

  return useQuery({
    queryKey: ["capacity-data", tenantId],
    enabled: !wsLoading && !!tenantId,
    queryFn: async () => {
      const [capRes, offRes, membersRes, profilesRes] = await Promise.all([
        supabase.from("user_capacity").select("*").eq("tenant_id", tenantId!),
        supabase.from("time_off").select("*").eq("tenant_id", tenantId!).order("start_date", { ascending: false }),
        supabase.from("tenant_members").select("user_id").eq("tenant_id", tenantId!),
        supabase.from("profiles").select("id,full_name,display_name,avatar_url,email"),
      ]);
      if (capRes.error) throw capRes.error;
      if (offRes.error) throw offRes.error;

      const memberIds = new Set((membersRes.data ?? []).map((m) => m.user_id));
      const members = (profilesRes.data ?? []).filter((p) => memberIds.has(p.id)) as MemberLite[];

      return {
        capacities: (capRes.data ?? []) as UserCapacity[],
        timeOff: (offRes.data ?? []) as TimeOff[],
        members,
      };
    },
  });
}

export function useUpsertCapacity() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { hours_per_week: number; daily_hours: number; workdays: number[]; notes?: string | null }) => {
      if (!user || !tenantId) throw new Error("Sem workspace");
      const { error } = await supabase
        .from("user_capacity")
        .upsert(
          {
            tenant_id: tenantId,
            user_id: user.id,
            hours_per_week: input.hours_per_week,
            daily_hours: input.daily_hours,
            workdays: input.workdays,
            notes: input.notes ?? null,
          },
          { onConflict: "tenant_id,user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["capacity-data", tenantId] });
      toast.success("Capacidade atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateTimeOff() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { kind: TimeOffKind; start_date: string; end_date: string; reason?: string }) => {
      if (!user || !tenantId) throw new Error("Sem workspace");
      const { error } = await supabase.from("time_off").insert({
        tenant_id: tenantId,
        user_id: user.id,
        kind: input.kind,
        start_date: input.start_date,
        end_date: input.end_date,
        reason: input.reason ?? null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["capacity-data", tenantId] });
      toast.success("Ausência registrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTimeOffStatus() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TimeOffStatus }) => {
      const patch: Partial<TimeOff> = { status };
      if (status === "approved" || status === "rejected") {
        patch.approved_by = user?.id ?? null;
        patch.approved_at = new Date().toISOString();
      }
      const { error } = await supabase.from("time_off").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["capacity-data", tenantId] });
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTimeOff() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_off").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capacity-data", tenantId] }),
  });
}

/** Compute available hours over a date range, given capacity + approved time-off. Pure client helper. */
export function computeAvailableHours(
  cap: UserCapacity | undefined,
  timeOff: TimeOff[],
  from: Date,
  to: Date,
): { availableHours: number; offDays: number; workdays: number } {
  const workdays = cap?.workdays ?? [1, 2, 3, 4, 5];
  const dailyHours = cap?.daily_hours ?? 8;
  let total = 0;
  let off = 0;
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    if (workdays.includes(cur.getDay())) {
      total += 1;
      const iso = cur.toISOString().slice(0, 10);
      if (
        timeOff.some(
          (t) => t.status === "approved" && iso >= t.start_date && iso <= t.end_date,
        )
      ) {
        off += 1;
      }
    }
    cur.setDate(cur.getDate() + 1);
  }
  return {
    availableHours: Math.max(total - off, 0) * dailyHours,
    offDays: off,
    workdays: total,
  };
}