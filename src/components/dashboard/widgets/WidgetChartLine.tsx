import { lazy, Suspense, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useDashboardData, type DateRange } from "@/hooks/useDashboard";
import { buildTimeline } from "@/components/dashboard/dashboard-utils";

const TimelineChart = lazy(() => import("@/components/dashboard/TimelineChart"));

interface Config {
  range?: DateRange;
}

export function WidgetChartLine({ config }: { config: Config }) {
  const range = config.range ?? "30d";
  const { data, isLoading } = useDashboardData(range);
  const timeline = useMemo(
    () => (data ? buildTimeline(data.tasks, data.since) : []),
    [data],
  );

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
        <TimelineChart data={timeline} />
      </Suspense>
    </div>
  );
}
