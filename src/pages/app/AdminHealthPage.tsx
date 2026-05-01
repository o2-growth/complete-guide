import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Workflow, Webhook, Send, Bug } from "lucide-react";
import { useHealthSnapshot, usePerfMetrics } from "@/hooks/useAdminObservability";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";

function KPI({ icon: Icon, label, value, tone = "default" }: { icon: typeof Activity; label: string; value: number | string; tone?: "default" | "warn" | "danger" | "ok" }) {
  const toneClass = tone === "warn" ? "text-warning" : tone === "danger" ? "text-destructive" : tone === "ok" ? "text-success" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${toneClass}`} aria-hidden />
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminHealthPage() {
  const { data: h, isLoading } = useHealthSnapshot();
  const { data: lcp = [] } = usePerfMetrics("LCP");
  const { data: cls = [] } = usePerfMetrics("CLS");

  const avg = (arr: { value: number }[]) => arr.length ? arr.reduce((a, b) => a + b.value, 0) / arr.length : 0;
  const lcpAvg = avg(lcp);
  const clsAvg = avg(cls);

  return (
    <div className="space-y-6 p-6">
      <SEO title="Admin · Saúde do sistema" description="Healthcheck de filas, jobs e métricas Web Vitals" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" /> Saúde do sistema
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Carregando…" : `Atualizado ${h ? new Date(h.snapshot_at).toLocaleTimeString("pt-BR") : ""}`}
        </p>
      </div>

      <section aria-label="Filas e jobs">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">Filas & Jobs</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KPI icon={Webhook} label="Webhooks pending" value={h?.webhook_pending ?? 0} tone={(h?.webhook_pending ?? 0) > 50 ? "warn" : "default"} />
          <KPI icon={AlertTriangle} label="Webhooks failed 24h" value={h?.webhook_failed_24h ?? 0} tone={(h?.webhook_failed_24h ?? 0) > 0 ? "danger" : "ok"} />
          <KPI icon={Workflow} label="Automações pendentes" value={h?.automation_events_pending ?? 0} />
          <KPI icon={Send} label="Posts agendados" value={h?.scheduled_publishes_pending ?? 0} />
          <KPI icon={Bug} label="Erros 24h" value={h?.errors_24h ?? 0} tone={(h?.errors_24h ?? 0) > 10 ? "warn" : "default"} />
          <KPI icon={Bug} label="Erros 1h" value={h?.errors_1h ?? 0} tone={(h?.errors_1h ?? 0) > 5 ? "danger" : "ok"} />
        </div>
      </section>

      <section aria-label="Web Vitals">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">Web Vitals (média da janela)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">LCP médio</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(lcpAvg / 1000).toFixed(2)}s</div>
              <Badge variant={lcpAvg < 2500 ? "secondary" : "destructive"} className="mt-1 text-[10px]">
                {lcpAvg < 2500 ? "good" : lcpAvg < 4000 ? "needs-improvement" : "poor"}
              </Badge>
              <p className="text-[11px] text-muted-foreground mt-2">{lcp.length} amostras</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">CLS médio</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clsAvg.toFixed(3)}</div>
              <Badge variant={clsAvg < 0.1 ? "secondary" : "destructive"} className="mt-1 text-[10px]">
                {clsAvg < 0.1 ? "good" : clsAvg < 0.25 ? "needs-improvement" : "poor"}
              </Badge>
              <p className="text-[11px] text-muted-foreground mt-2">{cls.length} amostras</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
