import { useEffect, useState } from "react";
import {
  Target, Plus, Trash2, RefreshCw, ChevronDown, ChevronRight, Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  useGoals, useUpsertGoal, useDeleteGoal,
  useKeyResults, useUpsertKR, useDeleteKR, useRecalcKRs, useRefreshKrProgress,
  krProgressPct,
  type Goal, type KeyResult, type KrTargetType, type KrLinkedTaskFilter,
} from "@/hooks/useOKRs";
import { useProjects } from "@/hooks/useWorkload";
import { useWorkspace } from "@/hooks/useWorkspace";
import { TASK_METRICS, POST_METRICS } from "@/hooks/useWarehouse";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

function statusColor(s: string) {
  if (s === "done") return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
  if (s === "at_risk") return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  if (s === "dropped") return "bg-muted text-muted-foreground";
  return "bg-primary/10 text-primary border-primary/30";
}

const TARGET_TYPE_LABEL: Record<KrTargetType, string> = {
  numeric: "Numérico",
  monetary: "Monetário",
  tasks: "Tarefas",
  boolean: "Sim/Não",
  percentage: "Percentual",
};

const TARGET_TYPE_CHIP: Record<KrTargetType, string> = {
  numeric: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  monetary: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  tasks: "bg-primary/15 text-primary border-primary/30",
  boolean: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  percentage: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
};

function formatKrValue(kr: KeyResult, value: number): string {
  const tt = kr.target_type ?? "numeric";
  if (tt === "monetary") {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
  }
  if (tt === "percentage") return `${value.toFixed(0)}%`;
  if (tt === "boolean") return value > 0 ? "Sim" : "Não";
  if (tt === "tasks") return `${Math.round(value)} tarefas`;
  return `${Number(value).toFixed(0)}${kr.unit ? ` ${kr.unit}` : ""}`;
}

function useTagsLite() {
  const { tenantId } = useWorkspace();
  const [tags, setTags] = useState<{ id: string; name: string; color: string | null }[]>([]);
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    void supabase
      .from("tags")
      .select("id, name, color")
      .eq("tenant_id", tenantId)
      .order("name")
      .then(({ data }) => {
        if (!cancelled) setTags(data ?? []);
      });
    return () => { cancelled = true; };
  }, [tenantId]);
  return tags;
}

