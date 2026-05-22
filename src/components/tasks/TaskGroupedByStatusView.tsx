import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskTableView } from "./TaskTableView";
import { useTaskStatuses, type TaskRow } from "@/hooks/useTasks";
import { taskDetailPath } from "@/lib/task-routes";
import { cn } from "@/lib/utils";

export interface TaskGroupedByStatusViewProps {
  tasks: TaskRow[];
  isLoading?: boolean;
  showProjectColumn?: boolean;
}

/**
 * Lista agrupada por status (estilo ClickUp). Diferente do ListByStatusView,
 * não precisa de projectId — funciona em SmartLists/views globais.
 * Grupos vazios são escondidos por padrão; só "sem status" só aparece se houver.
 */
export function TaskGroupedByStatusView({
  tasks,
  isLoading,
  showProjectColumn = false,
}: TaskGroupedByStatusViewProps) {
  const navigate = useNavigate();
  const { data: statuses = [] } = useTaskStatuses();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const byStatus = new Map<string, TaskRow[]>();
    const unassigned: TaskRow[] = [];
    for (const t of tasks) {
      if (t.status_id) {
        const arr = byStatus.get(t.status_id) ?? [];
        arr.push(t);
        byStatus.set(t.status_id, arr);
      } else {
        unassigned.push(t);
      }
    }
    return { byStatus, unassigned };
  }, [tasks]);

  const toggle = (key: string) =>
    setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted/40" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <p className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
        Nenhuma tarefa por aqui.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {statuses.map((status) => {
        const groupTasks = grouped.byStatus.get(status.id) ?? [];
        if (groupTasks.length === 0) return null;
        const isColl = collapsed[status.id];
        return (
          <section key={status.id} className="rounded-lg border bg-card/50">
            <button
              type="button"
              onClick={() => toggle(status.id)}
              className="flex w-full items-center gap-2 border-b px-3 py-2 text-left transition-colors hover:bg-muted/30"
              style={{ borderLeftWidth: 4, borderLeftColor: status.color ?? "#94a3b8" }}
            >
              {isColl ? (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <Badge
                variant="secondary"
                className={cn("text-[10px] font-semibold uppercase")}
                style={{ backgroundColor: `${status.color ?? "#94a3b8"}22` }}
              >
                {status.name}
              </Badge>
              <span className="text-xs text-muted-foreground">{groupTasks.length}</span>
            </button>
            {!isColl && (
              <div className="p-2">
                <TaskTableView
                  tasks={groupTasks}
                  onOpen={(id) => navigate(taskDetailPath(id))}
                  showProjectColumn={showProjectColumn}
                />
              </div>
            )}
          </section>
        );
      })}
      {grouped.unassigned.length > 0 && (
        <section className="rounded-lg border border-dashed">
          <button
            type="button"
            onClick={() => toggle("__unassigned__")}
            className="flex w-full items-center gap-2 border-b px-3 py-2 text-left transition-colors hover:bg-muted/30"
          >
            {collapsed["__unassigned__"] ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
              Sem status
            </span>
            <span className="text-xs text-muted-foreground">
              {grouped.unassigned.length}
            </span>
          </button>
          {!collapsed["__unassigned__"] && (
            <div className="p-2">
              <TaskTableView
                tasks={grouped.unassigned}
                onOpen={(id) => navigate(taskDetailPath(id))}
                showProjectColumn={showProjectColumn}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
