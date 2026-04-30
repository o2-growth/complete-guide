import { useBenchmarks } from "@/hooks/useBenchmarks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Sparkles, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS = {
  top: { label: "Top do mercado", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", icon: TrendingUp },
  good: { label: "Acima da média", cls: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30", icon: TrendingUp },
  avg: { label: "Na média", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30", icon: Minus },
  low: { label: "Abaixo do mercado", cls: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30", icon: TrendingDown },
};

export default function BenchmarksPage() {
  const { data, loading, refresh, scorecards, buildScorecard, building, METRIC_LABEL } = useBenchmarks();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Benchmarks setoriais</h1>
          <p className="text-sm text-muted-foreground">Compare seus números com percentis do mercado e gere scorecards mensais com IA.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}><RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />Atualizar</Button>
          <Button size="sm" onClick={buildScorecard} disabled={building}><Sparkles className="h-4 w-4 mr-1" />{building ? "Gerando…" : "Gerar scorecard do mês"}</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Comparação atual {data?.industry && <Badge variant="outline" className="ml-2 text-xs">setor: {data.industry}</Badge>}</CardTitle></CardHeader>
        <CardContent>
          {!data?.comparisons?.length && <p className="text-sm text-muted-foreground">Sem dados suficientes ainda.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data?.comparisons?.map((c, i) => {
              const S = STATUS[c.status]; const Icon = S.icon;
              return (
                <div key={i} className={cn("rounded-lg border p-3 space-y-2", S.cls)}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{METRIC_LABEL[c.metric] || c.metric}</span>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-bold">{c.tenant}<span className="text-xs ml-1 opacity-70">{c.unit}</span></div>
                  <div className="text-[10px] opacity-80 flex justify-between">
                    <span>p25: {c.p25}</span><span>p50: {c.p50}</span><span>p75: {c.p75}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{S.label}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Scorecards mensais</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {scorecards.length === 0 && <p className="text-sm text-muted-foreground">Nenhum scorecard gerado ainda.</p>}
          {scorecards.map(s => (
            <div key={s.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{format(parseISO(s.period_month), "MMMM 'de' yyyy", { locale: ptBR })}</h3>
                <Badge variant="outline" className="text-xs">Gerado {format(parseISO(s.created_at), "dd/MM HH:mm")}</Badge>
              </div>
              {s.ai_summary && <p className="text-sm whitespace-pre-wrap">{s.ai_summary}</p>}
              {Array.isArray(s.recommendations) && s.recommendations.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t">
                  <p className="text-xs font-semibold text-muted-foreground">Recomendações priorizadas</p>
                  {s.recommendations.map((r: any, i: number) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <Badge variant={r.priority === "high" ? "destructive" : r.priority === "medium" ? "default" : "secondary"} className="text-[10px] h-5">{r.priority}</Badge>
                      <div><strong>{r.title}</strong> — <span className="text-muted-foreground">{r.rationale}</span> {r.expected_impact && <em className="text-xs"> ({r.expected_impact})</em>}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}