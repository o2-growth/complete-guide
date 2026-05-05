import { lazy, Suspense, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useDashboardData, type DateRange } from "@/hooks/useDashboard";
import {
  buildAssigneeWorkload,
  buildPriorityBreakdown,
  buildStatusBreakdown,
  buildTypeBreakdown,
} from "@/components/dashboard/dashboard-utils";

const AssigneeBarChart = lazy(() => import("@/components/dashboard/AssigneeBarChart"));
const BreakdownPieChart = lazy(() => import("@/components/dashboard/BreakdownPieChart"));

interface Config {
  range?: DateRange;
  // dimensão dos dados: por responsável, status, tipo, prioridade
  dimension?: "assignee" | "status" | "type" | "priority";
}

export function WidgetChartBar({ config }: { config: Config }) {
  const range = config.range ?? "30d";
  const dimension = config.dimension ?? "assignee";
  const { data, isLoading } = useDashboardData(range);

  const assigneeData = useMemo(
    () => (data && dimension === "assignee" ? buildAssigneeWorkload(data.tasks, data.profiles) : []),
    [data, dimension],
  );
  const breakdownData = useMemo(() => {
    if (!data || dimension === "assignee") return [];
    if (dimension === "status") return buildStatusBreakdown(data.tasks, data.statuses);
    if (dimension === "type") return buildTypeBreakdown(data.tasks, data.types);
    return buildPriorityBreakdown(data.tasks);
  }, [data, dimension]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  // Para dimensões não-assignee usamos o pie chart como visualização secundária
  // até existir um BarChart genérico — evita inflar a fase com nova lib.
  return (
    <div className="h-full min-h-[180px]">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando gráfico…
          </div>
        }
      >
        {dimension === "assignee" ? (
          <AssigneeBarChart data={assigneeData} />
        ) : (
          <BreakdownPieChart data={breakdownData} />
        )}
      </Suspense>
    </div>
  );
}
