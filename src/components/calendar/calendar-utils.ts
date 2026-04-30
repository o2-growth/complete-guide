import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addDays,
  addMonths,
  addWeeks,
  isSameDay,
  isSameMonth,
  format,
  getHours,
  setHours,
  setMinutes,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskRow } from "@/hooks/useTasks";

export type CalendarView = "month" | "week" | "day" | "agenda";

export const PT = { locale: ptBR } as const;

export function fmt(date: Date, pattern: string) {
  return format(date, pattern, PT);
}

export function priorityColorVar(p: TaskRow["priority"]) {
  switch (p) {
    case "urgent":
      return "hsl(var(--prio-urgent))";
    case "high":
      return "hsl(var(--prio-high))";
    case "medium":
      return "hsl(var(--prio-medium))";
    case "low":
      return "hsl(var(--prio-low))";
    default:
      return "hsl(var(--prio-none))";
  }
}

export function rangeForView(view: CalendarView, anchor: Date) {
  if (view === "month") {
    const ms = startOfMonth(anchor);
    const me = endOfMonth(anchor);
    return {
      from: startOfWeek(ms, { weekStartsOn: 0 }),
      to: endOfWeek(me, { weekStartsOn: 0 }),
    };
  }
  if (view === "week") {
    return {
      from: startOfWeek(anchor, { weekStartsOn: 0 }),
      to: endOfWeek(anchor, { weekStartsOn: 0 }),
    };
  }
  if (view === "day") {
    return { from: startOfDay(anchor), to: endOfDay(anchor) };
  }
  // agenda: 30 dias a partir do anchor
  return { from: startOfDay(anchor), to: endOfDay(addDays(anchor, 30)) };
}

export function shiftAnchor(view: CalendarView, anchor: Date, dir: -1 | 0 | 1) {
  if (dir === 0) return new Date();
  if (view === "month") return addMonths(anchor, dir);
  if (view === "week") return addWeeks(anchor, dir);
  return addDays(anchor, dir);
}

export function buildMonthMatrix(anchor: Date) {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 0 });
  const days: Date[] = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = addDays(d, 1);
  }
  return { days, isInMonth: (day: Date) => isSameMonth(day, anchor) };
}

export function buildWeekDays(anchor: Date) {
  const start = startOfWeek(anchor, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function tasksOnDay(tasks: TaskRow[], day: Date) {
  return tasks.filter((t) => t.due_at && isSameDay(new Date(t.due_at), day));
}

export function tasksAtHour(tasks: TaskRow[], day: Date, hour: number) {
  return tasks.filter((t) => {
    if (!t.due_at) return false;
    const d = new Date(t.due_at);
    return isSameDay(d, day) && getHours(d) === hour;
  });
}

export function dateAtHour(day: Date, hour: number) {
  return setMinutes(setHours(day, hour), 0);
}

export const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h..20h
export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export { isSameDay };