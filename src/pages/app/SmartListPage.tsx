import { useEffect, useMemo, useState } from "react";
import { BarChart3, Calendar, Inbox, LayoutGrid, ListTodo, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskList } from "@/components/tasks/TaskList";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { TaskGalleryView } from "@/components/tasks/views/TaskGalleryView";
import { TaskChartView } from "@/components/tasks/views/TaskChartView";
import { BulkActionsToolbar } from "@/components/tasks/BulkActionsToolbar";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { SmartList, useTasks, useTasksInfinite, type TaskRow as TTask } from "@/hooks/useTasks";
import { useBulkSelection } from "@/hooks/useBulkSelection";

type ViewMode = "list" | "gallery" | "chart";

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

const VIEW_STORAGE_KEY = "oxy:smart-list-view";

function getStoredView(list: SmartList): ViewMode {
  if (typeof window === "undefined") return "list";
  try {
    const raw = window.localStorage.getItem(`${VIEW_STORAGE_KEY}:${list}`);
    if (raw === "list" || raw === "gallery" || raw === "chart") return raw;
  } catch {
    // ignore
  }
  return "list";
}

function setStoredView(list: SmartList, view: ViewMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${VIEW_STORAGE_KEY}:${list}`, view);
  } catch {
    // ignore
  }
}

function InfiniteListBody({
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

  const bulk = useBulkSelection();

  useEffect(() => {
    bulk.setVisible(tasks.map((t) => t.id));
  }, [tasks, bulk]);

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
        if (!tasks.length) return;
        e.preventDefault();
        bulk.selectAll(tasks.map((t) => t.id));
      } else if (e.key === "Escape" && bulk.bulkMode) {
        bulk.clear();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tasks, bulk]);

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
      <div className="space-y-2 pb-20">
        {tasks.map((task, i) => (
          <TaskRow
            key={task.id}
            task={task}
            onOpen={setOpenId}
            index={i}
            bulkMode={bulk.bulkMode}
          />
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
      <BulkActionsToolbar />
    </>
  );
}

/**
 * Versão "all-pages" das listas infinitas: só usada por Gallery/Chart pra
 * trabalharem com o conjunto inteiro filtrado, não só a página atual.
 */
function useAllTasks(list: SmartList): {
  tasks: TTask[];
  isLoading: boolean;
  error: Error | null;
} {
  const isInfinite = INFINITE_LISTS.includes(list);
  const finite = useTasks(list);
  const infinite = useTasksInfinite(list);

  if (isInfinite) {
    const tasks = infinite.data?.pages.flatMap((p) => p.rows) ?? [];
    return {
      tasks,
      isLoading: infinite.isLoading,
      error: (infinite.error as Error | null) ?? null,
    };
  }
  return {
    tasks: (finite.data ?? []) as TTask[],
    isLoading: finite.isLoading,
    error: (finite.error as Error | null) ?? null,
  };
}

function NonListContent({
  list,
  view,
  emptyTitle,
  emptyDescription,
}: {
  list: SmartList;
  view: "gallery" | "chart";
  emptyTitle: string;
  emptyDescription: string;
}) {
  const { tasks, isLoading, error } = useAllTasks(list);

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Erro ao carregar tarefas: {error.message}
      </Card>
    );
  }

  if (view === "gallery") {
    return (
      <TaskGalleryView
        tasks={tasks}
        isLoading={isLoading}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    );
  }
  return <TaskChartView tasks={tasks} isLoading={isLoading} />;
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
  const [view, setView] = useState<ViewMode>(() => getStoredView(list));

  useEffect(() => {
    setView(getStoredView(list));
  }, [list]);

  const handleViewChange = (v: string) => {
    const next = (v as ViewMode) ?? "list";
    setView(next);
    setStoredView(list, next);
  };

  // Listas de "agenda-friendly": mostram a coluna lateral com card de agenda (igual print 3).
  const showAgenda = (list === "today" || list === "overdue") && view === "list";
  const containerWidth = showAgenda ? "max-w-6xl" : view === "list" ? "max-w-3xl" : "max-w-6xl";

  const mainContent = (
    <Tabs value={view} onValueChange={handleViewChange} className="w-full">
      <TabsList>
        <TabsTrigger value="list">
          <ListTodo className="mr-1.5 h-3.5 w-3.5" /> Lista
        </TabsTrigger>
        <TabsTrigger value="gallery">
          <LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> Galeria
        </TabsTrigger>
        <TabsTrigger value="chart">
          <BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Gráfico
        </TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="mt-4">
        {useInfinite ? (
          <InfiniteListBody
            list={list}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
        ) : (
          <TaskList list={list} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
        )}
      </TabsContent>

      <TabsContent value="gallery" className="mt-4">
        <NonListContent
          list={list}
          view="gallery"
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </TabsContent>

      <TabsContent value="chart" className="mt-4">
        <NonListContent
          list={list}
          view="chart"
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="container py-8">
      <div className={`mx-auto ${containerWidth} space-y-6`}>
        <PageHeader
          icon={Icon}
          title={title}
          description={description}
          badge={
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
              Smart list
            </Badge>
          }
        />

        {showQuickAdd && <QuickAdd />}

        {showAgenda ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="min-w-0">{mainContent}</div>
            <aside>
              <AgendaSidebarCard />
            </aside>
          </div>
        ) : (
          mainContent
        )}
      </div>
    </div>
  );
}

function AgendaSidebarCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">Agenda</h2>
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Calendar className="h-8 w-8 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Conecte seu calendário para ver os próximos eventos.
        </p>
        <a
          href="/app/configuracoes/integracoes"
          className="text-xs font-medium text-primary hover:underline"
        >
          Conectar Google Agenda →
        </a>
      </div>
    </Card>
  );
}
