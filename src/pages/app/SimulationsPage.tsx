import { useState } from "react";
import { useSimulations, SimKind } from "@/hooks/useSimulations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Save, Trash2, TrendingUp, Users, Calendar, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";

const KIND_META: Record<SimKind, { label: string; icon: any; desc: string }> = {
  boost_budget: { label: "Boost de budget", icon: TrendingUp, desc: "E se eu multiplicar o budget de mídia paga?" },
  team_capacity: { label: "Capacidade do time", icon: Users, desc: "E se eu contratar mais gente?" },
  cadence_change: { label: "Cadência de posts", icon: Calendar, desc: "E se eu publicar mais (ou menos) por semana?" },
};

function fmtCents(c: number) { return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function SimulationsPage() {
  const { scenarios, run, running, lastResult, remove } = useSimulations();
  const [kind, setKind] = useState<SimKind>("boost_budget");
  const [budgetMult, setBudgetMult] = useState("2");
  const [extraPeople, setExtraPeople] = useState("2");
  const [hours, setHours] = useState("30");
  const [postsDelta, setPostsDelta] = useState("3");
  const [name, setName] = useState("");

  const execute = async (save = false) => {
    const inputs = kind === "boost_budget" ? { budget_multiplier: Number(budgetMult) }
      : kind === "team_capacity" ? { extra_people: Number(extraPeople), hours_per_week: Number(hours) }
      : { posts_per_week_delta: Number(postsDelta) };
    await run(kind, inputs, { save, name: name || undefined });
  };

  const r = lastResult?.result;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FlaskConical className="h-6 w-6" />Simulações What-if</h1>
        <p className="text-sm text-muted-foreground">Teste cenários antes de executar. A IA explica o impacto e recomenda ação.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Configurar cenário</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={kind} onValueChange={(v) => setKind(v as SimKind)}>
              <TabsList className="grid grid-cols-3 w-full">
                {(Object.keys(KIND_META) as SimKind[]).map(k => {
                  const M = KIND_META[k]; return <TabsTrigger key={k} value={k} className="text-xs"><M.icon className="h-3 w-3 mr-1" />{M.label}</TabsTrigger>;
                })}
              </TabsList>
              <p className="text-xs text-muted-foreground mt-2">{KIND_META[kind].desc}</p>

              <TabsContent value="boost_budget" className="space-y-3 mt-4">
                <div><Label>Multiplicador de budget</Label>
                  <Input type="number" step="0.5" value={budgetMult} onChange={e => setBudgetMult(e.target.value)} />
                  <p className="text-[10px] text-muted-foreground mt-1">Ex: 2 = dobrar, 0.5 = cortar pela metade</p>
                </div>
              </TabsContent>
              <TabsContent value="team_capacity" className="space-y-3 mt-4">
                <div><Label>Pessoas extras</Label><Input type="number" value={extraPeople} onChange={e => setExtraPeople(e.target.value)} /></div>
                <div><Label>Horas/semana por pessoa</Label><Input type="number" value={hours} onChange={e => setHours(e.target.value)} /></div>
              </TabsContent>
              <TabsContent value="cadence_change" className="space-y-3 mt-4">
                <div><Label>Posts extras por semana (use negativo para cortar)</Label>
                  <Input type="number" value={postsDelta} onChange={e => setPostsDelta(e.target.value)} />
                </div>
              </TabsContent>
            </Tabs>

            <div><Label>Nome (opcional, ao salvar)</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Cenário Black Friday" />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => execute(false)} disabled={running} className="flex-1"><Sparkles className="h-4 w-4 mr-1" />{running ? "Calculando…" : "Simular"}</Button>
              <Button onClick={() => execute(true)} disabled={running} variant="outline"><Save className="h-4 w-4 mr-1" />Salvar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Resultado</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!r && <p className="text-sm text-muted-foreground">Configure e clique em Simular.</p>}
            {r?.kind === "boost_budget" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Atual</p><p className="text-lg font-bold">{fmtCents(r.current.spent_cents)}</p><p className="text-xs">Receita: {fmtCents(r.current.revenue_cents)}</p><Badge variant="outline" className="mt-1">ROAS {r.current.roas}x</Badge></div>
                  <div className="rounded border p-3 bg-primary/5"><p className="text-xs text-muted-foreground">Projetado</p><p className="text-lg font-bold">{fmtCents(r.projected.spent_cents)}</p><p className="text-xs">Receita: {fmtCents(r.projected.revenue_cents)}</p><Badge className="mt-1">ROAS {r.projected.roas}x</Badge></div>
                </div>
                <p className="text-sm">Δ Receita: <strong className={r.delta_revenue_cents >= 0 ? "text-emerald-600" : "text-red-600"}>{fmtCents(r.delta_revenue_cents)}</strong></p>
              </div>
            )}
            {r?.kind === "team_capacity" && (
              <div className="space-y-2">
                <p className="text-sm">Tarefa média: <strong>{r.avg_task_minutes} min</strong></p>
                <div className="rounded border p-3 bg-primary/5"><p className="text-xs">Capacidade extra estimada</p><p className="text-2xl font-bold">+{r.extra_tasks_per_week}/sem</p><p className="text-xs text-muted-foreground">≈ {r.extra_tasks_per_month} tarefas/mês</p></div>
              </div>
            )}
            {r?.kind === "cadence_change" && (
              <div className="space-y-2">
                <p className="text-sm">Engajamento médio/post: <strong>{r.avg_engagement_per_post}</strong></p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded border p-3"><p className="text-xs">Atual 30d</p><p className="text-lg font-bold">{r.current_engagement_30d}</p></div>
                  <div className="rounded border p-3 bg-primary/5"><p className="text-xs">Projetado 30d</p><p className="text-lg font-bold">{r.projected_engagement_30d}</p></div>
                </div>
                <p className="text-sm">Δ: <strong className={r.delta >= 0 ? "text-emerald-600" : "text-red-600"}>{r.delta > 0 ? "+" : ""}{r.delta}</strong></p>
              </div>
            )}
            {r?.assumptions && <p className="text-[10px] text-muted-foreground italic">Premissa: {r.assumptions}</p>}
            {lastResult?.narrative && (
              <div className="rounded-lg border bg-primary/5 p-3 mt-3">
                <Badge variant="outline" className="mb-2 text-[10px]"><Sparkles className="h-3 w-3 mr-1" />Análise IA</Badge>
                <p className="text-sm whitespace-pre-wrap">{lastResult.narrative}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Cenários salvos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {scenarios.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cenário salvo ainda.</p>}
          {scenarios.map(s => (
            <div key={s.id} className="flex items-start gap-3 rounded border p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2"><strong>{s.name}</strong><Badge variant="outline" className="text-[10px]">{s.kind}</Badge><span className="text-[10px] text-muted-foreground">{format(parseISO(s.created_at), "dd/MM HH:mm")}</span></div>
                {s.ai_narrative && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.ai_narrative}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}