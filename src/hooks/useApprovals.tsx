import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export type ApproverKind = "user" | "tenant_role";
export type ApprovalStatus = "draft" | "in_progress" | "approved" | "rejected" | "cancelled";
export type DecisionKind = "approved" | "rejected";
export type TenantRole = "admin" | "manager" | "specialist" | "requester";

export interface ApprovalWorkflow {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface ApprovalStep {
  id: string;
  workflow_id: string;
  tenant_id: string;
  position: number;
  name: string;
  approver_kind: ApproverKind;
  approver_user_id: string | null;
  approver_role: TenantRole | null;
  required_approvals: number;
  allow_skip: boolean;
}

export interface ApprovalInstance {
  id: string;
  tenant_id: string;
  workflow_id: string;
  task_id: string | null;
  current_step_position: number;
  status: ApprovalStatus;
  requested_by: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ApprovalDecision {
  id: string;
  instance_id: string;
  step_id: string;
  decided_by: string;
  decision: DecisionKind;
  comment: string | null;
  created_at: string;
}

export interface WorkflowWithSteps extends ApprovalWorkflow {
  steps: ApprovalStep[];
}

export function useWorkflows() {
  const { tenantId, loading } = useWorkspace();
  return useQuery({
    queryKey: ["approval-workflows", tenantId],
    enabled: !loading && !!tenantId,
    queryFn: async (): Promise<WorkflowWithSteps[]> => {
      const [wfRes, stRes] = await Promise.all([
        supabase.from("approval_workflows").select("*").eq("tenant_id", tenantId!).order("created_at"),
        supabase.from("approval_steps").select("*").eq("tenant_id", tenantId!).order("position"),
      ]);
      if (wfRes.error) throw wfRes.error;
      if (stRes.error) throw stRes.error;
      const steps = (stRes.data ?? []) as ApprovalStep[];
      return (wfRes.data ?? []).map((w) => ({
        ...(w as ApprovalWorkflow),
        steps: steps.filter((s) => s.workflow_id === w.id),
      }));
    },
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; steps: Array<Omit<ApprovalStep, "id" | "workflow_id" | "tenant_id" | "position">> }) => {
      if (!tenantId) throw new Error("Sem workspace");
      const { data: wf, error } = await supabase.from("approval_workflows")
        .insert([{ tenant_id: tenantId, name: input.name, description: input.description ?? null }])
        .select().single();
      if (error) throw error;
      if (input.steps.length > 0) {
        const { error: e2 } = await supabase.from("approval_steps").insert(
          input.steps.map((s, i) => ({
            workflow_id: wf.id,
            tenant_id: tenantId,
            position: i + 1,
            name: s.name,
            approver_kind: s.approver_kind,
            approver_user_id: s.approver_user_id,
            approver_role: s.approver_role,
            required_approvals: s.required_approvals,
            allow_skip: s.allow_skip,
          })),
        );
        if (e2) throw e2;
      }
      return wf;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approval-workflows", tenantId] });
      toast.success("Workflow criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("approval_workflows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approval-workflows", tenantId] }),
  });
}

export function useApprovalInstancesForTask(taskId: string | undefined) {
  return useQuery({
    queryKey: ["approval-instances", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const [insRes, decRes] = await Promise.all([
        supabase.from("approval_instances").select("*").eq("task_id", taskId!).order("created_at", { ascending: false }),
        supabase.from("approval_decisions").select("*"),
      ]);
      const instances = (insRes.data ?? []) as ApprovalInstance[];
      const decisions = (decRes.data ?? []) as ApprovalDecision[];
      return instances.map((i) => ({
        ...i,
        decisions: decisions.filter((d) => d.instance_id === i.id),
      }));
    },
  });
}

export function useStartApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, taskId, notes }: { workflowId: string; taskId: string; notes?: string }) => {
      const { error } = await supabase.rpc("approval_start", {
        _workflow_id: workflowId,
        _task_id: taskId,
        _notes: notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["approval-instances", vars.taskId] });
      toast.success("Aprovação iniciada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDecideApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ instanceId, decision, comment, taskId }: { instanceId: string; decision: DecisionKind; comment?: string; taskId?: string | null }) => {
      const { error } = await supabase.rpc("approval_decide", {
        _instance_id: instanceId,
        _decision: decision,
        _comment: comment ?? null,
      });
      if (error) throw error;
      return taskId;
    },
    onSuccess: (taskId) => {
      if (taskId) qc.invalidateQueries({ queryKey: ["approval-instances", taskId] });
      toast.success("Decisão registrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}