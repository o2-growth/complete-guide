import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";
import type { TaskRow } from "@/hooks/useTasks";

export interface KanbanStatus {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  is_done: boolean;
}

interface Props {
  status: KanbanStatus;
  tasks: TaskRow[];
  allStatuses: KanbanStatus[];
  onOpen?: (id: string) => void;
  onMoveToStatus?: (taskId: string, statusId: string) => void;
}

export function KanbanColumn({ status, tasks, allStatuses, onOpen, onMoveToStatus }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: { type: "column", status },
  });

  const accent = status.color || "hsl(var(--muted-foreground))";

  return (
    <div
      className={cn(
        "flex h-full w-[300px] shrink-0 flex-col rounded-xl border bg-muted/20 transition-shadow",
        isOver && "ring-2 ring-primary/40",
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-xl border-b bg-background/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden
          />
          <span className="truncate text-sm font-semibold">{status.name}</span>
        </div>
        <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px]">
          {tasks.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-[120px] flex-col gap-2 p-2 transition-colors",
            isOver && "bg-primary/5 ring-1 ring-inset ring-primary/30",
          )}
        >
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((t) => (
              <KanbanCard
                key={t.id}
                task={t}
                allStatuses={allStatuses}
                onOpen={onOpen}
                onMoveToStatus={onMoveToStatus}
              />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground/60">
              Solte tarefas aqui
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