function KrRow({ kr, onDelete }: { kr: KeyResult; onDelete: () => void }) {
  const upsertKR = useUpsertKR();
  const projects = useProjects().data ?? [];
  const tags = useTagsLite();
  const targetType: KrTargetType = (kr.target_type ?? "numeric") as KrTargetType;
  const filter: KrLinkedTaskFilter = kr.linked_task_filter ?? {};
  const pct = krProgressPct(kr);

  const updateField = (patch: Partial<KeyResult>) => {
    upsertKR.mutate({ id: kr.id, goal_id: kr.goal_id, ...patch });
  };

  return (
    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{kr.title}</span>
            <Badge variant="outline" className={cn("text-[10px]", TARGET_TYPE_CHIP[targetType])}>
              {TARGET_TYPE_LABEL[targetType]}
            </Badge>
            {kr.auto_update && (
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[10px] text-primary">
                <Sparkles className="mr-1 h-2.5 w-2.5" /> auto
              </Badge>
            )}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {formatKrValue(kr, Number(kr.current_value))} de {formatKrValue(kr, Number(kr.target))}
            {targetType !== "boolean" && (
              <> · base {formatKrValue(kr, Number(kr.baseline))}</>
            )}
          </div>
        </div>
        <div className="w-40">
          <Progress value={pct} className="h-1.5" />
          <div className="mt-0.5 text-right text-[10px] tabular-nums">{pct.toFixed(0)}%</div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Tipo:</div>
        <Select
          value={targetType}
          onValueChange={(v) => updateField({ target_type: v as KrTargetType })}
        >
          <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(TARGET_TYPE_LABEL) as KrTargetType[]).map((t) => (
              <SelectItem key={t} value={t}>{TARGET_TYPE_LABEL[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {targetType === "boolean" ? (
          <div className="flex items-center gap-2">
            <Label className="text-xs">Concluído</Label>
            <Switch
              checked={Number(kr.current_value) > 0}
              onCheckedChange={(c) => updateField({ manual_value: c ? 1 : 0, target: 1, baseline: 0 })}
            />
          </div>
        ) : targetType === "percentage" ? (
          <div className="flex flex-1 items-center gap-2">
            <Label className="text-[11px] text-muted-foreground">Atual</Label>
            <Slider
              value={[Math.max(0, Math.min(100, Number(kr.current_value)))]}
              max={100}
              step={1}
              className="flex-1"
              onValueCommit={(v) => updateField({ manual_value: v[0], target: 100, baseline: 0 })}
            />
            <span className="w-10 text-right text-xs tabular-nums">
              {Math.round(Number(kr.current_value))}%
            </span>
          </div>
        ) : targetType === "tasks" ? (
          <>
            <div className="flex items-center gap-1">
              <Label className="text-[11px] text-muted-foreground">Projeto</Label>
              <Select
                value={filter.project_id ?? "__all__"}
                onValueChange={(v) =>
                  updateField({
                    linked_task_filter: { ...filter, project_id: v === "__all__" ? null : v },
                    auto_update: true,
                  })
                }
              >
                <SelectTrigger className="h-7 w-[150px] text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os projetos</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-[11px] text-muted-foreground">Tag</Label>
              <Select
                value={filter.tag_id ?? "__none__"}
                onValueChange={(v) =>
                  updateField({
                    linked_task_filter: { ...filter, tag_id: v === "__none__" ? null : v },
                    auto_update: true,
                  })
                }
              >
                <SelectTrigger className="h-7 w-[150px] text-xs"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {tags.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-[11px] text-muted-foreground">Alvo</Label>
              <Input
                type="number"
                className="h-7 w-20 text-xs"
                defaultValue={Number(kr.target)}
                onBlur={(e) => updateField({ target: Number(e.target.value) })}
              />
            </div>
          </>
        ) : (
          // numeric / monetary
          <div className="flex flex-1 items-center gap-2">
            {targetType === "monetary" && (
              <span className="text-[11px] text-muted-foreground">R$</span>
            )}
            <Label className="text-[11px] text-muted-foreground">Atual</Label>
            <Input
              type="number"
              className="h-7 w-28 text-xs"
              defaultValue={Number(kr.current_value)}
              onBlur={(e) => updateField({ manual_value: Number(e.target.value) })}
            />
            <Label className="text-[11px] text-muted-foreground">Alvo</Label>
            <Input
              type="number"
              className="h-7 w-28 text-xs"
              defaultValue={Number(kr.target)}
              onBlur={(e) => updateField({ target: Number(e.target.value) })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function GoalRow({
  goal, expanded, onToggle, onDelete,
}: {
  goal: Goal; expanded: boolean; onToggle: () => void; onDelete: () => void;
}) {
  const { data: krs = [] } = useKeyResults(expanded ? goal.id : null);
  const upsertKR = useUpsertKR();
  const delKR = useDeleteKR();
  const [open, setOpen] = useState(false);
  const [krForm, setKrForm] = useState({
    title: "",
    target_type: "numeric" as KrTargetType,
    source: "tasks" as "tasks" | "posts" | "manual",
    metric: "done_count",
    baseline: 0,
    target: 100,
    direction: "up" as "up" | "down",
    unit: "",
  });

  const avg = krs.length ? krs.reduce((a, k) => a + krProgressPct(k), 0) / krs.length : 0;

  return (
    <Card className="space-y-3 p-4">
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
          <p className="mt-0.5 text-[11px] text-muted-foreground">{goal.period_start} → {goal.period_end}</p>
        </div>
        <div className="w-48">
          <div className="mb-1 text-xs text-muted-foreground">Progresso médio</div>
          <Progress value={avg} className="h-2" />
          <div className="mt-0.5 text-right text-[10px]">{avg.toFixed(0)}%</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>

      {expanded && (
        <div className="ml-10 space-y-2 border-l pl-4">
          {krs.length === 0 && <p className="text-sm text-muted-foreground">Nenhum KR ainda.</p>}
          {krs.map((k) => (
            <KrRow key={k.id} kr={k} onDelete={() => delKR.mutate(k.id)} />
          ))}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-3.5 w-3.5" />Adicionar KR
              </Button>
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
                    <Label className="text-xs">Tipo de alvo</Label>
                    <Select
                      value={krForm.target_type}
                      onValueChange={(v) => {
                        const tt = v as KrTargetType;
                        const next = { ...krForm, target_type: tt };
                        if (tt === "boolean") { next.baseline = 0; next.target = 1; }
                        if (tt === "percentage") { next.baseline = 0; next.target = 100; next.unit = "%"; }
                        setKrForm(next);
                      }}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(TARGET_TYPE_LABEL) as KrTargetType[]).map((t) => (
                          <SelectItem key={t} value={t}>{TARGET_TYPE_LABEL[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Fonte da métrica</Label>
                    <Select
                      value={krForm.source}
                      onValueChange={(v) => setKrForm({
                        ...krForm,
                        source: v as "tasks" | "posts" | "manual",
                        metric: v === "tasks" ? "done_count" : v === "posts" ? "reach" : "value",
                      })}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tasks">Tarefas</SelectItem>
                        <SelectItem value="posts">Posts sociais</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Métrica</Label>
                  {krForm.source === "manual" ? (
                    <Input
                      value={krForm.metric}
                      onChange={(e) => setKrForm({ ...krForm, metric: e.target.value })}
                      placeholder="ex: receita"
                    />
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
                {krForm.target_type !== "boolean" && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Baseline</Label>
                      <Input
                        type="number"
                        value={krForm.baseline}
                        onChange={(e) => setKrForm({ ...krForm, baseline: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Alvo</Label>
                      <Input
                        type="number"
                        value={krForm.target}
                        onChange={(e) => setKrForm({ ...krForm, target: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unidade</Label>
                      <Input
                        value={krForm.unit}
                        onChange={(e) => setKrForm({ ...krForm, unit: e.target.value })}
                        placeholder="ex: posts"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-xs">Direção</Label>
                  <Select
                    value={krForm.direction}
                    onValueChange={(v) => setKrForm({ ...krForm, direction: v as "up" | "down" })}
                  >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="up">Quanto maior, melhor</SelectItem>
                      <SelectItem value="down">Quanto menor, melhor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={async () => {
                    await upsertKR.mutateAsync({ goal_id: goal.id, ...krForm });
                    setOpen(false);
                    setKrForm({ ...krForm, title: "" });
                  }}
                >
                  Criar KR
                </Button>
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
  const refreshAuto = useRefreshKrProgress();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
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
            Metas e KRs com targets tipados (numérico, monetário, tarefas, sim/não, percentual).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshAuto.mutate()}
          disabled={refreshAuto.isPending}
        >
          <Sparkles className={`mr-2 h-4 w-4 ${refreshAuto.isPending ? "animate-spin" : ""}`} />
          Atualizar progressos automaticamente
        </Button>
        <Button variant="ghost" size="sm" onClick={() => recalc.mutate()} disabled={recalc.isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${recalc.isPending ? "animate-spin" : ""}`} />
          Recalcular (legacy)
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />Nova meta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova meta</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Início</Label>
                  <Input
                    type="date"
                    value={form.period_start}
                    onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Fim</Label>
                  <Input
                    type="date"
                    value={form.period_end}
                    onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={async () => {
                  if (!form.title) return;
                  await upsertGoal.mutateAsync(form);
                  setOpen(false);
                  setForm({ ...form, title: "", description: "" });
                }}
              >
                Criar meta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {goals.length === 0 && (
        <Card className="p-12 text-center">
          <Target className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma meta ainda. Crie sua primeira para começar.</p>
        </Card>
      )}
      <div className="space-y-2">
        {goals.map((g) => (
          <GoalRow
            key={g.id}
            goal={g}
            expanded={expanded === g.id}
            onToggle={() => setExpanded(expanded === g.id ? null : g.id)}
            onDelete={() => delGoal.mutate(g.id)}
          />
        ))}
      </div>
    </div>
  );
}
