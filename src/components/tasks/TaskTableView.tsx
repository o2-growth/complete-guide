import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flag, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskStatuses, useUpdateTask, useToggleTaskDone, type TaskRow } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { ProjectPicker } from "./ProjectPicker";
import { DueDateLabel } from "./DueDateLabel";
import { cn } from "@/lib/utils";

const PRIO_COLOR: Record<string, string> = {
  urgent: "text-[hsl(var(--prio-urgent))]",
  high: "text-[hsl(var(--prio-high))]",
  medium: "text-[hsl(var(--prio-medium))]",
  low: "text-[hsl(var(--prio-low))]",
  none: "text-muted-foreground",
};

const PRIO_LABEL: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  none: "—",
};

export interface TaskTableViewProps {
  tasks: TaskRow[];
  onOpen: (id: string) => void;
  showProjectColumn?: boolean;
  isLoading?: boolean;
}

export function TaskTableView({
  tasks,
  onOpen,
  showProjectColumn = false,
  isLoading = false,
}: TaskTableViewProps) {
  const { data: statuses = [] } = useTaskStatuses();
  const { data: members = [] } = useTenantMembers();
  const { data: projects = [] } = useProjects();
  const update = useUpdateTask();
  const toggle = useToggleTaskDone();
  const bulk = useBulkSelection();

  const statusMap = useMemo(() => new Map(statuses.map((s) => [s.id, s])), [statuses]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const memberMap = useMemo(
    () =>
      new Map(
        members.map((m) => [m.id, m.display_name || m.full_name || m.email || "—"]),
      ),
    [members],
  );

  // Count de comentários por task (batch via uma query só).
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const commentsQuery = useQuery({
    queryKey: ["task-table-comment-counts", taskIds.join(",")],
    enabled: taskIds.length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<Map<string, number>> => {
      const { data, error } = await supabase
        .from("comments")
        .select("task_id")
        .in("task_id", taskIds);
      if (error) throw error;
      const m = new Map<string, number>();
      for (const r of data ?? []) {
        const id = (r as { task_id: string }).task_id;
        m.set(id, (m.get(id) ?? 0) + 1);
      }
      return m;
    },
  });
  const commentCounts = commentsQuery.data ?? new Map<string, number>();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhuma tarefa nesta lista.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-10" />
            <TableHead className="min-w-[220px]">Nome</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            {showProjectColumn && <TableHead className="w-[180px]">Produto</TableHead>}
            <TableHead className="w-[130px]">Responsável</TableHead>
            <TableHead className="w-[100px]">Prioridade</TableHead>
            <TableHead className="w-[120px]">Vencimento</TableHead>
            <TableHead className="w-[72px] text-right">ICE</TableHead>
            <TableHead className="w-[72px] text-center" aria-label="Comentários">
              <MessageSquare className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const done = !!task.done_at;
            const due = task.due_at ? new Date(task.due_at) : null;
            const st = task.status_id ? statusMap.get(task.status_id) : null;
            const proj = projectMap.get(task.project_id);
            const checked = bulk.isSelected(task.id);

            return (
              <TableRow
                key={task.id}
                className={cn(
                  "cursor-pointer",
                  done && "opacity-60",
                  checked && "bg-primary/5",
                )}
                onClick={(e) => {
                  const t = e.target as HTMLElement;
                  if (t.closest("button, input, [role=combobox], a")) return;
                  onOpen(task.id);
                }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={checked || done}
                    onCheckedChange={() => {
                      if (bulk.bulkMode) bulk.toggle(task.id);
                      else toggle.mutate(task);
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span
                      className={cn(
                        "font-medium leading-snug",
                        done && "line-through text-muted-foreground",
                      )}
                    >
                      {task.title}
                    </span>
                    {task.code && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {task.code}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={task.status_id ?? ""}
                    onValueChange={(v) =>
                      update.mutate({ id: task.id, patch: { status_id: v } })
                    }
                  >
                    <SelectTrigger className="h-8 border-0 bg-transparent shadow-none">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: s.color ?? "#94a3b8" }}
                            />
                            {s.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!task.status_id && st === undefined && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                {showProjectColumn && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <ProjectPicker
                      value={task.project_id}
                      onChange={(pid) => {
                        if (!pid) return;
                        update.mutate({ id: task.id, patch: { project_id: pid } });
                      }}
                      compact
                      className="max-w-[170px]"
                    />
                  </TableCell>
                )}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <span className="truncate text-xs">
                    {task.assignee_id
                      ? memberMap.get(task.assignee_id) ?? "—"
                      : "—"}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={task.priority}
                    onValueChange={(v) =>
                      update.mutate({
                        id: task.id,
                        patch: { priority: v as TaskRow["priority"] },
                      })
                    }
                  >
                    <SelectTrigger className="h-8 border-0 bg-transparent shadow-none">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Flag className={cn("h-3 w-3", PRIO_COLOR[task.priority])} />
                        {PRIO_LABEL[task.priority]}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {(["urgent", "high", "medium", "low", "none"] as const).map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIO_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {due ? (
                    <DueDateLabel due={due} done={done} absoluteFormat="dd/MM" />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {task.ice_score != null ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "font-mono text-[10px]",
                        task.ice_score >= 600 && "bg-emerald-500/15 text-emerald-600",
                      )}
                    >
                      {task.ice_score}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {(() => {
                    const c = commentCounts.get(task.id) ?? 0;
                    if (c === 0) return <span className="text-xs text-muted-foreground">—</span>;
                    return (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        {c}
                      </span>
                    );
                  })()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
