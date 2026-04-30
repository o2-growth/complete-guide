import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MoreHorizontal, Trash2, Flag } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskRow as TTask, useDeleteTask, useToggleTaskDone } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import { TaskTimerButton } from "@/components/timer/TimerIndicator";
import { SLABadge } from "@/components/sla/SLABadge";

const PRIO_COLOR: Record<string, string> = {
  urgent: "text-[hsl(var(--prio-urgent))]",
  high: "text-[hsl(var(--prio-high))]",
  medium: "text-[hsl(var(--prio-medium))]",
  low: "text-[hsl(var(--prio-low))]",
  none: "text-muted-foreground/30",
};

const PRIO_LABEL: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  none: "",
};

export function TaskRow({ task, onOpen }: { task: TTask; onOpen?: (id: string) => void }) {
  const toggle = useToggleTaskDone();
  const remove = useDeleteTask();
  const done = !!task.done_at;

  const due = task.due_at ? new Date(task.due_at) : null;
  const overdue = due && !done && isPast(due) && !isToday(due);
  const today = due && isToday(due);

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30",
        done && "opacity-60",
        onOpen && "cursor-pointer",
      )}
      onClick={(e) => {
        if (!onOpen) return;
        const target = e.target as HTMLElement;
        if (target.closest("[data-no-open]")) return;
        onOpen(task.id);
      }}
    >
      <Checkbox
        checked={done}
        onCheckedChange={() => toggle.mutate(task)}
        disabled={toggle.isPending}
        className="mt-0.5"
        data-no-open
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {task.priority !== "none" && (
            <Flag className={cn("h-3.5 w-3.5 shrink-0", PRIO_COLOR[task.priority])} />
          )}
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-sm font-medium",
              done && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </p>
          {task.code && (
            <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
              {task.code}
            </Badge>
          )}
          <SLABadge task={task as never} compact />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {due && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                overdue && "text-destructive font-medium",
                today && !overdue && "text-primary font-medium",
              )}
            >
              <Calendar className="h-3 w-3" />
              {format(due, "dd 'de' MMM", { locale: ptBR })}
              {due.getHours() !== 0 && ` às ${format(due, "HH'h'mm")}`}
            </span>
          )}
          {task.estimate_minutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.estimate_minutes >= 60
                ? `${Math.floor(task.estimate_minutes / 60)}h${task.estimate_minutes % 60 ? ` ${task.estimate_minutes % 60}m` : ""}`
                : `${task.estimate_minutes}m`}
            </span>
          )}
          {task.priority !== "none" && (
            <span className={cn("font-medium", PRIO_COLOR[task.priority])}>
              {PRIO_LABEL[task.priority]}
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            data-no-open
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" data-no-open>
          <DropdownMenuItem
            onClick={() => remove.mutate(task.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Arquivar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="opacity-0 transition-opacity group-hover:opacity-100">
        <TaskTimerButton taskId={task.id} size="icon" />
      </div>
    </div>
  );
}