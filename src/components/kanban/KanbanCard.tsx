import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Flag, GripVertical } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskRow } from "@/hooks/useTasks";

const PRIO_COLOR: Record<string, string> = {
  urgent: "text-[hsl(var(--prio-urgent))]",
  high: "text-[hsl(var(--prio-high))]",
  medium: "text-[hsl(var(--prio-medium))]",
  low: "text-[hsl(var(--prio-low))]",
  none: "text-muted-foreground/30",
};

interface Props {
  task: TaskRow;
  onOpen?: (id: string) => void;
  isOverlay?: boolean;
}

export function KanbanCard({ task, onOpen, isOverlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const due = task.due_at ? new Date(task.due_at) : null;
  const done = !!task.done_at;
  const overdue = due && !done && isPast(due) && !isToday(due);
  const today = due && isToday(due);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm transition-shadow",
        isDragging && !isOverlay && "opacity-30",
        isOverlay && "shadow-lg ring-2 ring-primary/40 cursor-grabbing",
        !isOverlay && "hover:shadow-md cursor-pointer",
      )}
      onClick={(e) => {
        if (isOverlay) return;
        const target = e.target as HTMLElement;
        if (target.closest("[data-drag-handle]")) return;
        onOpen?.(task.id);
      }}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          data-drag-handle
          className="mt-0.5 -ml-1 cursor-grab touch-none rounded p-0.5 text-muted-foreground/40 opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Arrastar"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            {task.priority !== "none" && (
              <Flag className={cn("mt-0.5 h-3 w-3 shrink-0", PRIO_COLOR[task.priority])} />
            )}
            <p className={cn("text-sm font-medium leading-snug", done && "line-through text-muted-foreground")}>
              {task.title}
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            {task.code && (
              <Badge variant="outline" className="font-mono text-[10px] px-1 py-0 h-4">
                {task.code}
              </Badge>
            )}
            {due && (
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  overdue && "text-destructive font-medium",
                  today && !overdue && "text-primary font-medium",
                )}
              >
                <Calendar className="h-3 w-3" />
                {format(due, "dd MMM", { locale: ptBR })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}