import { useState } from "react";
import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TaskRow } from "./TaskRow";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { useTasks, SmartList } from "@/hooks/useTasks";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";

interface TaskListProps {
  list: SmartList;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function TaskList({ list, emptyTitle = "Nada por aqui", emptyDescription = "Quando houver tarefas, elas aparecem aqui." }: TaskListProps) {
  const { data, isLoading, error } = useTasks(list);
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) {
    return <ListSkeleton rows={6} />;
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Erro ao carregar tarefas: {error.message}
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <div className="space-y-2 animate-fade-in">
        {data.map((task) => (
          <TaskRow key={task.id} task={task} onOpen={setOpenId} />
        ))}
      </div>
      <TaskDetailSheet taskId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </>
  );
}