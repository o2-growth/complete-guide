import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export interface AutomationCondition {
  field: string;
  op: string;
  value: unknown;
}

// `conditions` aceita dois formatos:
//   - legado: array simples (AND implícito)
//   - novo (visual): { all: [...] } | { any: [...] }
export type AutomationConditions =
  | AutomationCondition[]
  | { all?: AutomationCondition[]; any?: AutomationCondition[] };

export interface AutomationAction {
  kind: string;
  params: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  conditions: AutomationConditions;
  actions: AutomationAction[];
  active: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
  icon: string | null;
  color: string | null;
  is_template: boolean;
  template_category: string | null;
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
  { value: "task.created", label: "Tarefa criada", icon: "Plus" },
  { value: "task.updated", label: "Tarefa muda de status", icon: "ArrowRight" },
  { value: "task.completed", label: "Tarefa concluída", icon: "CheckCircle2" },
  { value: "task.assigned", label: "Tarefa atribuída", icon: "UserPlus" },
  { value: "task.overdue", label: "Tarefa atrasada", icon: "AlarmClock" },
  { value: "comment.added", label: "Comentário adicionado", icon: "MessageSquare" },
  { value: "attachment.added", label: "Anexo enviado", icon: "Paperclip" },
  { value: "anomaly.detected", label: "Anomalia detectada", icon: "AlertTriangle" },
  { value: "goal.at_risk", label: "Meta em risco", icon: "Target" },
  { value: "wiki.updated", label: "Página da wiki atualizada", icon: "BookOpen" },
  { value: "ticket.created", label: "Ticket aberto", icon: "Ticket" },
  { value: "gcal.synced", label: "Evento sincronizado do Google Calendar", icon: "Calendar" },
  { value: "manual", label: "Disparo manual (botão)", icon: "MousePointerClick" },
] as const;

export const ACTION_KINDS = [
  { value: "create_task", label: "Criar nova tarefa", icon: "Plus" },
  { value: "set_status", label: "Mover para status…", icon: "MoveRight" },
  { value: "assign_to", label: "Atribuir para…", icon: "UserPlus" },
  { value: "notify", label: "Notificar usuário", icon: "Bell" },
  { value: "chat_notify", label: "Postar em chat (Slack/Teams/Discord)", icon: "MessageCircle" },
  { value: "webhook", label: "Chamar webhook", icon: "Webhook" },
  { value: "add_tag", label: "Adicionar tag", icon: "TagIcon" },
  { value: "remove_tag", label: "Remover tag", icon: "TagIcon" },
  { value: "update_field", label: "Atualizar campo", icon: "Pencil" },
] as const;

export const TEMPLATE_CATEGORIES = [
  { value: "notificacoes", label: "Notificações", icon: "Bell" },
  { value: "sla", label: "SLA & Prazos", icon: "AlarmClock" },
  { value: "atribuicao", label: "Atribuição", icon: "UserPlus" },
  { value: "webhooks", label: "Webhooks", icon: "Webhook" },
  { value: "ia", label: "IA Gênio", icon: "Sparkles" },
  { value: "tickets", label: "Atendimento", icon: "Ticket" },
] as const;

export const CONDITION_FIELDS = [
  { value: "priority", label: "Prioridade" },
  { value: "status_id", label: "Status" },
  { value: "project_id", label: "Projeto" },
  { value: "squad_id", label: "Squad" },
  { value: "assignee_id", label: "Responsável" },
  { value: "tag", label: "Tag" },
  { value: "type_id", label: "Tipo da tarefa" },
] as const;

export const CONDITION_OPS = [
  { value: "eq", label: "é igual a" },
  { value: "ne", label: "é diferente de" },
  { value: "in", label: "está em" },
  { value: "exists", label: "tem valor" },
  { value: "not_exists", label: "está vazio" },
] as const;

const DEFAULT_RULE_LIST: AutomationRule[] = [];

