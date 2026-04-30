import { useState } from "react";
import { GitBranch, Plus, Trash2, Users, User as UserIcon, ArrowDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTenantMembers } from "@/hooks/useSquads";
import {
  useWorkflows, useCreateWorkflow, useDeleteWorkflow,
  ApproverKind, TenantRole, WorkflowWithSteps,
} from "@/hooks/useApprovals";
import { cn } from "@/lib/utils";

interface DraftStep {
  name: string;
  approver_kind: ApproverKind;
  approver_role: TenantRole | null;
  approver_user_id: string | null;
  required_approvals: number;
  allow_skip: boolean;
}

const ROLE_LABELS: Record<TenantRole, string> = {
  admin: "Admin",
  manager: "Manager",
  specialist: "Specialist",
  requester: "Requester",
};

function CreateWorkflowDialog() {
  const create = useCreateWorkflow();
  const { data: members } = useTenantMembers();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<DraftStep[]>([
    { name: "Aprovação interna", approver_kind: "tenant_role", approver_role: "manager", approver_user_id: null, required_approvals: 1, allow_skip: false },
  ]);

  const updateStep = (i: number, patch: Partial<DraftStep>) =>
    setSteps((cur) => cur.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addStep = () =>
    setSteps((cur) => [...cur, { name: `Etapa ${cur.length + 1}`, approver_kind: "tenant_role", approver_role: "admin", approver_user_id: null, required_approvals: 1, allow_skip: false }]);
  const removeStep = (i: number) => setSteps((cur) => cur.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Novo workflow</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Criar workflow de aprovação</DialogTitle></DialogHeader>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Aprovação de campanha" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Quando usar este fluxo" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Etapas (executadas em ordem)</Label>
            {steps.map((step, i) => (
              <Card key={i} className="border-dashed">
                <CardContent className="space-y-3 p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{i + 1}</Badge>
                    <Input
                      value={step.name}
                      onChange={(e) => updateStep(i, { name: e.target.value })}
                      placeholder="Nome da etapa"
                    />
                    <Button size="icon" variant="ghost" aria-label="Remover" onClick={() => removeStep(i)} disabled={steps.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Aprovador</Label>
                      <Select
                        value={step.approver_kind}
                        onValueChange={(v) => updateStep(i, { approver_kind: v as ApproverKind })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tenant_role">Por papel</SelectItem>
                          <SelectItem value="user">Pessoa específica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">{step.approver_kind === "user" ? "Pessoa" : "Papel"}</Label>
                      {step.approver_kind === "user" ? (
                        <Select
                          value={step.approver_user_id ?? ""}
                          onValueChange={(v) => updateStep(i, { approver_user_id: v })}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                          <SelectContent>
                            {(members ?? []).map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.display_name || m.full_name || m.email}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select
                          value={step.approver_role ?? "admin"}
                          onValueChange={(v) => updateStep(i, { approver_role: v as TenantRole })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(ROLE_LABELS) as TenantRole[]).map((r) => (
                              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Aprovações exigidas</Label>
                      <Input
                        type="number" min={1}
                        value={step.required_approvals}
                        onChange={(e) => updateStep(i, { required_approvals: Math.max(1, Number(e.target.value)) })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={addStep}><Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar etapa</Button>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!name || create.isPending}
            onClick={async () => {
              await create.mutateAsync({ name, description, steps });
              setOpen(false);
              setName(""); setDescription("");
              setSteps([{ name: "Aprovação interna", approver_kind: "tenant_role", approver_role: "manager", approver_user_id: null, required_approvals: 1, allow_skip: false }]);
            }}
          >Criar workflow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WorkflowCard({ wf, members }: { wf: WorkflowWithSteps; members: { id: string; display_name: string | null; full_name: string | null; email: string | null }[] }) {
  const remove = useDeleteWorkflow();
  const memberName = (uid: string | null) => {
    if (!uid) return "—";
    const m = members.find((x) => x.id === uid);
    return m?.display_name || m?.full_name || m?.email || "—";
  };
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{wf.name}</CardTitle>
            {wf.description && <p className="mt-1 text-xs text-muted-foreground">{wf.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={wf.active ? "default" : "outline"} className="text-[10px]">{wf.active ? "Ativo" : "Inativo"}</Badge>
            <Button size="icon" variant="ghost" aria-label="Remover" onClick={() => { if (confirm("Excluir workflow?")) remove.mutate(wf.id); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {wf.steps.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem etapas configuradas.</p>
        ) : (
          <ol className="space-y-2">
            {wf.steps.map((s, i) => (
              <li key={s.id}>
                <div className="flex items-center gap-3 rounded-md border bg-muted/20 p-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {s.position}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {s.approver_kind === "user" ? (
                        <span className="inline-flex items-center gap-1"><UserIcon className="h-3 w-3" /> {memberName(s.approver_user_id)}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {ROLE_LABELS[s.approver_role ?? "admin"]}</span>
                      )}
                      <span>· {s.required_approvals} {s.required_approvals === 1 ? "aprovação" : "aprovações"}</span>
                    </div>
                  </div>
                </div>
                {i < wf.steps.length - 1 && (
                  <div className="flex justify-center py-0.5"><ArrowDown className="h-3 w-3 text-muted-foreground" /></div>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export default function ApprovalsPage() {
  const { data: workflows, isLoading } = useWorkflows();
  const { data: members } = useTenantMembers();

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
            <GitBranch className="mr-1.5 h-3 w-3" /> Aprovações · Fase 2 · Passo 21
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Workflows de aprovação</h1>
          <p className="mt-1 text-sm text-muted-foreground">Crie fluxos com múltiplas etapas. Cada etapa pode exigir uma pessoa ou um papel, com quórum mínimo de aprovações.</p>
        </div>
        <CreateWorkflowDialog />
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      ) : (workflows ?? []).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nenhum workflow ainda. Crie o primeiro para usar nas tarefas.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workflows!.map((wf) => <WorkflowCard key={wf.id} wf={wf} members={members ?? []} />)}
        </div>
      )}

      {/* Tiny visual flag */}
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Check className="h-3 w-3 text-emerald-500" /> Workflows ativos podem ser disparados na aba "Aprovações" do detalhe de cada tarefa.
      </p>
    </div>
  );
}