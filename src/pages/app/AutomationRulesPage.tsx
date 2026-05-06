import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Workflow, Trash2, Play, Zap, FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  useAutomationRules,
  useSaveRule,
  useToggleRule,
  useDeleteRule,
  useProcessAutomations,
  useTestAutomation,
  TRIGGER_EVENTS,
  type AutomationRule,
} from "@/hooks/useAutomations";
import { EmptyState } from "@/components/EmptyState";
import { SEO } from "@/components/SEO";
import { AutomationConditionsBuilder } from "@/components/automations/AutomationConditionsBuilder";
import { AutomationActionsBuilder } from "@/components/automations/AutomationActionsBuilder";
import { AutomationTemplatesGallery } from "@/components/automations/AutomationTemplatesGallery";
import { AutomationRunsList } from "@/components/automations/AutomationRunsList";
import { getAutomationIcon } from "@/components/automations/icon-map";
import { toast } from "sonner";

type Editing = Partial<AutomationRule> & {
  name: string;
  trigger_event: string;
  actions: AutomationRule["actions"];
  conditions: AutomationRule["conditions"];
};

function blankRule(): Editing {
  return {
    name: "",
    description: "",
    trigger_event: "task.created",
    conditions: [],
    actions: [{ kind: "notify", params: {} }],
    active: true,
    icon: "Zap",
    color: "#0EA5E9",
    is_template: false,
    template_category: null,
  };
}

