import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { priorityColorVar } from "./calendar-utils";
import type { TaskRow } from "@/hooks/useTasks";

interface Props {
  task: TaskRow;
  onClick?: (id: string) => void;
  variant?: "compact" | "block";
  className?: string;
}

export function CalendarTaskChip({ task, onClick, variant = "compact", className }: Props) {
  const done = !!task.done_at;
  const time = task.due_at ? format(new Date(task.due_at), "HH:mm", { locale: ptBR }) : null;

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/task-id", task.id);
        e.dataTransfer.setData("text/task-due", task.due_at ?? "");
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(task.id);
      }}
      className={cn(
        "group flex w-full items-center gap-1.5 truncate rounded-md border border-transparent bg-card px-1.5 py-1 text-left text-[11px] font-medium text-foreground/90 shadow-sm transition hover:border-border hover:shadow",
        done && "opacity-60 line-through",
        variant === "block" && "py-1.5 text-xs",
        className,
      )}
      style={{ borderLeft: `3px solid ${priorityColorVar(task.priority)}` }}
      title={task.title}
    >
      {time && <span className="shrink-0 tabular-nums text-muted-foreground">{time}</span>}
      <span className="truncate">{task.title}</span>
    </button>
  );
}