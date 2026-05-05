import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { addDays, startOfWeek } from "date-fns";
import { WorkloadHeatmap } from "@/components/workload/WorkloadHeatmap";
import { useTenantMembers, useWorkloadTasks } from "@/hooks/useWorkload";

export function WidgetWorkloadHeatmap() {
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const { data: members, isLoading: l1 } = useTenantMembers();
  const { data: tasks, isLoading: l2 } = useWorkloadTasks(weekStart, weekEnd);

  if (l1 || l2) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <WorkloadHeatmap days={days} members={members ?? []} tasks={tasks ?? []} />
    </div>
  );
}
