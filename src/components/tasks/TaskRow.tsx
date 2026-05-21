import { Calendar, Clock, MoreHorizontal, Trash2, Flag, Palette, Copy, Pencil } from "lucide-react";
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
import {
  TaskRow as TTask,
  useDeleteTask,
  useDuplicateTask,
  useToggleTaskDone,
} from "@/hooks/useTasks";
import { useUpdateTask } from "@/hooks/useTaskDetail";
import { ProjectPicker } from "@/components/tasks/ProjectPicker";
import { cn } from "@/lib/utils";
import { TaskTimerButton } from "@/components/timer/TimerIndicator";
import { TaskHoursChip } from "@/components/timer/TaskHoursChip";
import { SLABadge } from "@/components/sla/SLABadge";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { DueDateLabel } from "@/components/tasks/DueDateLabel";
import { ProgressBar } from "@/components/tasks/ProgressBar";
import { useWhiteboardTaskIndex } from "@/hooks/useWhiteboards";
import { useBulkSelection } from "@/hooks/useBulkSelection";

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

interface TaskRowProps {
  task: TTask;
  onOpen?: (id: string) => void;
  onEdit?: (id: string) => void;
  index?: number;
  /** Quando true, o checkbox de bulk fica sempre visível. */
  bulkMode?: boolean;
}

function ICEBadge({ score }: { score: number }) {
  const cls =
    score >= 667
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
      : score >= 334
      ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
      : "text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("text-[10px]", cls)}>
      ICE {score}
    </Badge>
  );
}

export function TaskRow({ task, onOpen, onEdit, index, bulkMode = false }: TaskRowProps) {
  const toggle = useToggleTaskDone();
  const remove = useDeleteTask();
  const duplicate = useDuplicateTask();
  const update = useUpdateTask();
  const { data: wbIndex } = useWhiteboardTaskIndex();
  const hasWhiteboard = !!wbIndex?.[task.id];
  const done = !!task.done_at;

  const bulk = useBulkSelection();
  const checked = bulk.isSelected(task.id);
  const showBulkCheckbox = bulkMode || bulk.bulkMode;

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

  // Shift+click range. lastSelectedId é o anchor.
  const handleBulkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey && bulk.lastSelectedId && bulk.lastSelectedId !== task.id) {
      bulk.setRange(bulk.lastSelectedId, task.id);
      return;
    }
    bulk.toggle(task.id);
  };

  return (
    <div
      ref={swipeRef}
      className={cn(
        "group relative flex items-start rounded-lg border bg-card row-density transition-colors hover:bg-muted/30 animate-fade-in",
        done && "opacity-60",
        onOpen && "cursor-pointer",
        checked && "ring-2 ring-primary/40 bg-primary/5",
      )}
      style={staggerDelay ? { animationDelay: staggerDelay } : undefined}
      onClick={(e) => {
        if (!onOpen) return;
        const target = e.target as HTMLElement;
        if (target.closest("[data-no-open]")) return;
        // Em modo bulk, click vira toggle de seleção (modelo Linear/Notion).
        if (showBulkCheckbox) {
          handleBulkToggle(e);
          return;
        }
        onOpen(task.id);
      }}
    >
      {/* Bulk checkbox — circular, à esquerda */}
      <div
        data-no-open
        className={cn(
          "mr-2 flex shrink-0 items-center pt-0.5 transition-opacity",
          showBulkCheckbox
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
        )}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label={checked ? "Desmarcar tarefa" : "Marcar tarefa"}
          onClick={handleBulkToggle}
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full border transition-all",
            checked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-foreground",
          )}
        >
          {checked && (
            <svg viewBox="0 0 12 12" className="h-3 w-3 stroke-current" fill="none" strokeWidth={2.5} aria-hidden>
              <polyline points="2,6 5,9 10,3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      <Checkbox
        checked={done}
        onCheckedChange={() => handleToggle()}
        disabled={toggle.isPending}
        className="mt-0.5 mr-3"
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
          {task.ice_score != null && (
            <ICEBadge score={task.ice_score} />
          )}
          <span
            data-no-open
            onClick={(e) => e.stopPropagation()}
            className="max-w-[180px]"
          >
            <ProjectPicker
              value={task.project_id}
              onChange={(id) => {
                if (id && id !== task.project_id) {
                  update.mutate({ id: task.id, patch: { project_id: id } });
                }
              }}
              compact
              placeholder="Vincular produto"
              className="h-6 w-auto max-w-[180px] border-dashed text-xs"
            />
          </span>
        </div>
        {progress > 0 && (
          <div className="mt-2">
            <ProgressBar value={progress} thin hideLabel />
          </div>
        )}
      </div>

      {/* Hover toolbar — ações power-user (timer, editar, duplicar, arquivar). */}
      <div
        className="ml-2 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
        data-no-open
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <TaskTimerButton taskId={task.id} size="icon" />
            </span>
          </TooltipTrigger>
          <TooltipContent>Iniciar timer</TooltipContent>
        </Tooltip>

        {onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Editar"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task.id);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Duplicar tarefa"
              onClick={(e) => {
                e.stopPropagation();
                duplicate.mutate(task);
              }}
              disabled={duplicate.isPending}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplicar</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              aria-label="Arquivar tarefa"
              onClick={(e) => {
                e.stopPropagation();
                remove.mutate(task.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Arquivar</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Mais ações"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => duplicate.mutate(task)}>
              <Copy className="mr-2 h-4 w-4" /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => remove.mutate(task.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Arquivar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
