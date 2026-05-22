import { Task, useToggleComplete } from "@/hooks/useTasks";
import { CheckCircle2, Circle, Calendar as CalIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PRIO_COLOR: Record<string, string> = {
  none: "#94a3b8", low: "#3b82f6", medium: "#eab308", high: "#f97316", urgent: "#ef4444",
};

export function TaskRow({ task, onOpen, status }: { task: Task; onOpen: (t: Task) => void; status?: { name: string; color: string } | null }) {
  const toggle = useToggleComplete();
  return (
    <div
      className="group flex cursor-pointer items-center gap-3 border-b px-4 py-2 hover:bg-accent/40"
      onClick={() => onOpen(task)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); toggle(task); }}
        className="text-muted-foreground hover:text-success"
      >
        {task.completed_at ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4" />}
      </button>
      <span className="flex-1 truncate text-sm" style={task.completed_at ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>
        {task.title}
      </span>
      {status && (
        <span className="rounded px-2 py-0.5 text-[10px] font-medium uppercase" style={{ background: `${status.color}22`, color: status.color }}>
          {status.name}
        </span>
      )}
      <span className="h-2 w-2 rounded-full" style={{ background: PRIO_COLOR[task.priority] }} title={task.priority} />
      {task.due_at && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalIcon className="h-3 w-3" />
          {format(new Date(task.due_at), "dd MMM", { locale: ptBR })}
        </span>
      )}
    </div>
  );
}