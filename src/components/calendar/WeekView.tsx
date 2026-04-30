import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  buildWeekDays,
  dateAtHour,
  fmt,
  HOURS,
  isSameDay,
  tasksAtHour,
} from "./calendar-utils";
import { CalendarTaskChip } from "./CalendarTaskChip";
import type { TaskRow } from "@/hooks/useTasks";

interface Props {
  anchor: Date;
  tasks: TaskRow[];
  onOpenTask: (id: string) => void;
  onDropTask: (taskId: string, target: Date, currentDueAt: string) => void;
  singleDay?: boolean;
}

export function WeekView({ anchor, tasks, onOpenTask, onDropTask, singleDay }: Props) {
  const days = singleDay ? [anchor] : buildWeekDays(anchor);
  const today = new Date();
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      <div
        className="grid border-b bg-muted/40"
        style={{ gridTemplateColumns: `60px repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={d.toISOString()} className="border-l px-2 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{fmt(d, "EEE")}</div>
              <div
                className={cn(
                  "mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {fmt(d, "d")}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex-1 overflow-auto">
        <div
          className="grid"
          style={{ gridTemplateColumns: `60px repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {HOURS.map((h) => (
            <div key={`row-${h}`} className="contents">
              <div className="border-r border-t px-2 py-1 text-right text-[10px] text-muted-foreground">
                {String(h).padStart(2, "0")}:00
              </div>
              {days.map((d) => {
                const cellTasks = tasksAtHour(tasks, d, h);
                const key = `${d.toISOString()}-${h}`;
                return (
                  <div
                    key={key}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHoverKey(key);
                    }}
                    onDragLeave={() => setHoverKey((v) => (v === key ? null : v))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setHoverKey(null);
                      const id = e.dataTransfer.getData("text/task-id");
                      const due = e.dataTransfer.getData("text/task-due");
                      if (id) onDropTask(id, dateAtHour(d, h), due);
                    }}
                    className={cn(
                      "relative flex min-h-[44px] flex-col gap-1 border-l border-t p-1 transition",
                      hoverKey === key && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                    )}
                  >
                    {cellTasks.map((t) => (
                      <CalendarTaskChip key={t.id} task={t} onClick={onOpenTask} variant="block" />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}