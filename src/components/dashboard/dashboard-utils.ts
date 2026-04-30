import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DashboardTask } from "@/hooks/useDashboard";

export function buildKPIs(tasks: DashboardTask[]) {
  const now = new Date();
  const total = tasks.length;
  const done = tasks.filter((t) => t.done_at).length;
  const overdue = tasks.filter((t) => !t.done_at && t.due_at && new Date(t.due_at) < now).length;
  const totalSpentMin = tasks.reduce((s, t) => s + (t.spent_minutes ?? 0), 0);
  const avgCycleHours = (() => {
    const completed = tasks.filter((t) => t.done_at);
    if (!completed.length) return 0;
    const sum = completed.reduce((acc, t) => {
      const c = new Date(t.created_at).getTime();
      const d = new Date(t.done_at!).getTime();
      return acc + Math.max(0, (d - c) / 1000 / 3600);
    }, 0);
    return sum / completed.length;
  })();
  const completionRate = total ? Math.round((done / total) * 100) : 0;

  return { total, done, overdue, totalSpentMin, avgCycleHours, completionRate };
}

export function buildTimeline(tasks: DashboardTask[], since: string) {
  const start = startOfDay(new Date(since));
  const days = Math.max(1, differenceInCalendarDays(new Date(), start) + 1);
  const buckets: Record<string, { date: string; criadas: number; concluidas: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = format(d, "yyyy-MM-dd");
    buckets[key] = { date: format(d, "dd/MM", { locale: ptBR }), criadas: 0, concluidas: 0 };
  }
  for (const t of tasks) {
    const ck = format(startOfDay(new Date(t.created_at)), "yyyy-MM-dd");
    if (buckets[ck]) buckets[ck].criadas += 1;
    if (t.done_at) {
      const dk = format(startOfDay(new Date(t.done_at)), "yyyy-MM-dd");
      if (buckets[dk]) buckets[dk].concluidas += 1;
    }
  }
  return Object.values(buckets);
}

export function buildStatusBreakdown(
  tasks: DashboardTask[],
  statuses: Array<{ id: string; name: string; color: string | null }>,
) {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    const k = t.status_id ?? "_none";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return statuses
    .map((s) => ({
      name: s.name,
      value: counts.get(s.id) ?? 0,
      color: s.color ?? "#94a3b8",
    }))
    .filter((r) => r.value > 0);
}

export function buildTypeBreakdown(
  tasks: DashboardTask[],
  types: Array<{ id: string; name: string; color: string | null }>,
) {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    if (!t.type_id) continue;
    counts.set(t.type_id, (counts.get(t.type_id) ?? 0) + 1);
  }
  return types
    .map((t) => ({ name: t.name, value: counts.get(t.id) ?? 0, color: t.color ?? "#0EA5E9" }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function buildPriorityBreakdown(tasks: DashboardTask[]) {
  const order = ["urgent", "high", "medium", "low", "none"] as const;
  const labels: Record<string, string> = {
    urgent: "Urgente",
    high: "Alta",
    medium: "Média",
    low: "Baixa",
    none: "Sem prioridade",
  };
  const colors: Record<string, string> = {
    urgent: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
    none: "#94a3b8",
  };
  return order.map((p) => ({
    name: labels[p],
    value: tasks.filter((t) => t.priority === p).length,
    color: colors[p],
  })).filter((r) => r.value > 0);
}

export function buildAssigneeWorkload(
  tasks: DashboardTask[],
  profiles: Array<{ id: string; full_name: string | null; display_name: string | null }>,
) {
  const map = new Map<string, { name: string; abertas: number; concluidas: number; tempo: number }>();
  for (const t of tasks) {
    if (!t.assignee_id) continue;
    const u = profiles.find((p) => p.id === t.assignee_id);
    const name = u?.display_name || u?.full_name || "Sem nome";
    const cur = map.get(t.assignee_id) ?? { name, abertas: 0, concluidas: 0, tempo: 0 };
    if (t.done_at) cur.concluidas += 1; else cur.abertas += 1;
    cur.tempo += t.spent_minutes ?? 0;
    map.set(t.assignee_id, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.abertas + b.concluidas - (a.abertas + a.concluidas)).slice(0, 8);
}