import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DueDateLabel } from "@/components/tasks/DueDateLabel";
import { useToggleTaskDone, type TaskRow } from "@/hooks/useTasks";

interface EisenhowerTaskRowProps {
  task: TaskRow;
  /** Cor do quadrante — usada na borda do checkbox (CSS color, ex: "hsl(var(--prio-urgent))"). */
  accent: string;
  /** id do droppable do projeto pai — vai para o data do draggable pra mover entre projetos. */
  projectId: string;
  projectName?: string | null;
  onOpen: (id: string) => void;
}

/**
 * Linha de tarefa no estilo TickTick: checkbox redondo colorido + título +
 * badge do projeto + due_at. Drag pra mover entre quadrantes/projetos.
 */
export function EisenhowerTaskRow({
  task,
  accent,
  projectId,
  projectName,
  onOpen,
}: EisenhowerTaskRowProps) {
  const toggle = useToggleTaskDone();
  const done = !!task.done_at;
  const due = task.due_at ? new Date(task.due_at) : null;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: "task", task, projectId },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`Tarefa: ${task.title}. Arraste para repriorizar ou mudar de projeto.`}
      className={cn(
        "group flex cursor-grab touch-none items-start gap-2 rounded-md border border-transparent bg-card px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:border-border hover:bg-muted/40 active:cursor-grabbing",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        isDragging && "opacity-40",
        done && "opacity-60",
      )}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-no-open]")) return;
        onOpen(task.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          const target = e.target as HTMLElement;
          if (target.closest("[data-no-open]")) return;
          e.preventDefault();
          onOpen(task.id);
        }
      }}
    >
      <button
        type="button"
        data-no-open
        aria-label={done ? "Reabrir tarefa" : "Concluir tarefa"}
        aria-pressed={done}
        onClick={(e) => {
          e.stopPropagation();
          toggle.mutate(task);
        }}
        disabled={toggle.isPending}
        className={cn(
          "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          done && "bg-current",
        )}
        style={{ borderColor: accent, color: accent }}
      >
        {done && (
          <svg
            viewBox="0 0 12 12"
            className="h-2.5 w-2.5 text-background"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate leading-snug",
            done && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </p>
        {due && (
          <div className="mt-0.5 text-[11px]">
            <DueDateLabel due={due} done={done} absoluteFormat="dd 'de' MMM" />
          </div>
        )}
      </div>

      {projectName && (
        <Badge
          variant="outline"
          className="ml-auto h-5 max-w-[7rem] shrink-0 truncate px-1.5 text-[10px] font-normal text-muted-foreground"
          title={projectName}
        >
          {projectName}
        </Badge>
      )}
    </div>
  );
}
