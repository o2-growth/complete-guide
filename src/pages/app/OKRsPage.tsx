import { useState } from "react";
import { Target, Plus, Trash2, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  useGoals, useUpsertGoal, useDeleteGoal,
  useKeyResults, useUpsertKR, useDeleteKR, useRecalcKRs, krProgressPct,
} from "@/hooks/useOKRs";
import { TASK_METRICS, POST_METRICS } from "@/hooks/useWarehouse";

function statusColor(s: string) {
  if (s === "done") return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
  if (s === "at_risk") return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  if (s === "dropped") return "bg-muted text-muted-foreground";
  return "bg-primary/10 text-primary border-primary/30";
}

function GoalRow({ goal, expanded, onToggle, onDelete }: { goal: ReturnType<typeof useGoals>["data"] extends (infer T)[] | undefined ? T : never; expanded: boolean; onToggle: () => void; onDelete: () => void }) {
  const { data: krs = [] } = useKeyResults(expanded ? goal.id : null);
  const upsertKR = useUpsertKR();
  const delKR = useDeleteKR();
  const [open, setOpen] = useState(false);
  const [krForm, setKrForm] = useState({
    title: "", source: "tasks" as "tasks" | "posts" | "manual",
    metric: "done_count", baseline: 0, target: 100, direction: "up" as "up" | "down", unit: "",
  });

  const avg = krs.length ? krs.reduce((a, k) => a + krProgressPct(k), 0) / krs.length : 0;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{goal.title}</h3>
            <Badge variant="outline" className={statusColor(goal.status)}>{goal.status}</Badge>
          </div>
          {goal.description && <p className="text-xs text-muted-foreground">{goal.description}</p>}
          <p className="text-[11px] text-muted-foreground mt-0.5">{goal.period_start} → {goal.period_end}</p>
        </div>
        <div className="w-48">
          <div className="text-xs text-muted-foreground mb-1">Progresso médio</div>
          <Progress value={avg} className="h-2" />
          <div className="text-[10px] text-right mt-0.5">{avg.toFixed(0)}%</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>

      {expanded && (
        <div className="ml-10 space-y-2 border-l pl-4">
          {krs.length === 0 && <p className="text-sm text-muted-foreground">Nenhum KR ainda.</p>}
          {krs.map((k) => {
            const pct = krProgressPct(k);
            return (
              <div key={k.id} className="flex items-center gap-3 py-1.5">
                <div className="flex-1">
                  <div className="text-sm font-medium">{k.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {k.source} · {k.metric} · base {k.baseline} → alvo {k.target} {k.unit ?? ""}
                  </div>
                </div>
                <div className="w-40">
                  <Progress value={pct} className="h-1.5" />
                  <div className="text-[10px] flex justify-between mt-0.5">
                    <span>{Number(k.current_value).toFixed(0)}</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                </div>
                {k.source === "manual" && (
                  <Input className="h-7 w-20 text-xs" type="number" defaultValue={k.manual_value ?? 0}
                         onBlur={(e) => upsertKR.mutate({ id: k.id, goal_id: k.goal_id, manual_value: Number(e.target.value) })} />
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => delKR.mutate(k.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="mr-2 h-3.5 w-3.5" />Adicionar KR</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Key Result</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Título</Label>
                  <Input value={krForm.title} onChange={(e) => setKrForm({ ...krForm, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Fonte</Label>
                    <Select value={krForm.source} onValueChange={(v) => setKrForm({ ...krForm, source: v as "tasks" | "posts" | "manual", metric: v === "tasks" ? "done_count" : v === "posts" ? "reach" : "value" })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tasks">Tarefas</SelectItem>
                        <SelectItem value="posts">Posts sociais</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Métrica</Label>
                    {krForm.source === "manual" ? (
                      <Input value={krForm.metric} onChange={(e) => setKrForm({ ...krForm, metric: e.target.value })} placeholder="ex: receita" />
                    ) : (
                      <Select value={krForm.metric} onValueChange={(v) => setKrForm({ ...krForm, metric: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(krForm.source === "tasks" ? TASK_METRICS : POST_METRICS).map((m) => (
                            <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><Label className="text-xs">Baseline</Label>
                    <Input type="number" value={krForm.baseline} onChange={(e) => setKrForm({ ...krForm, baseline: Number(e.target.value) })} /></div>
                  <div><Label className="text-xs">Alvo</Label>
                    <Input type="number" value={krForm.target} onChange={(e) => setKrForm({ ...krForm, target: Number(e.target.value) })} /></div>
                  <div><Label className="text-xs">Unidade</Label>
                    <Input value={krForm.unit} onChange={(e) => setKrForm({ ...krForm, unit: e.target.value })} placeholder="ex: posts" /></div>
                </div>
                <div>
                  <Label className="text-xs">Direção</Label>
                  <Select value={krForm.direction} onValueChange={(v) => setKrForm({ ...krForm, direction: v as "up" | "down" })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="up">Quanto maior, melhor</SelectItem>
                      <SelectItem value="down">Quanto menor, melhor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={async () => {
                  await upsertKR.mutateAsync({ goal_id: goal.id, ...krForm });
                  setOpen(false);
                  setKrForm({ ...krForm, title: "" });
                }}>Criar KR</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </Card>
  );
}

export default function OKRsPage() {
  const { data: goals = [] } = useGoals();
  const upsertGoal = useUpsertGoal();
  const delGoal = useDeleteGoal();
  const recalc = useRecalcKRs();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "",
    period_start: new Date().toISOString().slice(0, 10),
    period_end: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  });

  return (
    <div className="space-y-4 p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Target className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Goals & OKRs</h1>
          <p className="text-sm text-muted-foreground">
            Metas e KRs com progresso automático puxando do warehouse de tarefas e posts.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => recalc.mutate()} disabled={recalc.isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${recalc.isPending ? "animate-spin" : ""}`} />
          Recalcular progresso
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Nova meta</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova meta</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label className="text-xs">Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Início</Label>
                  <Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} /></div>
                <div><Label className="text-xs">Fim</Label>
                  <Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} /></div>
              </div>
              <Button className="w-full" onClick={async () => {
                if (!form.title) return;
                await upsertGoal.mutateAsync(form);
                setOpen(false);
                setForm({ ...form, title: "", description: "" });
              }}>Criar meta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {goals.length === 0 && (
        <Card className="p-12 text-center">
          <Target className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Nenhuma meta ainda. Crie sua primeira para começar.</p>
        </Card>
      )}
      <div className="space-y-2">
        {goals.map((g) => (
          <GoalRow key={g.id} goal={g} expanded={expanded === g.id}
                   onToggle={() => setExpanded(expanded === g.id ? null : g.id)}
                   onDelete={() => delGoal.mutate(g.id)} />
        ))}
      </div>
    </div>
  );
}