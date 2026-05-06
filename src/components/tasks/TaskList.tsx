import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TaskRow } from "./TaskRow";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { BulkActionsToolbar } from "./BulkActionsToolbar";
import { useTasks, SmartList } from "@/hooks/useTasks";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { useBulkSelection } from "@/hooks/useBulkSelection";

interface TaskListProps {
  list: SmartList;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function TaskList({
  list,
  emptyTitle = "Nada por aqui",
  emptyDescription = "Quando houver tarefas, elas aparecem aqui.",
}: TaskListProps) {
  const { data, isLoading, error } = useTasks(list);
  const [openId, setOpenId] = useState<string | null>(null);
  const bulk = useBulkSelection();

  // Mantém o snapshot de "ids visíveis" sincronizado pra range/select-all.
  useEffect(() => {
    bulk.setVisible((data ?? []).map((t) => t.id));
  }, [data, bulk]);

  // Atalhos: Cmd/Ctrl+A select all, Esc clear.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isInput) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        if (!data?.length) return;
        e.preventDefault();
        bulk.selectAll(data.map((t) => t.id));
      } else if (e.key === "Escape" && bulk.bulkMode) {
        bulk.clear();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, bulk]);

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
      <div className="space-y-2 pb-20">
        {data.map((task, i) => (
          <TaskRow
            key={task.id}
            task={task}
            onOpen={setOpenId}
            index={i}
            bulkMode={bulk.bulkMode}
          />
        ))}
      </div>
      <TaskDetailSheet taskId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
      <BulkActionsToolbar />
    </>
  );
}
