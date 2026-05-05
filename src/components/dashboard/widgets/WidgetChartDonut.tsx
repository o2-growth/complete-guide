import { lazy, Suspense, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useDashboardData, type DateRange } from "@/hooks/useDashboard";
import {
  buildPriorityBreakdown,
  buildStatusBreakdown,
  buildTypeBreakdown,
} from "@/components/dashboard/dashboard-utils";

const BreakdownPieChart = lazy(() => import("@/components/dashboard/BreakdownPieChart"));

interface Config {
  range?: DateRange;
  dimension?: "status" | "type" | "priority";
}

export function WidgetChartDonut({ config }: { config: Config }) {
  const range = config.range ?? "30d";
  const dimension = config.dimension ?? "status";
  const { data, isLoading } = useDashboardData(range);

  const pieData = useMemo(() => {
    if (!data) return [];
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

  return (
    <div className="h-full min-h-[180px]">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando gráfico…
          </div>
        }
      >
        <BreakdownPieChart data={pieData} />
      </Suspense>
    </div>
  );
}
