import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Flag, GripVertical, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUpdateTask } from "@/hooks/useTaskDetail";
import type { TaskRow } from "@/hooks/useTasks";
import type { KanbanStatus } from "./KanbanColumn";
import { DueDateLabel } from "@/components/tasks/DueDateLabel";
import { ProgressBar } from "@/components/tasks/ProgressBar";
import { TaskHoursChip } from "@/components/timer/TaskHoursChip";

const PRIO_COLOR: Record<string, string> = {
  urgent: "text-[hsl(var(--prio-urgent))]",
  high: "text-[hsl(var(--prio-high))]",
  medium: "text-[hsl(var(--prio-medium))]",
  low: "text-[hsl(var(--prio-low))]",
  none: "text-muted-foreground/30",
};

interface Props {
  task: TaskRow;
  allStatuses?: KanbanStatus[];
  onOpen?: (id: string) => void;
  onMoveToStatus?: (taskId: string, statusId: string) => void;
  isOverlay?: boolean;
}

export function KanbanCard({ task, allStatuses, onOpen, onMoveToStatus, isOverlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const update = useUpdateTask();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(task.title);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing, task.title]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const due = task.due_at ? new Date(task.due_at) : null;
  const done = !!task.done_at;
  const progress = task.progress_pct ?? 0;

  const commitEdit = () => {
    const next = draft.trim();
    if (!next || next === task.title) {
      setEditing(false);
      setDraft(task.title);
      return;
    }
    update.mutate({ id: task.id, patch: { title: next } });
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(task.title);
    setEditing(false);
  };

  const handleCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (editing || isOverlay) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onOpen?.(task.id);
      return;
    }
    if (e.key === "F2") {
      e.preventDefault();
      setEditing(true);
      return;
    }
    if ((e.metaKey || e.ctrlKey) && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      if (!allStatuses?.length || !task.status_id || !onMoveToStatus) return;
      const idx = allStatuses.findIndex((s) => s.id === task.status_id);
      if (idx === -1) return;
      const nextIdx = e.key === "ArrowRight" ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= allStatuses.length) return;
      e.preventDefault();
      onMoveToStatus(task.id, allStatuses[nextIdx].id);
      return;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      tabIndex={isOverlay ? -1 : 0}
      role={isOverlay ? undefined : "button"}
      aria-label={`Tarefa: ${task.title}`}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm outline-none transition-all",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        isDragging && !isOverlay && "scale-105 opacity-60 ring-2 ring-primary",
        isOverlay && "shadow-lg ring-2 ring-primary cursor-grabbing scale-105",
        !isOverlay && !isDragging && "hover:shadow-md cursor-pointer",
      )}
      onClick={(e) => {
        if (isOverlay || editing) return;
        const target = e.target as HTMLElement;
        if (target.closest("[data-drag-handle]")) return;
        if (target.closest("[data-inline-edit]")) return;
        onOpen?.(task.id);
      }}
      onDoubleClick={(e) => {
        if (isOverlay) return;
        const target = e.target as HTMLElement;
        if (target.closest("[data-drag-handle]")) return;
        e.preventDefault();
        e.stopPropagation();
        setEditing(true);
      }}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          data-drag-handle
          className="mt-0.5 -ml-1 cursor-grab touch-none rounded p-0.5 text-muted-foreground/40 opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 group-focus-visible:opacity-100 active:cursor-grabbing"
          aria-label="Arrastar"
          tabIndex={-1}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            {task.priority !== "none" && (
              <Flag className={cn("mt-0.5 h-3 w-3 shrink-0", PRIO_COLOR[task.priority])} />
            )}
            {editing ? (
              <Input
                ref={inputRef}
                data-inline-edit
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitEdit();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    cancelEdit();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="h-7 px-2 py-1 text-sm"
                aria-label="Editar título da tarefa"
              />
            ) : (
              <>
                <p className={cn("text-sm font-medium leading-snug flex-1", done && "line-through text-muted-foreground")}>
                  {task.title}
                </p>
                {!isOverlay && (
                  <button
                    type="button"
                    data-inline-edit
                    aria-label="Editar título"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(true);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="mt-0.5 rounded p-0.5 text-muted-foreground/40 opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 group-focus-visible:opacity-100"
                    tabIndex={-1}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            {task.code && (
              <Badge variant="outline" className="font-mono text-[10px] px-1 py-0 h-4">
                {task.code}
              </Badge>
            )}
            {due && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <DueDateLabel due={due} done={done} absoluteFormat="dd MMM" withTime={false} />
              </span>
            )}
            {task.gcal_event_id && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span aria-label="Sincronizada com Google Calendar" className="inline-flex items-center">
                    <Calendar className="h-3 w-3 text-primary" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Sincronizada com Google Calendar</TooltipContent>
              </Tooltip>
            )}
            <TaskHoursChip taskId={task.id} />
          </div>
        </div>
      </div>
      {progress > 0 && (
        <div className="mt-2">
          <ProgressBar value={progress} thin hideLabel />
        </div>
      )}
    </div>
  );
}
