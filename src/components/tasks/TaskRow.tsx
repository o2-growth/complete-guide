import { Task, ListStatus, useToggleComplete, useUpdateTask, Priority } from "@/hooks/useTasks";
import { Check, Calendar, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<Priority, string> = {
  none: "text-muted-foreground",
  low: "text-blue-500",
  medium: "text-yellow-500",
  high: "text-orange-500",
  urgent: "text-red-500",
};

export function TaskRow({ task, onOpen, status }: { task: Task; onOpen: (t: Task) => void; status?: ListStatus }) {
  const toggle = useToggleComplete();
  const update = useUpdateTask();
  const done = !!task.completed_at;
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
      className="group flex items-center gap-3 border-b px-4 py-2 hover:bg-accent/40"
    >
      <button
        onClick={(e) => { e.stopPropagation(); toggle(task); }}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 hover:border-primary",
        )}
        style={status && !done ? { borderColor: status.color } : undefined}
      >
        {done && <Check className="h-3 w-3" />}
      </button>
      <button onClick={() => onOpen(task)} className={cn("flex-1 truncate text-left text-sm", done && "text-muted-foreground line-through")}>
        {task.title}
      </button>

      <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100">
        {task.due_at && (
          <span className="hidden items-center gap-1 text-xs text-muted-foreground md:inline-flex">
            <Calendar className="h-3 w-3" /> {format(new Date(task.due_at), "d MMM", { locale: ptBR })}
          </span>
        )}
        {task.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((a) => (
              <Avatar key={a.user_id} className="h-5 w-5 border border-background">
                {a.avatar_url && <AvatarImage src={a.avatar_url} />}
                <AvatarFallback className="text-[9px]">{(a.full_name ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <button title="Prioridade" className={cn("p-1", PRIORITY_COLORS[task.priority])} onClick={(e) => e.stopPropagation()}>
              <Flag className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="end">
            {(["urgent", "high", "medium", "low", "none"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => update.mutate({ id: task.id, patch: { priority: p } })}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent"
              >
                <Flag className={cn("h-3 w-3", PRIORITY_COLORS[p])} /> {p}
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <button title="Prazo" className="p-1 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
              <Calendar className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="end">
            <Input
              type="date"
              defaultValue={task.due_at ? task.due_at.slice(0, 10) : ""}
              onChange={(e) => update.mutate({ id: task.id, patch: { due_at: e.target.value ? new Date(e.target.value).toISOString() : null } })}
            />
            {task.due_at && (
              <Button variant="ghost" size="sm" className="mt-1 w-full" onClick={() => update.mutate({ id: task.id, patch: { due_at: null } })}>
                Remover prazo
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}