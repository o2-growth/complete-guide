import { useEffect, useState } from "react";
import { TrendingUp, Sparkles, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForecast, type ForecastResponse } from "@/hooks/useForecast";
import { TASK_METRICS, POST_METRICS } from "@/hooks/useWarehouse";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

export default function ForecastPage() {
  const forecast = useForecast();
  const [source, setSource] = useState<"tasks" | "posts">("tasks");
  const [metric, setMetric] = useState<string>("done_count");
  const [data, setData] = useState<ForecastResponse | null>(null);

  const metrics = source === "tasks" ? TASK_METRICS : POST_METRICS;

  const run = async () => {
    const r = await forecast.mutateAsync({ source, metric, days_back: 60, days_ahead: 30 });
    setData(r);
  };
  useEffect(() => { run(); /* eslint-disable-next-line */ }, []);

  const chart = (data?.series ?? []).map((p) => ({
    d: p.d.slice(5),
    historico: p.kind === "history" ? Number(p.value) : null,
    previsao: p.kind === "forecast" ? Number(p.value) : null,
  }));
  const splitDate = data?.series.find((s) => s.kind === "forecast")?.d?.slice(5);

  return (
    <div className="space-y-4 p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Forecast IA</h1>
          <p className="text-sm text-muted-foreground">
            Previsão de métricas para os próximos 30 dias com regressão linear + narrativa IA.
          </p>
        </div>
      </header>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-xs">Fonte</Label>
            <Select value={source} onValueChange={(v) => { setSource(v as "tasks" | "posts"); setMetric(v === "tasks" ? "done_count" : "reach"); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tasks">Tarefas</SelectItem>
                <SelectItem value="posts">Posts sociais</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Métrica</Label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {metrics.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 flex justify-end">
            <Button onClick={run} disabled={forecast.isPending}>
              <Play className="mr-2 h-4 w-4" />Gerar previsão
            </Button>
          </div>
        </div>

        {data && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Média histórica (60d)</div>
                <div className="text-2xl font-bold">{data.avgHist.toFixed(1)}</div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Média prevista (30d)</div>
                <div className="text-2xl font-bold">{data.avgFore.toFixed(1)}</div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Tendência</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {data.trendPct > 0 ? "+" : ""}{data.trendPct}%
                  <Badge variant={data.trendPct >= 0 ? "default" : "destructive"}>
                    {data.trendPct >= 0 ? "alta" : "queda"}
                  </Badge>
                </div>
              </Card>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <XAxis dataKey="d" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  {splitDate && <ReferenceLine x={splitDate} stroke="hsl(var(--border))" strokeDasharray="4 4" label="hoje" />}
                  <Line type="monotone" dataKey="historico" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="previsao" stroke="hsl(var(--accent-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {data.narrative && (
              <Card className="p-3 bg-primary/5 border-primary/20">
                <div className="flex gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{data.narrative}</p>
                </div>
              </Card>
            )}
          </>
        )}
      </Card>
    </div>
  );
}