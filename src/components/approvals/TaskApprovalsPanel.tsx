import { useState } from "react";
import { GitBranch, Check, X, Clock, AlertCircle, ArrowRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useWorkflows,
  useApprovalInstancesForTask,
  useStartApproval,
  useDecideApproval,
  ApprovalStatus,
} from "@/hooks/useApprovals";
import { cn } from "@/lib/utils";

const STATUS_META: Record<ApprovalStatus, { label: string; cls: string; icon: typeof Check }> = {
  draft: { label: "Rascunho", cls: "bg-muted text-muted-foreground", icon: Clock },
  in_progress: { label: "Em andamento", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400", icon: Clock },
  approved: { label: "Aprovado", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", icon: Check },
  rejected: { label: "Recusado", cls: "bg-rose-500/10 text-rose-700 dark:text-rose-400", icon: X },
  cancelled: { label: "Cancelado", cls: "bg-muted text-muted-foreground", icon: AlertCircle },
};

export function TaskApprovalsPanel({ taskId }: { taskId: string }) {
  const { data: workflows } = useWorkflows();
  const { data: instances } = useApprovalInstancesForTask(taskId);
  const start = useStartApproval();
  const decide = useDecideApproval();

  const [chosen, setChosen] = useState<string>("");
  const [comment, setComment] = useState("");

  const activeWorkflows = (workflows ?? []).filter((w) => w.active && w.steps.length > 0);

  return (
    <div className="space-y-4">
      {/* Start a new approval */}
      <Card className="border-dashed">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Iniciar aprovação</h4>
          </div>
          {activeWorkflows.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhum workflow ativo. Crie em <span className="font-mono">/app/aprovacoes</span>.
            </p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={chosen} onValueChange={setChosen}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Selecionar workflow" /></SelectTrigger>
                <SelectContent>
                  {activeWorkflows.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name} ({w.steps.length} {w.steps.length === 1 ? "etapa" : "etapas"})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                disabled={!chosen || start.isPending}
                onClick={async () => {
                  await start.mutateAsync({ workflowId: chosen, taskId });
                  setChosen("");
                }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Iniciar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing instances */}
      {(instances ?? []).length === 0 ? (
        <p className="rounded-md border border-dashed py-8 text-center text-xs text-muted-foreground">
          Nenhuma aprovação iniciada ainda.
        </p>
      ) : (
        instances!.map((inst) => {
          const wf = workflows?.find((w) => w.id === inst.workflow_id);
          const meta = STATUS_META[inst.status];
          const StatusIcon = meta.icon;
          return (
            <Card key={inst.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{wf?.name ?? "Workflow"}</p>
                    {inst.notes && <p className="mt-0.5 text-xs text-muted-foreground">"{inst.notes}"</p>}
                  </div>
                  <Badge className={cn("shrink-0 gap-1 border-0", meta.cls)}>
                    <StatusIcon className="h-3 w-3" /> {meta.label}
                  </Badge>
                </div>

                {/* Steps progress bar */}
                <ol className="flex items-center gap-1">
                  {(wf?.steps ?? []).map((step, i) => {
                    const stepDecisions = inst.decisions.filter((d) => d.step_id === step.id);
                    const approvals = stepDecisions.filter((d) => d.decision === "approved").length;
                    const rejected = stepDecisions.some((d) => d.decision === "rejected");
                    const isCurrent = step.position === inst.current_step_position && inst.status === "in_progress";
                    const isPast = step.position < inst.current_step_position || inst.status === "approved";
                    const cls = rejected
                      ? "bg-rose-500 text-white"
                      : isPast
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                          ? "bg-amber-500 text-white ring-2 ring-amber-300"
                          : "bg-muted text-muted-foreground";
                    return (
                      <li key={step.id} className="flex flex-1 items-center gap-1">
                        <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", cls)}>
                          {rejected ? <X className="h-3 w-3" /> : isPast ? <Check className="h-3 w-3" /> : step.position}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-medium">{step.name}</p>
                          <p className="text-[10px] text-muted-foreground">{approvals}/{step.required_approvals}</p>
                        </div>
                        {i < (wf?.steps.length ?? 0) - 1 && <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />}
                      </li>
                    );
                  })}
                </ol>

                {/* Decision form */}
                {inst.status === "in_progress" && (
                  <div className="space-y-2 rounded-md border bg-muted/20 p-2.5">
                    <Textarea
                      rows={2}
                      placeholder="Comentário (opcional)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm" className="flex-1"
                        onClick={async () => {
                          await decide.mutateAsync({ instanceId: inst.id, decision: "approved", comment, taskId });
                          setComment("");
                        }}
                      >
                        <Check className="mr-1.5 h-3.5 w-3.5" /> Aprovar
                      </Button>
                      <Button
                        size="sm" variant="destructive" className="flex-1"
                        onClick={async () => {
                          await decide.mutateAsync({ instanceId: inst.id, decision: "rejected", comment, taskId });
                          setComment("");
                        }}
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" /> Recusar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Decisions log */}
                {inst.decisions.length > 0 && (
                  <details className="text-[11px] text-muted-foreground">
                    <summary className="cursor-pointer">Histórico ({inst.decisions.length})</summary>
                    <ul className="mt-2 space-y-1">
                      {inst.decisions.map((d) => (
                        <li key={d.id} className="flex items-start gap-2 rounded bg-muted/30 px-2 py-1">
                          {d.decision === "approved" ? <Check className="mt-0.5 h-3 w-3 text-emerald-600" /> : <X className="mt-0.5 h-3 w-3 text-rose-600" />}
                          <span className="flex-1">
                            <span className="font-medium text-foreground">{d.decision === "approved" ? "Aprovado" : "Recusado"}</span>
                            {d.comment && <span> · {d.comment}</span>}
                            <span className="ml-2 text-muted-foreground/60">{new Date(d.created_at).toLocaleString("pt-BR")}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}