function fromLegacyConditions(raw: unknown): AutomationConditions {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as AutomationCondition[];
  return raw as AutomationConditions;
}

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
      return ((data ?? []) as unknown as AutomationRule[])
        .map((r) => ({ ...r, conditions: fromLegacyConditions(r.conditions) }));
    },
    initialData: DEFAULT_RULE_LIST,
  });
}

export function useAutomationRule(id: string | null) {
  return useQuery({
    queryKey: ["automation_rule", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...(data as unknown as AutomationRule), conditions: fromLegacyConditions((data as { conditions: unknown }).conditions) };
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

export function useAutomationTemplates() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["automation_templates", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("is_template" as never, true as never)
        .order("template_category" as never, { ascending: true });
      if (error) throw error;
      return ((data ?? []) as unknown as AutomationRule[])
        .map((r) => ({ ...r, conditions: fromLegacyConditions(r.conditions) }));
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
        icon: (rule.icon ?? "Zap") as unknown as never,
        color: (rule.color ?? "#0EA5E9") as unknown as never,
        is_template: (rule.is_template ?? false) as unknown as never,
        template_category: (rule.template_category ?? null) as unknown as never,
      };
      if (rule.id) {
        const { error } = await supabase.from("automation_rules").update(payload as never).eq("id", rule.id);
        if (error) throw error;
        return rule.id;
      }
      const { data, error } = await supabase.from("automation_rules").insert(payload as never).select("id").maybeSingle();
      if (error) throw error;
      return (data as { id?: string } | null)?.id ?? null;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation_rules"] });
      qc.invalidateQueries({ queryKey: ["automation_templates"] });
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

// Dry-run: chama a edge function com `dry_run: true` e payload simulado.
// A function ainda não suporta dry-run nativamente — fallback seguro:
// se vier 4xx/5xx, devolvemos um relatório local (avalia conditions só).
export function useTestAutomation() {
  return useMutation({
    mutationFn: async (input: { rule: Partial<AutomationRule>; payload: Record<string, unknown> }) => {
      const { rule, payload } = input;
      try {
        const { data, error } = await supabase.functions.invoke("process-automations", {
          body: { dry_run: true, rule, payload },
        });
        if (error) throw error;
        return data as { matched: boolean; actions_simulated: number; details?: unknown };
      } catch {
        // Fallback local: avalia condições e retorna preview de ações.
        const conds = rule.conditions ?? [];
        const evalOne = (c: AutomationCondition) => {
          const actual = (payload as Record<string, unknown>)[c.field];
          switch (c.op) {
            case "eq": return actual === c.value;
            case "ne": return actual !== c.value;
            case "in": return Array.isArray(c.value) && (c.value as unknown[]).includes(actual);
            case "exists": return actual !== null && actual !== undefined;
            case "not_exists": return actual === null || actual === undefined;
            default: return true;
          }
        };
        let matched = true;
        if (Array.isArray(conds)) {
          matched = (conds as AutomationCondition[]).every(evalOne);
        } else {
          const c = conds as { all?: AutomationCondition[]; any?: AutomationCondition[] };
          if (c.all) matched = c.all.every(evalOne);
          else if (c.any) matched = c.any.some(evalOne);
        }
        return {
          matched,
          actions_simulated: matched ? (rule.actions ?? []).length : 0,
          details: { fallback: true, payload, actions: rule.actions ?? [] },
        };
      }
    },
  });
}

export function useApplyTemplate() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (template: AutomationRule) => {
      if (!tenantId) throw new Error("workspace");
      const payload = {
        tenant_id: tenantId,
        name: template.name,
        description: template.description ?? null,
        trigger_event: template.trigger_event,
        conditions: template.conditions as unknown as never,
        actions: template.actions as unknown as never,
        active: false,
        icon: (template.icon ?? "Zap") as unknown as never,
        color: (template.color ?? "#0EA5E9") as unknown as never,
        is_template: false as unknown as never,
        template_category: null as unknown as never,
      };
      const { data, error } = await supabase
        .from("automation_rules")
        .insert(payload as never)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      return (data as { id?: string } | null)?.id ?? null;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation_rules"] });
      toast.success("Template aplicado — ative quando quiser");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
