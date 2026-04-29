import { Loader2, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TaskRow } from "./TaskRow";
import { useTasks, SmartList } from "@/hooks/useTasks";

interface TaskListProps {
  list: SmartList;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function TaskList({ list, emptyTitle = "Nada por aqui", emptyDescription = "Quando houver tarefas, elas aparecem aqui." }: TaskListProps) {
  const { data, isLoading, error } = useTasks(list);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Erro ao carregar tarefas: {error.message}
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 border-dashed p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Inbox className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium">{emptyTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">{emptyDescription}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </div>
  );
}