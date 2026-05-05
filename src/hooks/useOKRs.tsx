import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type GoalUpdate = Database["public"]["Tables"]["goals"]["Update"];
type KeyResultUpdate = Database["public"]["Tables"]["key_results"]["Update"];

export interface Goal {
  id: string; tenant_id: string; title: string; description: string | null;
  period_start: string; period_end: string; owner_id: string | null;
  status: "active" | "done" | "at_risk" | "dropped"; created_at: string;
}
export type KrTargetType = "numeric" | "monetary" | "tasks" | "boolean" | "percentage";

export interface KrLinkedTaskFilter {
  project_id?: string | null;
  tag_id?: string | null;
}

export interface KeyResult {
  id: string; tenant_id: string; goal_id: string; title: string;
  source: "tasks" | "posts" | "manual"; metric: string;
  baseline: number; target: number; current_value: number;
  unit: string | null; direction: "up" | "down"; manual_value: number | null;
  // 7D — pode não vir até o patch SQL ser aplicado no Lovable.
  target_type?: KrTargetType;
  auto_update?: boolean;
  linked_task_filter?: KrLinkedTaskFilter | null;
}

export function useGoals() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["goals", tenantId], enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*")
        .eq("tenant_id", tenantId!).order("period_end", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
  });
}

export function useKeyResults(goalId: string | null) {
  return useQuery({
    queryKey: ["key_results", goalId], enabled: !!goalId,
    queryFn: async () => {
      const { data, error } = await supabase.from("key_results").select("*").eq("goal_id", goalId!);
      if (error) throw error;
      return (data ?? []) as KeyResult[];
    },
  });
}

export function useUpsertGoal() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<Goal> & { id?: string }) => {
      if (!tenantId) throw new Error("Workspace");
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from("goals").update(patch as GoalUpdate).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from("goals").insert({
        tenant_id: tenantId,
        title: input.title ?? "Nova meta",
        description: input.description ?? null,
        period_start: input.period_start ?? new Date().toISOString().slice(0, 10),
        period_end: input.period_end ?? new Date(Date.now() + 90*86400000).toISOString().slice(0, 10),
        owner_id: input.owner_id ?? user?.id ?? null,
        status: input.status ?? "active",
        created_by: user?.id ?? null,
      }).select("id").maybeSingle();
      if (error) throw error;
      return data?.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpsertKR() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: Partial<KeyResult> & { id?: string; goal_id: string }) => {
      if (!tenantId) throw new Error("Workspace");
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from("key_results").update(patch as KeyResultUpdate).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from("key_results").insert({
        tenant_id: tenantId,
        goal_id: input.goal_id,
        title: input.title ?? "Novo KR",
        source: input.source ?? "tasks",
        metric: input.metric ?? "done_count",
        baseline: input.baseline ?? 0,
        target: input.target ?? 100,
        current_value: 0,
        unit: input.unit ?? null,
        direction: input.direction ?? "up",
        manual_value: input.manual_value ?? null,
      }).select("id").maybeSingle();
      if (error) throw error;
      return data?.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["key_results"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteKR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("key_results").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["key_results"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRecalcKRs() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("kr_progress", { _tenant: tenantId! });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["key_results"] });
      toast.success("Progresso recalculado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/**
 * Atualiza progresso dos KRs com `auto_update=true` baseado no
 * `linked_task_filter`.
 */
export function useRefreshKrProgress() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("Workspace");
      const { error } = await supabase.rpc("refresh_kr_progress", { _tenant: tenantId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["key_results"] });
      toast.success("Progresso automático atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function krProgressPct(kr: KeyResult): number {
  if (kr.target === kr.baseline) return 0;
  if (kr.direction === "up") {
    return Math.max(0, Math.min(1, (kr.current_value - kr.baseline) / (kr.target - kr.baseline))) * 100;
  }
  return Math.max(0, Math.min(1, (kr.baseline - kr.current_value) / (kr.baseline - kr.target))) * 100;
}