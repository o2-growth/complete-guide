import { Calendar, Clock, MoreHorizontal, Trash2, Flag, Palette } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskRow as TTask, useDeleteTask, useToggleTaskDone } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import { TaskTimerButton } from "@/components/timer/TimerIndicator";
import { TaskHoursChip } from "@/components/timer/TaskHoursChip";
import { SLABadge } from "@/components/sla/SLABadge";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { DueDateLabel } from "@/components/tasks/DueDateLabel";
import { ProgressBar } from "@/components/tasks/ProgressBar";
import { useWhiteboardTaskIndex } from "@/hooks/useWhiteboards";

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

export function TaskRow({
  task,
  onOpen,
  index,
}: {
  task: TTask;
  onOpen?: (id: string) => void;
  index?: number;
}) {
  const toggle = useToggleTaskDone();
  const remove = useDeleteTask();
  const { data: wbIndex } = useWhiteboardTaskIndex();
  const hasWhiteboard = !!wbIndex?.[task.id];
  const done = !!task.done_at;
  const handleToggle = () => toggle.mutate(task);
  const swipeRef = useSwipeGesture<HTMLDivElement>({
    onSwipeRight: () => handleToggle(),
    onSwipeLeft: () => remove.mutate(task.id),
  });

  const due = task.due_at ? new Date(task.due_at) : null;
  const progress = task.progress_pct ?? 0;

  // Stagger leve só nos primeiros 5 itens — listas longas ficariam lentas.
  const staggerDelay =
    typeof index === "number" && index < 5 ? `${index * 40}ms` : undefined;

  return (
    <div
      ref={swipeRef}
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30 animate-fade-in",
        done && "opacity-60",
        onOpen && "cursor-pointer",
      )}
      style={staggerDelay ? { animationDelay: staggerDelay } : undefined}
      onClick={(e) => {
        if (!onOpen) return;
        const target = e.target as HTMLElement;
        if (target.closest("[data-no-open]")) return;
        onOpen(task.id);
      }}
    >
      <Checkbox
        checked={done}
        onCheckedChange={() => handleToggle()}
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
          {task.gcal_event_id && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="shrink-0 text-muted-foreground"
                  aria-label="Sincronizada com Google Calendar"
                  data-no-open
                >
                  <Calendar className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent>Sincronizada com Google Calendar</TooltipContent>
            </Tooltip>
          )}
          {hasWhiteboard && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="shrink-0 text-muted-foreground"
                  aria-label="Tem whiteboard vinculado"
                  data-no-open
                >
                  <Palette className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent>Whiteboard vinculado</TooltipContent>
            </Tooltip>
          )}
          <SLABadge task={task} compact />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {due && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <DueDateLabel due={due} done={done} />
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
          <TaskHoursChip taskId={task.id} />
        </div>
        {progress > 0 && (
          <div className="mt-2">
            <ProgressBar value={progress} thin hideLabel />
          </div>
        )}
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