import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export interface AutomationRule {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  conditions: Array<{ field: string; op: string; value: unknown }>;
  actions: Array<{ kind: string; params: Record<string, unknown> }>;
  active: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
}

export interface AutomationRun {
  id: string;
  rule_id: string;
  trigger_event: string;
  status: string;
  error: string | null;
  actions_executed: number;
  payload: Record<string, unknown>;
  created_at: string;
}

export const TRIGGER_EVENTS = [
  { value: "task.created", label: "Tarefa criada" },
  { value: "task.updated", label: "Tarefa movida de status" },
  { value: "task.completed", label: "Tarefa concluída" },
  { value: "anomaly.created", label: "Anomalia detectada" },
] as const;

export const ACTION_KINDS = [
  { value: "create_task", label: "Criar nova tarefa" },
  { value: "set_status", label: "Mover para status…" },
  { value: "assign_to", label: "Atribuir para…" },
  { value: "notify", label: "Notificar usuário" },
  { value: "chat_notify", label: "Postar no chat" },
  { value: "webhook", label: "Chamar webhook" },
] as const;

export function useAutomationRules() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["automation_rules", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AutomationRule[];
    },
  });
}

export function useAutomationRuns(ruleId: string | null) {
  return useQuery({
    queryKey: ["automation_runs", ruleId],
    enabled: !!ruleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_runs")
        .select("*")
        .eq("rule_id", ruleId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as AutomationRun[];
    },
  });
}

export function useSaveRule() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (rule: Partial<AutomationRule> & { name: string; trigger_event: string }) => {
      if (!tenantId) throw new Error("workspace");
      const payload = {
        tenant_id: tenantId,
        name: rule.name,
        description: rule.description ?? null,
        trigger_event: rule.trigger_event,
        conditions: (rule.conditions ?? []) as unknown as never,
        actions: (rule.actions ?? []) as unknown as never,
        active: rule.active ?? true,
      };
      if (rule.id) {
        const { error } = await supabase.from("automation_rules").update(payload as never).eq("id", rule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("automation_rules").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation_rules"] });
      toast.success("Regra salva");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("automation_rules").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation_rules"] }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automation_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation_rules"] });
      toast.success("Regra removida");
    },
  });
}

export function useProcessAutomations() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("process-automations", {
        body: { tenant_id: tenantId },
      });
      if (error) throw error;
      return data as { processed: number };
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["automation_rules"] });
      qc.invalidateQueries({ queryKey: ["automation_runs"] });
      toast.success(`${d?.processed ?? 0} eventos processados`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
