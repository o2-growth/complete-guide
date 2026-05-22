import { useState } from "react";
import { Link } from "react-router-dom";
import { useMyTasks, Task } from "@/hooks/useTasks";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskSheet } from "@/components/tasks/TaskSheet";
import { Loader2 } from "lucide-react";

export default function MyTasksPage() {
  const { data: tasks = [], isLoading } = useMyTasks();
  const [active, setActive] = useState<Task | null>(null);
  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Minhas tarefas</h1>
        <p className="text-xs text-muted-foreground">{tasks.length} pendente(s) atribuídas a você</p>
      </div>
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : tasks.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nada atribuído. <Link to="/app" className="text-primary underline">Voltar ao início</Link>.
          </p>
        ) : (
          tasks.map((t) => <TaskRow key={t.id} task={t} onOpen={setActive} />)
        )}
      </div>
      <TaskSheet task={active} onOpenChange={(v) => { if (!v) setActive(null); }} />
    </div>
  );
}