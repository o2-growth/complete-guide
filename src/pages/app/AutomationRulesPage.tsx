import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Workflow, Trash2, Play, Zap, ChevronRight } from "lucide-react";
import {
  useAutomationRules, useSaveRule, useToggleRule, useDeleteRule, useProcessAutomations,
  TRIGGER_EVENTS, ACTION_KINDS, type AutomationRule,
} from "@/hooks/useAutomations";
import { EmptyState } from "@/components/EmptyState";
import { SEO } from "@/components/SEO";

export default function AutomationRulesPage() {
  const { data: rules = [], isLoading } = useAutomationRules();
  const save = useSaveRule();
  const toggle = useToggleRule();
  const del = useDeleteRule();
  const process = useProcessAutomations();
  const [editing, setEditing] = useState<Partial<AutomationRule> | null>(null);

  const startNew = () => setEditing({
    name: "", description: "", trigger_event: "task.created",
    conditions: [], actions: [{ kind: "notify", params: {} }], active: true,
  });

  return (
    <div className="space-y-6">
      <SEO title="Regras de automação" description="Crie regras 'quando X, faça Y' sem código." />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" /> Regras de automação
          </h1>
          <p className="text-sm text-muted-foreground">Quando algo acontecer, dispare ações automaticamente.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => process.mutate()} disabled={process.isPending}>
            <Play className="h-4 w-4 mr-1" /> Processar fila agora
          </Button>
          <Button size="sm" onClick={startNew}><Plus className="h-4 w-4 mr-1" /> Nova regra</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="Nenhuma regra ainda"
          description="Crie sua primeira automação: por exemplo, notificar o líder quando uma tarefa urgente for criada."
          actionLabel="Criar primeira regra"
          onAction={startNew}
        />
      ) : (
        <div className="grid gap-3">
          {rules.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Switch checked={r.active} onCheckedChange={(active) => toggle.mutate({ id: r.id, active })} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{r.name}</span>
                    <Badge variant="outline" className="text-[10px]">{TRIGGER_EVENTS.find(t => t.value === r.trigger_event)?.label ?? r.trigger_event}</Badge>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{r.actions.length} ação(ões)</span>
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Executou {r.run_count}× {r.last_run_at && `· última ${new Date(r.last_run_at).toLocaleString("pt-BR")}`}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>Editar</Button>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar regra" : "Nova regra"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium">Nome</label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Descrição</label>
                <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="min-h-[60px]" />
              </div>
              <div>
                <label className="text-xs font-medium">Quando (gatilho)</label>
                <Select value={editing.trigger_event} onValueChange={(v) => setEditing({ ...editing, trigger_event: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Então (ações)</label>
                <div className="space-y-2 mt-1">
                  {(editing.actions ?? []).map((a, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Select value={a.kind} onValueChange={(v) => {
                        const next = [...(editing.actions ?? [])];
                        next[i] = { kind: v, params: {} };
                        setEditing({ ...editing, actions: next });
                      }}>
                        <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACTION_KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder='params JSON (ex: {"title":"..."})'
                        value={JSON.stringify(a.params ?? {})}
                        onChange={(e) => {
                          const next = [...(editing.actions ?? [])];
                          try { next[i] = { kind: a.kind, params: JSON.parse(e.target.value || "{}") }; setEditing({ ...editing, actions: next }); } catch { /* ignore */ }
                        }}
                      />
                      <Button variant="ghost" size="icon" onClick={() => {
                        const next = (editing.actions ?? []).filter((_, j) => j !== i);
                        setEditing({ ...editing, actions: next });
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setEditing({ ...editing, actions: [...(editing.actions ?? []), { kind: "notify", params: {} }] })}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar ação
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!editing?.name || !editing.trigger_event) return;
              await save.mutateAsync({
                id: editing.id, name: editing.name, description: editing.description,
                trigger_event: editing.trigger_event, conditions: editing.conditions ?? [],
                actions: editing.actions ?? [], active: editing.active ?? true,
              });
              setEditing(null);
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
