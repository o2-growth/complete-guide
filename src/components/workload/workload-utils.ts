import { addDays, endOfDay, format, isWeekend, startOfDay, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

export function getWeekRange(anchor: Date) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 }); // segunda
  const days: Date[] = Array.from({ length: 7 }, (_, i) => startOfDay(addDays(start, i)));
  const from = startOfDay(days[0]);
  const to = endOfDay(days[6]);
  return { days, from, to };
}

export function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function dayLabel(d: Date) {
  return format(d, "EEE dd", { locale: ptBR });
}

export { isWeekend };

export function loadColor(load: number, capacity: number) {
  if (capacity <= 0) return "bg-muted/30";
  const ratio = load / capacity;
  if (ratio === 0) return "bg-muted/20 hover:bg-muted/40";
  if (ratio < 0.4) return "bg-[hsl(var(--prio-low)/0.18)] hover:bg-[hsl(var(--prio-low)/0.28)]";
  if (ratio < 0.8) return "bg-[hsl(var(--prio-medium)/0.22)] hover:bg-[hsl(var(--prio-medium)/0.32)]";
  if (ratio <= 1) return "bg-[hsl(var(--prio-high)/0.28)] hover:bg-[hsl(var(--prio-high)/0.38)]";
  return "bg-[hsl(var(--prio-urgent)/0.32)] hover:bg-[hsl(var(--prio-urgent)/0.42)]";
}

export function fmtMin(min: number) {
  if (min <= 0) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${m}` : `${h}h`;
}