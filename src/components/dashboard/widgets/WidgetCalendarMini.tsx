import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDashboardData } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";

export function WidgetCalendarMini() {
  const { data } = useDashboardData("30d");
  const today = new Date();
  const monthStart = startOfMonth(today);
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(monthStart, { locale: ptBR }),
        end: endOfWeek(endOfMonth(monthStart), { locale: ptBR }),
      }),
    [monthStart],
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<string, number>();
    (data?.tasks ?? []).forEach((t) => {
      if (!t.due_at) return;
      const k = format(parseISO(t.due_at), "yyyy-MM-dd");
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return map;
  }, [data]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium capitalize">
        {format(today, "MMMM yyyy", { locale: ptBR })}
      </p>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const k = format(d, "yyyy-MM-dd");
          const count = tasksByDay.get(k) ?? 0;
          return (
            <div
              key={k}
              className={cn(
                "aspect-square rounded text-[10px] flex flex-col items-center justify-center border",
                !isSameMonth(d, monthStart) && "opacity-30",
                isSameDay(d, today) && "border-primary bg-primary/10",
                count > 0 && "bg-amber-500/20",
              )}
            >
              <span>{format(d, "d")}</span>
              {count > 0 && <span className="text-[8px] text-primary">{count}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
