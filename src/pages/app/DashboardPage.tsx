import { lazy, Suspense, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDashboardData, type DateRange } from "@/hooks/useDashboard";
import {
  buildKPIs, buildTimeline, buildStatusBreakdown,
  buildTypeBreakdown, buildPriorityBreakdown, buildAssigneeWorkload,
} from "@/components/dashboard/dashboard-utils";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  exportTasksToExcel, exportTasksToPDF,
} from "@/lib/exports/dashboard-exports";
import {
  BarChart3, CheckCircle2, Clock, AlertTriangle, Download, FileSpreadsheet,
  FileText, Loader2, Target,
} from "lucide-react";
import { toast } from "sonner";

// Charts em lazy: recharts só baixa quando o dashboard renderiza, separado em chunk próprio.
const TimelineChart = lazy(() => import("@/components/dashboard/TimelineChart"));
const BreakdownPieChart = lazy(() => import("@/components/dashboard/BreakdownPieChart"));
const AssigneeBarChart = lazy(() => import("@/components/dashboard/AssigneeBarChart"));

const RANGE_LABEL: Record<DateRange, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
};

// Fallback comum para os Suspense dos charts.
function ChartFallback() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando gráfico…
    </div>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState<DateRange>("30d");
  const { data, isLoading } = useDashboardData(range);

  // useMemo estabiliza arrays vazios para que dependências dos memos abaixo
  // não mudem identidade a cada render quando data ainda é undefined.
  const tasks = useMemo(() => data?.tasks ?? [], [data]);
  const statuses = useMemo(() => data?.statuses ?? [], [data]);
  const types = useMemo(() => data?.types ?? [], [data]);
  const projects = useMemo(() => data?.projects ?? [], [data]);
  const profiles = useMemo(() => data?.profiles ?? [], [data]);

  const kpis = useMemo(() => buildKPIs(tasks), [tasks]);
  const timeline = useMemo(
    () => (data ? buildTimeline(tasks, data.since) : []),
    [tasks, data],
  );
  const statusData = useMemo(() => buildStatusBreakdown(tasks, statuses), [tasks, statuses]);
  const typeData = useMemo(() => buildTypeBreakdown(tasks, types), [tasks, types]);
  const priorityData = useMemo(() => buildPriorityBreakdown(tasks), [tasks]);
  const assigneeData = useMemo(() => buildAssigneeWorkload(tasks, profiles), [tasks, profiles]);

  const handleExportExcel = () => {
    if (!tasks.length) {
      toast.info("Sem tarefas no período");
      return;
    }
    exportTasksToExcel(tasks, { statuses, types, projects, profiles });
    toast.success("Excel exportado");
  };

  const handleExportPDF = () => {
    if (!tasks.length) {
      toast.info("Sem tarefas no período");
      return;
    }
    exportTasksToPDF(tasks, { statuses, types, projects, profiles }, {
      rangeLabel: RANGE_LABEL[range],
    });
    toast.success("PDF exportado");
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral de produtividade, fluxo e alocação por período.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando dashboard…
        </div>
      )}

      {!isLoading && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <KPICard label="Total" value={kpis.total} icon={Target} accent="primary" />
            <KPICard label="Concluídas" value={kpis.done} hint={`${kpis.completionRate}% conclusão`} icon={CheckCircle2} accent="success" />
            <KPICard label="Atrasadas" value={kpis.overdue} icon={AlertTriangle} accent="danger" />
            <KPICard label="Tempo gasto" value={`${Math.round(kpis.totalSpentMin / 60)}h`} icon={Clock} accent="warning" />
            <KPICard label="Ciclo médio" value={`${kpis.avgCycleHours.toFixed(1)}h`} hint="Criação → conclusão" icon={Download} accent="primary" />
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Criadas vs concluídas</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <Suspense fallback={<ChartFallback />}>
                <TimelineChart data={timeline} />
              </Suspense>
            </CardContent>
          </Card>

          {/* Pies grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Por status</CardTitle></CardHeader>
              <CardContent className="h-64">
                <Suspense fallback={<ChartFallback />}>
                  <BreakdownPieChart data={statusData} />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Por tipo</CardTitle></CardHeader>
              <CardContent className="h-64">
                <Suspense fallback={<ChartFallback />}>
                  <BreakdownPieChart data={typeData} />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Por prioridade</CardTitle></CardHeader>
              <CardContent className="h-64">
                <Suspense fallback={<ChartFallback />}>
                  <BreakdownPieChart data={priorityData} />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          {/* Assignee bar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Carga por responsável (top 8)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <Suspense fallback={<ChartFallback />}>
                <AssigneeBarChart data={assigneeData} />
              </Suspense>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
