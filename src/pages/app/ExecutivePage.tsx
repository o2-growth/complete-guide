import { useEffect } from "react";
import { Crown, Sparkles, RefreshCw, TrendingUp, TrendingDown, AlertOctagon, Target, CheckCircle2, DollarSign, Activity, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useExecKpis, useExecBriefing } from "@/hooks/useExecBriefing";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

function formatCents(c: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100);
}

export default function ExecutivePage() {
  const { data: kpis, isLoading } = useExecKpis();
  const briefing = useExecBriefing();

  useEffect(() => {
    if (kpis && !briefing.data && !briefing.isPending) briefing.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpis]);

  const positive = (kpis?.done_delta_pct ?? 0) >= 0;

  const cards = kpis ? [
    {
      label: "Tarefas concluídas (7d)",
      value: kpis.done_7d,
      hint: `${positive ? "+" : ""}${kpis.done_delta_pct}% vs 7d anteriores`,
      icon: CheckCircle2,
      tone: positive ? "text-emerald-600" : "text-red-600",
      link: "/app/dashboard",
    },
    {
      label: "Atrasadas (ontem)",
      value: kpis.overdue,
      hint: kpis.overdue > 0 ? "Atenção a SLAs" : "Em dia",
      icon: Clock,
      tone: kpis.overdue > 0 ? "text-amber-600" : "text-emerald-600",
      link: "/app/atrasadas",
    },
    {
      label: "Anomalias abertas",
      value: kpis.anomalies_open,
      hint: kpis.anomalies_open > 0 ? "Investigar" : "Estável",
      icon: AlertOctagon,
      tone: kpis.anomalies_open > 0 ? "text-red-600" : "text-emerald-600",
      link: "/app/anomalias",
    },
    {
      label: "Goals em risco",
      value: kpis.goals_at_risk,
      hint: kpis.goals_at_risk > 0 ? "Reforçar plano" : "No alvo",
      icon: Target,
      tone: kpis.goals_at_risk > 0 ? "text-amber-600" : "text-emerald-600",
      link: "/app/okrs",
    },
    {
      label: "ROAS acumulado",
      value: kpis.roas.toFixed(2) + "x",
      hint: `${formatCents(kpis.revenue_cents)} receita`,
      icon: DollarSign,
      tone: kpis.roas >= 2 ? "text-emerald-600" : "text-amber-600",
      link: "/app/social/boosts",
    },
    {
      label: "Engajamento social (7d)",
      value: kpis.engagement_7d.toLocaleString("pt-BR"),
      hint: "Curtidas + coments + shares + saves",
      icon: Activity,
      tone: "text-sky-600",
      link: "/app/social/analytics",
    },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" /> Executive Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">A semana do seu negócio em uma página.</p>
        </div>
        <Button onClick={() => briefing.mutate()} disabled={briefing.isPending} variant="outline">
          <RefreshCw className={cn("h-4 w-4 mr-2", briefing.isPending && "animate-spin")} />
          Recalcular briefing
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="p-5 hover:border-primary/40 transition-colors">
                <Link to={c.link} className="block">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</span>
                    <Icon className={cn("h-4 w-4", c.tone)} />
                  </div>
                  <div className="text-3xl font-bold">{c.value}</div>
                  <div className={cn("text-xs mt-1", c.tone)}>{c.hint}</div>
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="p-6 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-500/5 to-transparent">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <Sparkles className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Briefing executivo da semana</h3>
              <Badge variant="outline" className="text-[10px]">Gemini Flash</Badge>
            </div>
            {briefing.isPending ? (
              <div className="space-y-2 mt-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-11/12" />
                <Skeleton className="h-3 w-9/12" />
              </div>
            ) : briefing.data ? (
              <p className="text-sm mt-2 leading-relaxed whitespace-pre-line">{briefing.data.narrative}</p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">Clique em "Recalcular briefing" para gerar.</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            {positive ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
            Tendência da operação
          </h3>
          <p className="text-sm text-muted-foreground">
            {kpis ? (
              <>Equipe entregou <strong className="text-foreground">{kpis.done_7d}</strong> tarefas nos últimos 7 dias
              ({positive ? "+" : ""}{kpis.done_delta_pct}% vs período anterior).</>
            ) : "—"}
          </p>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-600" />
            Saúde do funil social
          </h3>
          <p className="text-sm text-muted-foreground">
            {kpis ? (
              <><strong className="text-foreground">{kpis.engagement_7d.toLocaleString("pt-BR")}</strong> interações
              orgânicas e <strong className="text-foreground">{kpis.roas.toFixed(2)}x</strong> de ROAS pago acumulado.</>
            ) : "—"}
          </p>
        </Card>
      </div>
    </div>
  );
}