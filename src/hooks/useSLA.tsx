import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export type Priority = "none" | "low" | "medium" | "high" | "urgent";

export interface SLAPolicy {
  id: string;
  tenant_id: string;
  name: string;
  type_id: string | null;
  priority: Priority | null;
  response_hours: number;
  resolution_hours: number;
  warning_threshold_pct: number;
  business_hours_only: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type SLAStatus = "ok" | "warning" | "breached" | "met" | "none";

export interface SLAComputed {
  status: SLAStatus;
  policy: SLAPolicy | null;
  pctConsumed: number;
  hoursRemaining: number;
  deadline: Date | null;
}

export function useSLAPolicies() {
  const { tenantId, loading } = useWorkspace();
  return useQuery({
    queryKey: ["sla-policies", tenantId],
    enabled: !loading && !!tenantId,
    queryFn: async (): Promise<SLAPolicy[]> => {
      const { data, error } = await supabase
        .from("sla_policies" as never)
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SLAPolicy[];
    },
  });
}

export function useUpsertSLAPolicy() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (payload: Partial<SLAPolicy> & { name: string }) => {
      if (!tenantId) throw new Error("Workspace não pronto");
      const row = { ...payload, tenant_id: tenantId } as never;
      const { data, error } = payload.id
        ? await supabase.from("sla_policies" as never).update(row).eq("id", payload.id).select().single()
        : await supabase.from("sla_policies" as never).insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Política SLA salva");
      qc.invalidateQueries({ queryKey: ["sla-policies"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteSLAPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sla_policies" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Política removida");
      qc.invalidateQueries({ queryKey: ["sla-policies"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

/**
 * Resolve a melhor policy para uma tarefa (mais específica primeiro).
 */
export function resolvePolicy(
  policies: SLAPolicy[],
  typeId: string | null | undefined,
  priority: Priority | null | undefined,
): SLAPolicy | null {
  const actives = policies.filter((p) => p.active);
  const candidates = actives.filter(
    (p) => (!p.type_id || p.type_id === typeId) && (!p.priority || p.priority === priority),
  );
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const aScore = (a.type_id === typeId ? 0 : 1) + (a.priority === priority ? 0 : 1);
    const bScore = (b.type_id === typeId ? 0 : 1) + (b.priority === priority ? 0 : 1);
    return aScore - bScore;
  });
  return candidates[0];
}

/**
 * Calcula status do SLA para uma tarefa específica.
 */
export function computeSLA(
  task: {
    created_at?: string | null;
    done_at?: string | null;
    type_id?: string | null;
    priority?: Priority | null;
  },
  policies: SLAPolicy[],
): SLAComputed {
  const policy = resolvePolicy(policies, task.type_id, task.priority);
  if (!policy || !task.created_at) {
    return { status: "none", policy: null, pctConsumed: 0, hoursRemaining: 0, deadline: null };
  }
  const created = new Date(task.created_at).getTime();
  const deadline = new Date(created + policy.resolution_hours * 3600_000);
  const now = Date.now();

  if (task.done_at) {
    const done = new Date(task.done_at).getTime();
    const met = done <= deadline.getTime();
    return {
      status: met ? "met" : "breached",
      policy,
      pctConsumed: Math.min(100, ((done - created) / (policy.resolution_hours * 3600_000)) * 100),
      hoursRemaining: 0,
      deadline,
    };
  }

  const elapsedH = (now - created) / 3600_000;
  const pct = (elapsedH / policy.resolution_hours) * 100;
  const hoursRemaining = policy.resolution_hours - elapsedH;

  let status: SLAStatus = "ok";
  if (pct >= 100) status = "breached";
  else if (pct >= policy.warning_threshold_pct) status = "warning";

  return { status, policy, pctConsumed: Math.min(100, pct), hoursRemaining, deadline };
}

export function useTaskSLA(task: {
  created_at?: string | null;
  done_at?: string | null;
  type_id?: string | null;
  priority?: Priority | null;
}) {
  const { data: policies = [] } = useSLAPolicies();
  return computeSLA(task, policies);
}