export default function AutomationRulesPage() {
  const { data: rules = [], isLoading } = useAutomationRules();
  const save = useSaveRule();
  const toggle = useToggleRule();
  const del = useDeleteRule();
  const process = useProcessAutomations();
  const test = useTestAutomation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);

  // Excluir templates da lista da esquerda — eles vivem na galeria.
  const userRules = useMemo(() => rules.filter((r) => !r.is_template), [rules]);

  // Sincroniza painel direito quando muda seleção.
  useEffect(() => {
    if (!selectedId) {
      setEditing(null);
      return;
    }
    const found = userRules.find((r) => r.id === selectedId);
    if (found) {
      setEditing({
        ...found,
        conditions: found.conditions ?? [],
        actions: found.actions ?? [],
      });
    }
  }, [selectedId, userRules]);

  const startNew = () => {
    setSelectedId(null);
    setEditing(blankRule());
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("Dê um nome para a regra");
      return;
    }
    const id = await save.mutateAsync({
      ...editing,
      id: selectedId ?? undefined,
    });
    if (id && !selectedId) setSelectedId(id);
  };

  const handleTest = async () => {
    if (!editing) return;
    const samplePayload: Record<string, unknown> = {
      task_id: "00000000-0000-0000-0000-000000000000",
      title: "Tarefa de exemplo",
      priority: "urgent",
      assignee_id: null,
      project_id: "demo-project",
    };
    const result = await test.mutateAsync({ rule: editing, payload: samplePayload });
    if (result.matched) {
      toast.success(`Bate! ${result.actions_simulated} ação(ões) seriam executadas`);
    } else {
      toast.warning("As condições não bateriam com este evento de exemplo");
    }
  };

  return (
    <div className="space-y-4">
      <SEO
        title="Automações — Builder visual"
        description="Crie regras 'quando X, faça Y' arrastando blocos visuais."
      />

      <PageHeader
        icon={Workflow}
        title="Automações"
        description="Builder visual estilo Zapier. Quando algo acontecer, dispare ações automaticamente."
        breadcrumbs={[
          { label: "Automações", to: "/app/automacoes" },
          { label: "Regras" },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => process.mutate()}
              disabled={process.isPending}
            >
              <Play className="h-4 w-4 mr-1" /> Processar fila agora
            </Button>
            <Button size="sm" onClick={startNew}>
              <Plus className="h-4 w-4 mr-1" /> Nova regra
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* PAINEL ESQUERDO — lista + templates */}
        <aside className="space-y-3">
          <Tabs defaultValue="ativas">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="ativas" className="text-xs">
                Minhas regras
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-xs">
                Templates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ativas" className="mt-2">
              {isLoading ? (
                <p className="text-xs text-muted-foreground">Carregando…</p>
              ) : userRules.length === 0 ? (
                <EmptyState
                  icon={Zap}
                  title="Nenhuma regra ainda"
                  description="Comece com um template ou crie do zero."
                  action={{ label: "Criar primeira regra", onClick: startNew }}
                />
              ) : (
                <ScrollArea className="h-[calc(100vh-260px)] pr-2">
                  <div className="space-y-2">
                    {userRules.map((r) => {
                      const Icon = getAutomationIcon(r.icon);
                      const selected = r.id === selectedId;
                      return (
                        <Card
                          key={r.id}
                          className={`cursor-pointer border transition ${
                            selected ? "border-primary ring-1 ring-primary" : "hover:border-muted-foreground/30"
                          }`}
                          onClick={() => setSelectedId(r.id)}
                        >
                          <CardContent className="flex items-start gap-3 p-3">
                            <div
                              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                              style={{
                                backgroundColor: `${r.color ?? "#0EA5E9"}20`,
                                color: r.color ?? "#0EA5E9",
                              }}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{r.name}</span>
                                <Switch
                                  className="ml-auto"
                                  checked={r.active}
                                  onClick={(e) => e.stopPropagation()}
                                  onCheckedChange={(active) =>
                                    toggle.mutate({ id: r.id, active })
                                  }
                                />
                              </div>
                              {r.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                                  {r.description}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Executou {r.run_count}×
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="templates" className="mt-2">
              <ScrollArea className="h-[calc(100vh-260px)] pr-2">
                <AutomationTemplatesGallery
                  onApplied={(id) => {
                    if (id) setSelectedId(id);
                  }}
                />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>

        {/* PAINEL DIREITO — builder */}
        <section className="min-w-0">
          {!editing ? (
            <Card className="h-full">
              <CardContent className="flex h-[60vh] items-center justify-center">
                <EmptyState
                  icon={Workflow}
                  title="Selecione uma regra ou crie uma nova"
                  description="O builder visual aparece aqui à direita."
                  action={{ label: "Nova regra", onClick: startNew }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="space-y-4 p-4">
                {/* Cabeçalho da regra */}
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                  <div className="space-y-2">
                    <Input
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      placeholder="Nome da regra"
                      className="text-base font-semibold"
                    />
                    <Textarea
                      value={editing.description ?? ""}
                      onChange={(e) =>
                        setEditing({ ...editing, description: e.target.value })
                      }
                      placeholder="Descrição curta (opcional)"
                      className="min-h-[50px] text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editing.active ?? true}
                      onCheckedChange={(active) => setEditing({ ...editing, active })}
                    />
                    <span className="text-xs text-muted-foreground">
                      {editing.active ? "Ativa" : "Pausada"}
                    </span>
                  </div>
                </div>

                <Tabs defaultValue="builder">
                  <TabsList>
                    <TabsTrigger value="builder" className="text-xs">
                      Builder
                    </TabsTrigger>
                    <TabsTrigger
                      value="runs"
                      className="text-xs"
                      disabled={!selectedId}
                    >
                      Execuções
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="builder" className="space-y-4 mt-3">
                    {/* PASSO 1 — TRIGGER */}
                    <section className="rounded-md border p-3 space-y-2 bg-muted/20">
                      <header className="flex items-center gap-2 text-xs font-semibold">
                        <Badge variant="outline" className="text-[10px]">
                          1
                        </Badge>
                        Quando…
                      </header>
                      <Select
                        value={editing.trigger_event}
                        onValueChange={(v) =>
                          setEditing({ ...editing, trigger_event: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIGGER_EVENTS.map((t) => {
                            const Icon = getAutomationIcon(t.icon);
                            return (
                              <SelectItem key={t.value} value={t.value}>
                                <span className="inline-flex items-center gap-2">
                                  <Icon className="h-3.5 w-3.5" />
                                  {t.label}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </section>

                    {/* PASSO 2 — CONDITIONS */}
                    <section className="rounded-md border p-3 space-y-2">
                      <header className="flex items-center gap-2 text-xs font-semibold">
                        <Badge variant="outline" className="text-[10px]">
                          2
                        </Badge>
                        Se… <span className="text-muted-foreground font-normal">(opcional)</span>
                      </header>
                      <AutomationConditionsBuilder
                        value={editing.conditions}
                        onChange={(conditions) =>
                          setEditing({ ...editing, conditions })
                        }
                      />
                    </section>

                    {/* PASSO 3 — ACTIONS */}
                    <section className="rounded-md border p-3 space-y-2">
                      <header className="flex items-center gap-2 text-xs font-semibold">
                        <Badge variant="outline" className="text-[10px]">
                          3
                        </Badge>
                        Então faça…
                      </header>
                      <AutomationActionsBuilder
                        value={editing.actions}
                        onChange={(actions) => setEditing({ ...editing, actions })}
                      />
                    </section>

                    {/* AÇÕES */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTest}
                        disabled={test.isPending}
                      >
                        <FlaskConical className="h-4 w-4 mr-1" /> Testar
                      </Button>
                      {selectedId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await del.mutateAsync(selectedId);
                            setSelectedId(null);
                            setEditing(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Excluir
                        </Button>
                      )}
                      <Button size="sm" onClick={handleSave} disabled={save.isPending}>
                        Salvar
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="runs" className="mt-3">
                    <AutomationRunsList ruleId={selectedId} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
