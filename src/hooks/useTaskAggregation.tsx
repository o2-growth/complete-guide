import { useMemo } from "react";
import type { TaskRow } from "@/hooks/useTasks";

export type AggregationGroupBy =
  | "priority"
  | "status"
  | "project"
  | "assignee"
  | "tag"
  | "task_type"
  | "weekday"
  | "month";

export type AggregationMetric =
  | "count"
  | "sum_estimate"
  | "sum_spent"
  | "avg_progress"
  | string; // custom field key prefixed by `cf:`

export interface AggregationBucket {
  key: string;
  label: string;
  value: number;
}

export interface AggregationContext {
  /** Map status_id -> nome legível. */
  statusNames?: Record<string, string>;
  /** Map project_id -> nome. */
  projectNames?: Record<string, string>;
  /** Map task_type_id -> nome. */
  taskTypeNames?: Record<string, string>;
  /** Map user_id -> nome. */
  assigneeNames?: Record<string, string>;
  /** Tag dictionary por task_id (lista de nomes). */
  tagsByTask?: Record<string, string[]>;
  /** Map field_definition_id -> task_id -> value (number). */
  customFieldValuesByTask?: Record<string, Record<string, unknown>>;
}

const PRIO_LABEL: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  none: "Sem prioridade",
};

const WEEKDAY_LABEL = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const MONTH_LABEL = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function bucketKey(task: TaskRow, groupBy: AggregationGroupBy): { key: string; label: string }[] {
  switch (groupBy) {
    case "priority":
      return [{ key: task.priority, label: PRIO_LABEL[task.priority] ?? task.priority }];
    case "status":
      return [{ key: task.status_id ?? "_none", label: task.status_id ?? "Sem status" }];
    case "project":
      return [{ key: task.project_id ?? "_none", label: task.project_id ?? "Sem projeto" }];
    case "assignee":
      return [{ key: task.assignee_id ?? "_none", label: task.assignee_id ?? "Sem responsável" }];
    case "task_type":
      return [{ key: task.type_id ?? "_none", label: task.type_id ?? "Sem tipo" }];
    case "weekday": {
      if (!task.due_at) return [{ key: "_none", label: "Sem prazo" }];
      const wd = new Date(task.due_at).getDay();
      return [{ key: String(wd), label: WEEKDAY_LABEL[wd] }];
    }
    case "month": {
      if (!task.due_at) return [{ key: "_none", label: "Sem prazo" }];
      const d = new Date(task.due_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return [{ key: k, label: `${MONTH_LABEL[d.getMonth()]}/${d.getFullYear()}` }];
    }
    case "tag":
      return []; // resolved via context
    default:
      return [];
  }
}

function applyContextLabels(
  groupBy: AggregationGroupBy,
  buckets: AggregationBucket[],
  ctx: AggregationContext,
): AggregationBucket[] {
  const map: Record<string, string> | undefined = (() => {
    switch (groupBy) {
      case "status": return ctx.statusNames;
      case "project": return ctx.projectNames;
      case "task_type": return ctx.taskTypeNames;
      case "assignee": return ctx.assigneeNames;
      default: return undefined;
    }
  })();
  if (!map) return buckets;
  return buckets.map((b) => ({
    ...b,
    label: b.key === "_none" ? b.label : map[b.key] ?? b.label,
  }));
}

function metricValue(
  task: TaskRow,
  metric: AggregationMetric,
  ctx: AggregationContext,
): number {
  switch (metric) {
    case "count":
      return 1;
    case "sum_estimate":
      return task.estimate_minutes ?? 0;
    case "sum_spent":
      return task.spent_minutes ?? 0;
    case "avg_progress":
      return task.progress_pct ?? 0;
    default:
      if (metric.startsWith("cf:")) {
        const fieldId = metric.slice(3);
        const byTask = ctx.customFieldValuesByTask?.[fieldId];
        const raw = byTask?.[task.id];
        const num = typeof raw === "number" ? raw : Number(raw);
        return Number.isFinite(num) ? num : 0;
      }
      return 0;
  }
}

export interface UseTaskAggregationParams {
  tasks: TaskRow[];
  groupBy: AggregationGroupBy;
  metric: AggregationMetric;
  context?: AggregationContext;
  /** Limita a N maiores buckets (top-N). Default 12. */
  maxBuckets?: number;
}

export interface UseTaskAggregationResult {
  buckets: AggregationBucket[];
  total: number;
}

/**
 * Agregação client-side de tasks pra alimentar Chart view.
 * - Agrupa por dimensão escolhida.
 * - Aplica métrica (count / sum / avg).
 * - Para `avg_progress` o valor final é média; para o resto, soma.
 */
export function useTaskAggregation({
  tasks,
  groupBy,
  metric,
  context,
  maxBuckets = 12,
}: UseTaskAggregationParams): UseTaskAggregationResult {
  return useMemo(() => {
    const ctx = context ?? {};
    const accSum = new Map<string, { label: string; sum: number; count: number }>();

    const addToBucket = (key: string, label: string, value: number) => {
      const cur = accSum.get(key);
      if (cur) {
        cur.sum += value;
        cur.count += 1;
      } else {
        accSum.set(key, { label, sum: value, count: 1 });
      }
    };

    for (const task of tasks) {
      const value = metricValue(task, metric, ctx);

      if (groupBy === "tag") {
        const tags = ctx.tagsByTask?.[task.id] ?? [];
        if (!tags.length) {
          addToBucket("_none", "Sem tag", value);
        } else {
          for (const tag of tags) addToBucket(tag, tag, value);
        }
        continue;
      }

      const keys = bucketKey(task, groupBy);
      for (const k of keys) addToBucket(k.key, k.label, value);
    }

    let buckets: AggregationBucket[] = Array.from(accSum.entries()).map(([key, v]) => ({
      key,
      label: v.label,
      value: metric === "avg_progress" && v.count > 0 ? v.sum / v.count : v.sum,
    }));

    buckets = applyContextLabels(groupBy, buckets, ctx);

    buckets.sort((a, b) => b.value - a.value);
    if (buckets.length > maxBuckets) {
      const head = buckets.slice(0, maxBuckets - 1);
      const tail = buckets.slice(maxBuckets - 1);
      const otherTotal = tail.reduce((acc, b) => acc + b.value, 0);
      buckets = [...head, { key: "_other", label: "Outros", value: otherTotal }];
    }

    const total = buckets.reduce((acc, b) => acc + b.value, 0);
    return { buckets, total };
  }, [tasks, groupBy, metric, context, maxBuckets]);
}
