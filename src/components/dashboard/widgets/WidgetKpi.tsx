import { useMemo } from "react";
import { Loader2, Target, CheckCircle2, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { useDashboardData, type DateRange } from "@/hooks/useDashboard";
import { buildKPIs } from "@/components/dashboard/dashboard-utils";
import type { LucideIcon } from "lucide-react";

interface Config {
  metric?: "total" | "done" | "overdue" | "spent_hours" | "cycle_avg";
  range?: DateRange;
}

const META: Record<NonNullable<Config["metric"]>, { label: string; icon: LucideIcon; accent: string }> = {
  total: { label: "Total de tarefas", icon: Target, accent: "text-primary bg-primary/10" },
  done: { label: "Concluídas", icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10" },
  overdue: { label: "Atrasadas", icon: AlertTriangle, accent: "text-red-500 bg-red-500/10" },
  spent_hours: { label: "Tempo gasto (h)", icon: Clock, accent: "text-amber-500 bg-amber-500/10" },
  cycle_avg: { label: "Ciclo médio (h)", icon: TrendingUp, accent: "text-primary bg-primary/10" },
};

export function WidgetKpi({ config }: { config: Config }) {
  const range = config.range ?? "30d";
  const metric = config.metric ?? "total";
  const { data, isLoading } = useDashboardData(range);
  const tasks = useMemo(() => data?.tasks ?? [], [data]);
  const kpis = useMemo(() => buildKPIs(tasks), [tasks]);

  const value =
    metric === "total"
      ? kpis.total
      : metric === "done"
        ? kpis.done
        : metric === "overdue"
          ? kpis.overdue
          : metric === "spent_hours"
            ? Math.round(kpis.totalSpentMin / 60)
            : Number(kpis.avgCycleHours.toFixed(1));

  const meta = META[metric];
  const Icon = meta.icon;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{meta.label}</p>
        <p className="text-3xl font-semibold mt-2">{value}</p>
        {metric === "done" && (
          <p className="text-xs text-muted-foreground mt-1">{kpis.completionRate}% conclusão</p>
        )}
      </div>
      <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${meta.accent}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}
