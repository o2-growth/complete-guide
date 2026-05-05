import { useMemo } from "react";
import { Clock, Loader2 } from "lucide-react";
import { startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";
import { useDashboardData } from "@/hooks/useDashboard";

export function WidgetTimesheetSnippet() {
  const { data, isLoading } = useDashboardData("30d");

  const weekTotals = useMemo(() => {
    const now = new Date();
    const ws = startOfWeek(now, { weekStartsOn: 1 });
    const we = endOfWeek(now, { weekStartsOn: 1 });
    const entries = data?.timeEntries ?? [];
    let week = 0;
    let today = 0;
    const todayKey = now.toDateString();
    entries.forEach((e) => {
      if (!e.started_at) return;
      const dt = parseISO(e.started_at);
      const mins = (e as { minutes?: number | null }).minutes ?? 0;
      if (isWithinInterval(dt, { start: ws, end: we })) week += mins;
      if (dt.toDateString() === todayKey) today += mins;
    });
    return { week, today };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center gap-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Esta semana</p>
          <p className="text-2xl font-semibold">{(weekTotals.week / 60).toFixed(1)}h</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Hoje: <span className="font-medium">{(weekTotals.today / 60).toFixed(1)}h</span>
      </p>
    </div>
  );
}
