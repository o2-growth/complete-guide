import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  buildMonthMatrix,
  fmt,
  isSameDay,
  tasksOnDay,
  WEEKDAY_LABELS,
} from "./calendar-utils";
import { CalendarTaskChip } from "./CalendarTaskChip";
import type { TaskRow } from "@/hooks/useTasks";

interface Props {
  anchor: Date;
  tasks: TaskRow[];
  onOpenTask: (id: string) => void;
  onDropTask: (taskId: string, day: Date, currentDueAt: string) => void;
}

export function MonthView({ anchor, tasks, onOpenTask, onDropTask }: Props) {
  const { days, isInMonth } = buildMonthMatrix(anchor);
  const today = new Date();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 auto-rows-fr">
        {days.map((day, idx) => {
          const dayTasks = tasksOnDay(tasks, day);
          const inMonth = isInMonth(day);
          const isToday = isSameDay(day, today);
          return (
            <div
              key={idx}
              onDragOver={(e) => {
                e.preventDefault();
                setHoverIdx(idx);
              }}
              onDragLeave={() => setHoverIdx((v) => (v === idx ? null : v))}
              onDrop={(e) => {
                e.preventDefault();
                setHoverIdx(null);
                const id = e.dataTransfer.getData("text/task-id");
                const due = e.dataTransfer.getData("text/task-due");
                if (id) onDropTask(id, day, due);
              }}
              className={cn(
                "relative flex min-h-[110px] flex-col gap-1 border-b border-r p-1.5 transition",
                !inMonth && "bg-muted/20 text-muted-foreground",
                hoverIdx === idx && "bg-primary/5 ring-1 ring-inset ring-primary/30",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {fmt(day, "d")}
                </span>
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{dayTasks.length - 3}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {dayTasks.slice(0, 3).map((t) => (
                  <CalendarTaskChip key={t.id} task={t} onClick={onOpenTask} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}