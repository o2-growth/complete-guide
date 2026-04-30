import { AlertTriangle, Sparkles, Check, X, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAnomalies, useDetectAnomalies, useUpdateAnomalyStatus, type Anomaly } from "@/hooks/useWarehouse";
import { cn } from "@/lib/utils";

const SEV_COLORS: Record<Anomaly["severity"], string> = {
  info: "bg-sky-500/10 text-sky-700 border-sky-200 dark:text-sky-300",
  warning: "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-300",
  critical: "bg-red-500/10 text-red-700 border-red-200 dark:text-red-300",
};

const METRIC_LABEL: Record<string, string> = {
  done_count: "Tarefas concluídas",
  overdue_count: "Tarefas atrasadas",
  engagement: "Engajamento social",
  reach: "Alcance",
};

export default function AnomaliesPage() {
  const { data: list = [] } = useAnomalies();
  const detect = useDetectAnomalies();
  const setStatus = useUpdateAnomalyStatus();

  const open = list.filter((a) => a.status === "open");
  const ack = list.filter((a) => a.status === "ack");
  const dismissed = list.filter((a) => a.status === "dismissed");

  const renderCard = (a: Anomaly) => {
    const isDown = a.delta_pct < 0;
    return (
      <Card key={a.id} className={cn("p-4 border-l-4", SEV_COLORS[a.severity])}>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background">
            {isDown ? <TrendingDown className="h-4 w-4 text-red-500" /> : <TrendingUp className="h-4 w-4 text-emerald-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{METRIC_LABEL[a.metric] ?? a.metric}</h3>
              <Badge variant="outline" className="text-[10px] uppercase">{a.severity}</Badge>
              <Badge variant="outline" className="text-[10px]">{a.source}</Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {format(new Date(a.detected_at), "dd/MM HH:mm", { locale: ptBR })}
              </span>
            </div>
            <p className="text-sm mt-1">
              Esperado <strong>{a.expected}</strong> · Observado <strong>{a.observed}</strong>{" "}
              <Badge variant={isDown ? "destructive" : "default"} className="ml-1">{a.delta_pct > 0 ? "+" : ""}{a.delta_pct}%</Badge>
            </p>
            {a.explanation && (
              <div className="mt-2 rounded-md bg-primary/5 p-2.5 text-sm flex gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{a.explanation}</span>
              </div>
            )}
            {a.suggested_action && !a.explanation && (
              <p className="text-sm text-muted-foreground mt-1">💡 {a.suggested_action}</p>
            )}
            {a.status === "open" && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: a.id, status: "ack" })}>
                  <Check className="mr-1.5 h-3.5 w-3.5" />Reconhecer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: a.id, status: "dismissed" })}>
                  <X className="mr-1.5 h-3.5 w-3.5" />Dispensar
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4 p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Anomalias detectadas</h1>
          <p className="text-sm text-muted-foreground">
            Detecção automática comparando últimos 7 dias com a média dos 30 dias anteriores. IA explica e sugere ação.
          </p>
        </div>
        <Button onClick={() => detect.mutate()} disabled={detect.isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${detect.isPending ? "animate-spin" : ""}`} />
          Rodar detecção
        </Button>
      </header>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Abertas ({open.length})</TabsTrigger>
          <TabsTrigger value="ack">Reconhecidas ({ack.length})</TabsTrigger>
          <TabsTrigger value="dismissed">Dispensadas ({dismissed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="space-y-3 mt-4">
          {open.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">Nenhuma anomalia aberta. Tudo nos conformes 🎉</Card>
          ) : open.map(renderCard)}
        </TabsContent>
        <TabsContent value="ack" className="space-y-3 mt-4">
          {ack.length === 0 ? <Card className="p-8 text-center text-muted-foreground">Nada reconhecido ainda.</Card> : ack.map(renderCard)}
        </TabsContent>
        <TabsContent value="dismissed" className="space-y-3 mt-4">
          {dismissed.length === 0 ? <Card className="p-8 text-center text-muted-foreground">Nada dispensado.</Card> : dismissed.map(renderCard)}
        </TabsContent>
      </Tabs>
    </div>
  );
}