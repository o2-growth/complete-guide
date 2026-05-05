import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import {
  useTaskAggregation,
  type AggregationGroupBy,
  type AggregationMetric,
  type AggregationContext,
} from "@/hooks/useTaskAggregation";
import { useProjects } from "@/hooks/useProjects";
import { useTaskStatuses } from "@/hooks/useTasks";
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import { useCustomFieldDefinitions } from "@/hooks/useCustomFields";
import type { TaskRow } from "@/hooks/useTasks";

type ChartType = "bar" | "line" | "donut";

interface TaskChartViewProps {
  tasks: TaskRow[];
  isLoading?: boolean;
  /** Default 'bar'. Pode ser fixado quando embutido em wiki. */
  defaultChartType?: ChartType;
  defaultGroupBy?: AggregationGroupBy;
  defaultMetric?: AggregationMetric;
  /** Quando true, esconde controles e tabela (modo embed). */
  compact?: boolean;
  height?: number;
}

const GROUP_OPTIONS: { value: AggregationGroupBy; label: string }[] = [
  { value: "priority", label: "Prioridade" },
  { value: "status", label: "Status" },
  { value: "project", label: "Projeto" },
  { value: "assignee", label: "Responsável" },
  { value: "tag", label: "Tag" },
  { value: "task_type", label: "Tipo" },
  { value: "weekday", label: "Dia da semana" },
  { value: "month", label: "Mês" },
];

const CHART_COLORS = [
  "#0EA5E9", "#22c55e", "#f97316", "#a855f7", "#ef4444",
  "#facc15", "#14b8a6", "#ec4899", "#6366f1", "#84cc16",
  "#f43f5e", "#06b6d4",
];

function exportCsv(rows: { key: string; label: string; value: number }[], filename: string) {
  const header = "label,value\n";
  const body = rows
    .map((r) => `"${r.label.replace(/"/g, '""')}",${r.value}`)
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function TaskChartView({
  tasks,
  isLoading,
  defaultChartType = "bar",
  defaultGroupBy = "priority",
  defaultMetric = "count",
  compact,
  height = 360,
}: TaskChartViewProps) {
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [groupBy, setGroupBy] = useState<AggregationGroupBy>(defaultGroupBy);
  const [metric, setMetric] = useState<AggregationMetric>(defaultMetric);

  const { data: projects = [] } = useProjects();
  const { data: statuses = [] } = useTaskStatuses();
  const { data: taskTypes = [] } = useTaskTypes();
  const { data: members = [] } = useTenantMembers();
  const { data: customFields = [] } = useCustomFieldDefinitions({ enabled: !compact });

  const numericFields = useMemo(
    () => customFields.filter((f) => f.field_type === "number" || f.field_type === "currency" || f.field_type === "rating"),
    [customFields],
  );

  const context: AggregationContext = useMemo(
    () => ({
      projectNames: Object.fromEntries(projects.map((p) => [p.id, p.name])),
      statusNames: Object.fromEntries(statuses.map((s) => [s.id, s.name])),
      taskTypeNames: Object.fromEntries(taskTypes.map((t) => [t.id, t.name ?? t.slug])),
      assigneeNames: Object.fromEntries(
        members.map((m) => [m.id, m.full_name ?? m.display_name ?? m.email ?? "—"]),
      ),
    }),
    [projects, statuses, taskTypes, members],
  );

  const { buckets, total } = useTaskAggregation({ tasks, groupBy, metric, context });

  if (isLoading) return <ListSkeleton rows={4} />;
  if (!tasks.length) {
    return (
      <EmptyState
        icon={Inbox}
        title="Sem dados pra plotar"
        description="Quando houver tarefas no escopo, o gráfico aparece aqui."
      />
    );
  }

  const chartData = buckets.map((b, i) => ({
    ...b,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-4">
      {!compact && (
        <Card className="flex flex-wrap items-end gap-3 p-3">
          <div className="space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Barras</SelectItem>
                <SelectItem value="line">Linha</SelectItem>
                <SelectItem value="donut">Donut</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Agrupar por</Label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as AggregationGroupBy)}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Métrica</Label>
            <Select value={metric} onValueChange={(v) => setMetric(v as AggregationMetric)}>
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Contagem</SelectItem>
                <SelectItem value="sum_estimate">Soma de estimativa (min)</SelectItem>
                <SelectItem value="sum_spent">Soma de tempo gasto (min)</SelectItem>
                <SelectItem value="avg_progress">Média de progresso (%)</SelectItem>
                {numericFields.map((f) => (
                  <SelectItem key={f.id} value={`cf:${f.id}`}>
                    Soma — {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCsv(buckets, `chart-${groupBy}-${metric}.csv`)}
              className="gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-3">
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer>
            {chartType === "bar" ? (
              <BarChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            ) : (
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={1}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      {!compact && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Categoria</th>
                <th className="px-3 py-2 text-right">Valor</th>
                <th className="px-3 py-2 text-right">% do total</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((b) => (
                <tr key={b.key} className="border-t">
                  <td className="px-3 py-2">{b.label}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {Number.isInteger(b.value) ? b.value : b.value.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {total > 0 ? `${((b.value / total) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
