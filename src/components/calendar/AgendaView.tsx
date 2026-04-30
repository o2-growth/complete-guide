import { useMemo } from "react";
import { startOfDay, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { fmt, tasksOnDay } from "./calendar-utils";
import { CalendarTaskChip } from "./CalendarTaskChip";
import type { TaskRow } from "@/hooks/useTasks";

interface Props {
  anchor: Date;
  tasks: TaskRow[];
  onOpenTask: (id: string) => void;
}

export function AgendaView({ anchor, tasks, onOpenTask }: Props) {
  const groups = useMemo(() => {
    const start = startOfDay(anchor);
    const out: { date: Date; tasks: TaskRow[] }[] = [];
    for (let i = 0; i < 31; i++) {
      const d = addDays(start, i);
      const list = tasksOnDay(tasks, d);
      if (list.length) out.push({ date: d, tasks: list });
    }
    return out;
  }, [tasks, anchor]);

  if (groups.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
        Nenhuma tarefa agendada nos próximos 30 dias.
      </div>
    );
  }

  const today = new Date();

  return (
    <div className="flex h-full flex-col overflow-auto rounded-xl border bg-card">
      <ul className="divide-y">
        {groups.map(({ date, tasks: list }) => {
          const isToday = isSameDay(date, today);
          return (
            <li key={date.toISOString()} className="flex gap-4 p-4">
              <div className="w-20 shrink-0 text-center">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{fmt(date, "EEE")}</div>
                <div
                  className={cn(
                    "mx-auto mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-base font-bold",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {fmt(date, "d")}
                </div>
                <div className="text-[10px] text-muted-foreground">{fmt(date, "MMM")}</div>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                {list.map((t) => (
                  <CalendarTaskChip key={t.id} task={t} onClick={onOpenTask} variant="block" />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}