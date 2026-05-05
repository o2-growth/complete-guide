import type { DashboardWidget } from "@/hooks/useDashboards";
import { WidgetKpi } from "./WidgetKpi";
import { WidgetChartBar } from "./WidgetChartBar";
import { WidgetChartLine } from "./WidgetChartLine";
import { WidgetChartDonut } from "./WidgetChartDonut";
import { WidgetTaskList } from "./WidgetTaskList";
import { WidgetCalendarMini } from "./WidgetCalendarMini";
import { WidgetTimesheetSnippet } from "./WidgetTimesheetSnippet";
import { WidgetRecentActivity } from "./WidgetRecentActivity";
import { WidgetGoalsProgress } from "./WidgetGoalsProgress";
import { WidgetWorkloadHeatmap } from "./WidgetWorkloadHeatmap";
import { WidgetEmbed } from "./WidgetEmbed";
import { WidgetMarkdown } from "./WidgetMarkdown";

export function WidgetRenderer({ widget }: { widget: DashboardWidget }) {
  const cfg = (widget.config ?? {}) as Record<string, unknown>;
  switch (widget.kind) {
    case "kpi":
      return <WidgetKpi config={cfg} />;
    case "chart_bar":
      return <WidgetChartBar config={cfg} />;
    case "chart_line":
      return <WidgetChartLine config={cfg} />;
    case "chart_donut":
      return <WidgetChartDonut config={cfg} />;
    case "task_list":
      return <WidgetTaskList config={cfg} />;
    case "calendar_mini":
      return <WidgetCalendarMini />;
    case "timesheet_snippet":
      return <WidgetTimesheetSnippet />;
    case "recent_activity":
      return <WidgetRecentActivity config={cfg} />;
    case "goals_progress":
      return <WidgetGoalsProgress config={cfg} />;
    case "workload_heatmap":
      return <WidgetWorkloadHeatmap />;
    case "embed":
      return <WidgetEmbed config={cfg} />;
    case "markdown":
      return <WidgetMarkdown config={cfg} />;
    default:
      return (
        <p className="text-xs text-muted-foreground text-center py-6">
          Tipo desconhecido: {widget.kind}
        </p>
      );
  }
}
