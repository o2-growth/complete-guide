import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gantt, ViewMode, type Task as GanttTask } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { useQuery } from "@tanstack/react-query";
import { Loader2, GanttChartSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateTask } from "@/hooks/useTaskDetail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { taskDetailPath } from "@/lib/task-routes";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

interface Row {
  id: string;
  parent_task_id: string | null;
  title: string;
  start_at: string | null;
  due_at: string;
  estimate_minutes: number | null;
  done_at: string | null;
  progress_pct: number | null;
}

function deriveStart(row: Row): Date {
  if (row.start_at) return new Date(row.start_at);
  const due = new Date(row.due_at);
  const minutes = row.estimate_minutes ?? 24 * 60;
  return new Date(due.getTime() - minutes * 60 * 1000);
}

export function ProjectGanttView({
  projectId,
  projectColor,
}: {
  projectId: string;
  projectColor?: string | null;
}) {
  const navigate = useNavigate();
  const update = useUpdateTask();
  const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Week");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["project-gantt", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, parent_task_id, title, start_at, due_at, estimate_minutes, done_at, progress_pct")
        .eq("project_id", projectId)
        .eq("archived", false)
        .not("due_at", "is", null)
        .order("due_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const bars: GanttTask[] = useMemo(() => {
    const color = projectColor || "hsl(var(--primary))";
    let order = 0;
    return rows.map((row) => {
      const start = deriveStart(row);
      const end = new Date(row.due_at);
      const isSub = !!row.parent_task_id;
      return {
        id: row.id,
        type: "task" as const,
        name: isSub ? `↳ ${row.title}` : row.title,
        start,
        end: end > start ? end : new Date(start.getTime() + 60 * 60 * 1000),
        progress: row.done_at ? 100 : row.progress_pct ?? 0,
        displayOrder: order++,
        styles: {
          backgroundColor: color,
          progressColor: color,
          backgroundSelectedColor: color,
          progressSelectedColor: color,
        },
      };
    });
  }, [rows, projectColor]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (bars.length === 0) {
    return (
      <EmptyState
        icon={GanttChartSquare}
        title="Sem tarefas com data"
        description="Defina vencimentos nas tarefas pra elas aparecerem no Gantt."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs text-muted-foreground">{bars.length} tarefas</span>
        <div className="flex gap-1">
          {(["Day", "Week", "Month"] as const).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={viewMode === m ? "secondary" : "ghost"}
              className="h-6 px-2 text-[11px]"
              onClick={() => setViewMode(m)}
            >
              {m === "Day" ? "Dia" : m === "Week" ? "Semana" : "Mês"}
            </Button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Gantt
          tasks={bars}
          viewMode={
            viewMode === "Day" ? ViewMode.Day : viewMode === "Week" ? ViewMode.Week : ViewMode.Month
          }
          locale="pt-BR"
          onClick={(t) => navigate(taskDetailPath(t.id))}
          onDateChange={(t) => {
            update.mutate(
              {
                id: t.id,
                patch: {
                  start_at: t.start.toISOString(),
                  due_at: t.end.toISOString(),
                },
              },
              {
                onError: (e: Error) => toast.error("Erro ao reagendar: " + e.message),
              },
            );
          }}
        />
      </div>
    </Card>
  );
}
