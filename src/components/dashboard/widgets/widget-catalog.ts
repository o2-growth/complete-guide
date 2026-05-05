import {
  Activity,
  BarChart3,
  Calendar,
  CircleDot,
  Code,
  FileText,
  LineChart,
  ListChecks,
  PieChart,
  Target,
  Timer,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { WidgetKind } from "@/hooks/useDashboards";

export interface WidgetCatalogItem {
  kind: WidgetKind;
  label: string;
  description: string;
  icon: LucideIcon;
  defaultWidth: number;
  defaultHeight: number;
  defaultConfig: Record<string, unknown>;
}

export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    kind: "kpi",
    label: "KPI",
    description: "Indicador único (total, concluídas, atrasadas, horas, ciclo).",
    icon: Target,
    defaultWidth: 1,
    defaultHeight: 1,
    defaultConfig: { metric: "total", range: "30d" },
  },
  {
    kind: "chart_bar",
    label: "Gráfico de barras",
    description: "Carga por responsável, status, tipo ou prioridade.",
    icon: BarChart3,
    defaultWidth: 2,
    defaultHeight: 2,
    defaultConfig: { dimension: "assignee", range: "30d" },
  },
  {
    kind: "chart_line",
    label: "Gráfico de linhas",
    description: "Linha temporal de criadas vs concluídas.",
    icon: LineChart,
    defaultWidth: 3,
    defaultHeight: 2,
    defaultConfig: { range: "30d" },
  },
  {
    kind: "chart_donut",
    label: "Gráfico donut",
    description: "Distribuição por status, tipo ou prioridade.",
    icon: PieChart,
    defaultWidth: 2,
    defaultHeight: 2,
    defaultConfig: { dimension: "status", range: "30d" },
  },
  {
    kind: "task_list",
    label: "Lista de tarefas",
    description: "Filtra abertas, atrasadas ou concluídas.",
    icon: ListChecks,
    defaultWidth: 2,
    defaultHeight: 2,
    defaultConfig: { filter: "open", limit: 8, range: "30d" },
  },
  {
    kind: "calendar_mini",
    label: "Calendário",
    description: "Mês atual com tarefas por dia.",
    icon: Calendar,
    defaultWidth: 2,
    defaultHeight: 2,
    defaultConfig: {},
  },
  {
    kind: "timesheet_snippet",
    label: "Timesheet",
    description: "Total da semana e do dia.",
    icon: Timer,
    defaultWidth: 1,
    defaultHeight: 1,
    defaultConfig: {},
  },
  {
    kind: "recent_activity",
    label: "Atividades recentes",
    description: "Stream das últimas atividades do tenant.",
    icon: Activity,
    defaultWidth: 2,
    defaultHeight: 2,
    defaultConfig: { limit: 8 },
  },
  {
    kind: "goals_progress",
    label: "Goals",
    description: "Progresso dos OKRs ativos.",
    icon: CircleDot,
    defaultWidth: 2,
    defaultHeight: 2,
    defaultConfig: { limit: 5 },
  },
  {
    kind: "workload_heatmap",
    label: "Workload",
    description: "Heatmap semanal por pessoa.",
    icon: Users,
    defaultWidth: 4,
    defaultHeight: 3,
    defaultConfig: {},
  },
  {
    kind: "embed",
    label: "Embed",
    description: "Iframe seguro (https) — Looker, Notion público, etc.",
    icon: Code,
    defaultWidth: 2,
    defaultHeight: 2,
    defaultConfig: { url: "" },
  },
  {
    kind: "markdown",
    label: "Markdown",
    description: "Bloco de texto rich.",
    icon: FileText,
    defaultWidth: 2,
    defaultHeight: 2,
    defaultConfig: { content: "" },
  },
];

export function findCatalogItem(kind: WidgetKind): WidgetCatalogItem | undefined {
  return WIDGET_CATALOG.find((c) => c.kind === kind);
}
