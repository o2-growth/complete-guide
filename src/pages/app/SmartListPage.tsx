import { useMemo, useState } from "react";
import { Inbox, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaskList } from "@/components/tasks/TaskList";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { SmartList, useTasksInfinite, type TaskRow as TTask } from "@/hooks/useTasks";

interface SmartListPageProps {
  list: SmartList;
  title: string;
  description: string;
  icon: LucideIcon;
  showQuickAdd?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

const INFINITE_LISTS: SmartList[] = ["next7", "assigned"];

function InfiniteTaskList({
  list,
  emptyTitle,
  emptyDescription,
}: {
  list: SmartList;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTasksInfinite(list);
  const [openId, setOpenId] = useState<string | null>(null);

  const tasks = useMemo<TTask[]>(
    () => data?.pages.flatMap((p) => p.rows) ?? [],
    [data],
  );

  if (isLoading) return <ListSkeleton rows={6} />;

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Erro ao carregar tarefas: {error.message}
      </Card>
    );
  }

  if (!tasks.length) {
    return <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <div className="space-y-2">
        {tasks.map((task, i) => (
          <TaskRow key={task.id} task={task} onOpen={setOpenId} index={i} />
        ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            aria-label="Carregar mais tarefas"
          >
            {isFetchingNextPage ? (
              <span role="status" aria-live="polite">Carregando...</span>
            ) : (
              "Carregar mais"
            )}
          </Button>
        </div>
      )}
      <TaskDetailSheet taskId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </>
  );
}

export default function SmartListPage({
  list,
  title,
  description,
  icon: Icon,
  showQuickAdd = false,
  emptyTitle = "Nada por aqui",
  emptyDescription = "Quando houver tarefas, elas aparecem aqui.",
}: SmartListPageProps) {
  const useInfinite = INFINITE_LISTS.includes(list);

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
            <Icon className="mr-1.5 h-3 w-3" /> Smart list
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        {showQuickAdd && <QuickAdd />}

        {useInfinite ? (
          <InfiniteTaskList
            list={list}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
        ) : (
          <TaskList list={list} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
        )}
      </div>
    </div>
  );
}
