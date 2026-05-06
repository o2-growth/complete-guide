import { Workflow, Play, RefreshCw, Database, Target, AlertOctagon, Bell, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRunCronJob } from "@/hooks/useExecBriefing";
import { cn } from "@/lib/utils";

const JOBS = [
  { id: "warehouse", label: "Refresh warehouse", icon: Database, schedule: "Diário 03:00", desc: "Reconstrói as tabelas analíticas dos últimos 90 dias" },
  { id: "anomalies", label: "Detectar anomalias", icon: AlertOctagon, schedule: "A cada hora", desc: "Compara últimos 7d vs baseline de 30d" },
  { id: "krs", label: "Atualizar OKRs", icon: Target, schedule: "Diário 04:00", desc: "Recalcula progresso dos KRs com dados do warehouse" },
  { id: "notifications", label: "Scan notificações", icon: Bell, schedule: "A cada 30 min", desc: "Cria alertas para anomalias críticas, KRs em risco e prazos" },
  { id: "reports", label: "Enviar relatórios", icon: Mail, schedule: "A cada 5 min", desc: "Processa fila de relatórios agendados por email" },
] as const;

export default function AutomationsPage() {
  const run = useRunCronJob();

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={Workflow}
        title="Automações"
        description="Jobs agendados que mantêm seu workspace sempre atualizado."
        actions={
          <Button onClick={() => run.mutate("all")} disabled={run.isPending}>
            <RefreshCw className={cn("h-4 w-4 mr-2", run.isPending && "animate-spin")} />
            Rodar tudo agora
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {JOBS.map((j) => {
          const Icon = j.icon;
          const isRunning = run.isPending && run.variables === j.id;
          return (
            <Card key={j.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{j.label}</h3>
                    <Badge variant="outline" className="text-[10px]">{j.schedule}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{j.desc}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => run.mutate(j.id as never)}
                    disabled={run.isPending}
                  >
                    <Play className={cn("h-3 w-3 mr-1", isRunning && "animate-pulse")} />
                    Executar agora
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5 bg-muted/30">
        <h3 className="font-semibold text-sm mb-2">Como funciona</h3>
        <p className="text-xs text-muted-foreground">
          Cada job é executado automaticamente no horário programado via cron e também pode ser disparado manualmente daqui.
          Os resultados aparecem nas páginas correspondentes (Anomalias, OKRs, Notificações, Reports).
        </p>
      </Card>
    </div>
  );
}