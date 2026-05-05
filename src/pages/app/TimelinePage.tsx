import { useMemo, useState } from "react";
import { Gantt, ViewMode, type Task as GanttTask } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { useQuery } from "@tanstack/react-query";
import { GanttChartSquare, Loader2, CalendarRange } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useRescheduleTask } from "@/hooks/useTasks";
import { queryProfile } from "@/lib/query-config";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import SEO from "@/components/SEO";
import { toast } from "sonner";

interface TimelineTaskRow {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  title: string;
  start_at: string | null;
  due_at: string;
  estimate_minutes: number | null;
  done_at: string | null;
  progress_pct: number | null;
}

interface TimelineProject {
  id: string;
  name: string;
  color: string | null;
}

const PAGE_SIZE = 100;

const VIEW_MODE_LABEL: Record<"Day" | "Week" | "Month", string> = {
  Day: "Dia",
  Week: "Semana",
  Month: "Mês",
};

function deriveStart(row: TimelineTaskRow): Date {
  if (row.start_at) return new Date(row.start_at);
  const due = new Date(row.due_at);
  const minutes = row.estimate_minutes ?? 24 * 60;
  return new Date(due.getTime() - minutes * 60 * 1000);
}

export default function TimelinePage() {
  const { tenantId, loading: wsLoading } = useWorkspace();
  const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Week");
  const [limit, setLimit] = useState<number>(PAGE_SIZE);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const reschedule = useRescheduleTask();

  const tasksQuery = useQuery({
    ...queryProfile("workload"),
    queryKey: ["timeline-tasks", tenantId, limit],
    enabled: !wsLoading && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "id, project_id, parent_task_id, title, start_at, due_at, estimate_minutes, done_at, progress_pct",
        )
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .not("due_at", "is", null)
        .order("due_at", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as TimelineTaskRow[];
    },
  });

  const projectsQuery = useQuery({
    ...queryProfile("structural"),
    queryKey: ["timeline-projects", tenantId],
    enabled: !wsLoading && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, color")
        .eq("tenant_id", tenantId!)
        .eq("archived", false);
      if (error) throw error;
      return (data ?? []) as TimelineProject[];
    },
  });

  const ganttTasks: GanttTask[] = useMemo(() => {
    const rows = tasksQuery.data ?? [];
    const projects = projectsQuery.data ?? [];
    if (rows.length === 0 || projects.length === 0) return [];

    const projectColor = new Map(projects.map((p) => [p.id, p.color]));
    const projectName = new Map(projects.map((p) => [p.id, p.name]));

    // Agrupar tasks por projeto. Cada projeto vira uma "project bar"
    // (parent) e suas tasks viram filhas. Subtarefas (parent_task_id)
    // aparecem aninhadas via campo `project` (lib usa string id de pai).
    const usedProjectIds = new Set(rows.map((r) => r.project_id));
    const bars: GanttTask[] = [];
    let order = 0;

    for (const projectId of usedProjectIds) {
      const projectRows = rows.filter((r) => r.project_id === projectId);
      if (projectRows.length === 0) continue;
      const minStart = projectRows.reduce<Date | null>((acc, r) => {
        const s = deriveStart(r);
        return !acc || s < acc ? s : acc;
      }, null);
      const maxEnd = projectRows.reduce<Date | null>((acc, r) => {
        const e = new Date(r.due_at);
        return !acc || e > acc ? e : acc;
      }, null);
      if (!minStart || !maxEnd) continue;

      const color = projectColor.get(projectId) ?? "hsl(var(--primary))";
      bars.push({
        id: `project-${projectId}`,
        type: "project",
        name: projectName.get(projectId) ?? "Projeto",
        start: minStart,
        end: maxEnd,
        progress: 0,
        hideChildren: false,
        displayOrder: order++,
        styles: {
          backgroundColor: color,
          progressColor: color,
          backgroundSelectedColor: color,
          progressSelectedColor: color,
        },
      });

      for (const row of projectRows) {
        const start = deriveStart(row);
        const end = new Date(row.due_at);
        const isSubtask = !!row.parent_task_id;
        bars.push({
          id: row.id,
          // Subtarefas viram type "task" também — gantt-task-react não tem
          // hierarquia real além de project→child, então identificamos visualmente
          // pelo prefixo no nome.
          type: "task",
          name: isSubtask ? `↳ ${row.title}` : row.title,
          start,
          end: end > start ? end : new Date(start.getTime() + 60 * 60 * 1000),
          progress: row.done_at ? 100 : row.progress_pct ?? 0,
          project: `project-${projectId}`,
          displayOrder: order++,
          styles: {
            backgroundColor: color,
            progressColor: color,
            backgroundSelectedColor: color,
            progressSelectedColor: color,
          },
        });
      }
    }

    return bars;
  }, [tasksQuery.data, projectsQuery.data]);

  const onDateChange = async (task: GanttTask) => {
    if (task.type === "project") return false;
    try {
      await reschedule.mutateAsync({
        taskId: task.id,
        newDate: task.end,
        keepTime: false,
      });
      // Se a borda esquerda mudou, atualiza start_at também
      const original = (tasksQuery.data ?? []).find((r) => r.id === task.id);
      if (original) {
        const newStart = task.start.toISOString();
        const oldStart = original.start_at ? new Date(original.start_at).toISOString() : null;
        if (oldStart !== newStart) {
          const { error } = await supabase
            .from("tasks")
            .update({ start_at: newStart })
            .eq("id", task.id);
          if (error) throw error;
        }
      }
      return true;
    } catch (e) {
      toast.error("Erro ao reagendar: " + (e instanceof Error ? e.message : ""));
      return false;
    }
  };

  const isLoading = wsLoading || tasksQuery.isLoading || projectsQuery.isLoading;
  const total = tasksQuery.data?.length ?? 0;
  const canLoadMore = total >= limit;

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <SEO title="Timeline — Oxy" description="Linha do tempo Gantt das tarefas do tenant." />
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <GanttChartSquare className="h-7 w-7 text-primary" /> Timeline
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize prazos, dependências e duração das tarefas em um Gantt interativo.
            Arraste as barras para reagendar.
          </p>
        </div>
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "Day" | "Week" | "Month")}
        >
          <TabsList aria-label="Modo de visualização">
            {(["Day", "Week", "Month"] as const).map((m) => (
              <TabsTrigger key={m} value={m} aria-label={VIEW_MODE_LABEL[m]}>
                {VIEW_MODE_LABEL[m]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      <Card className="overflow-hidden p-0" role="region" aria-label="Gantt de tarefas">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ) : ganttTasks.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={CalendarRange}
              title="Sem tarefas com prazo"
              description="Defina datas de vencimento nas tarefas para vê-las aparecer aqui."
            />
          </div>
        ) : (
          <div role="rowgroup" className="overflow-x-auto">
            <Gantt
              tasks={ganttTasks}
              viewMode={viewMode as unknown as ViewMode}
              locale="pt-BR"
              listCellWidth="200px"
              columnWidth={viewMode === "Month" ? 200 : viewMode === "Week" ? 120 : 60}
              rowHeight={42}
              headerHeight={50}
              onDateChange={onDateChange}
              onClick={(task) => {
                if (task.type !== "project") setOpenTaskId(task.id);
              }}
              onDoubleClick={(task) => {
                if (task.type !== "project") setOpenTaskId(task.id);
              }}
              TooltipContent={({ task }) => (
                <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                  <div className="font-semibold">{task.name}</div>
                  <div className="text-muted-foreground">
                    {task.start.toLocaleDateString("pt-BR")} →{" "}
                    {task.end.toLocaleDateString("pt-BR")}
                  </div>
                  {task.progress > 0 && (
                    <div className="text-muted-foreground">Progresso: {task.progress}%</div>
                  )}
                </div>
              )}
            />
          </div>
        )}
      </Card>

      {canLoadMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            disabled={tasksQuery.isFetching}
            aria-label="Carregar mais tarefas"
          >
            {tasksQuery.isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Carregar mais
          </Button>
        </div>
      )}

      <TaskDetailSheet
        taskId={openTaskId}
        onOpenChange={(o) => !o && setOpenTaskId(null)}
      />
    </div>
  );
}
