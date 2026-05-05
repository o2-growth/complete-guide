import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProjects } from "@/hooks/useProjects";
import {
  useTasksByPriorityGrouped,
  useUpdateTaskPriority,
  type TaskPriority,
  type TaskRow,
} from "@/hooks/useTasks";
import { useUpdateTask } from "@/hooks/useTaskDetail";
import { EisenhowerQuadrant, type QuadrantTheme } from "./_components/eisenhower/EisenhowerQuadrant";

/**
 * Mapeamento priority → quadrante:
 *  Q1 (urgent)  → vermelho
 *  Q2 (high)    → dourado
 *  Q3 (medium)  → azul (primary)
 *  Q4 (low|none) → verde
 *
 * "low" e "none" caem no Q4. Drop em Q4 normaliza pra "low".
 */
type QuadrantKey = "Q1" | "Q2" | "Q3" | "Q4";

const QUADRANTS: Array<{
  key: QuadrantKey;
  priority: TaskPriority;
  theme: QuadrantTheme;
}> = [
  {
    key: "Q1",
    priority: "urgent",
    theme: {
      numeral: "I",
      title: "Urgente e Importante",
      accent: "hsl(var(--prio-urgent))",
      bgClass: "bg-[hsl(var(--prio-urgent))]/[0.04]",
      ringClass: "ring-[hsl(var(--prio-urgent))]/50",
    },
  },
  {
    key: "Q2",
    priority: "high",
    theme: {
      numeral: "II",
      title: "Não Urgente e Importante",
      accent: "hsl(var(--accent))",
      bgClass: "bg-[hsl(var(--accent))]/[0.05]",
      ringClass: "ring-[hsl(var(--accent))]/50",
    },
  },
  {
    key: "Q3",
    priority: "medium",
    theme: {
      numeral: "III",
      title: "Urgente e não importante",
      accent: "hsl(var(--primary))",
      bgClass: "bg-[hsl(var(--primary))]/[0.04]",
      ringClass: "ring-[hsl(var(--primary))]/50",
    },
  },
  {
    key: "Q4",
    priority: "low",
    theme: {
      numeral: "IV",
      title: "Não urgente e não importante",
      accent: "hsl(var(--success))",
      bgClass: "bg-[hsl(var(--success))]/[0.04]",
      ringClass: "ring-[hsl(var(--success))]/50",
    },
  },
];

interface QuadrantData {
  open: Record<string, TaskRow[]>;
  done: TaskRow[];
}

const EMPTY_QUADRANT: QuadrantData = { open: {}, done: [] };

export default function EisenhowerPage() {
  const { data, isLoading, error } = useTasksByPriorityGrouped();
  const { data: projects = [] } = useProjects();
  const updatePriority = useUpdateTaskPriority();
  const updateTask = useUpdateTask();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [activeTask, setActiveTask] = useState<TaskRow | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<QuadrantKey>("Q1");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  // Q4 absorve `low` e `none` — combina ambos no mesmo bucket visual.
  const byQuadrant = useMemo(() => {
    const u = data?.urgent ?? EMPTY_QUADRANT;
    const h = data?.high ?? EMPTY_QUADRANT;
    const m = data?.medium ?? EMPTY_QUADRANT;
    const l = data?.low ?? EMPTY_QUADRANT;
    const n = data?.none ?? EMPTY_QUADRANT;

    const q4Open: Record<string, TaskRow[]> = {};
    [l.open, n.open].forEach((src) => {
      Object.entries(src).forEach(([pid, list]) => {
        q4Open[pid] = q4Open[pid] ? [...q4Open[pid], ...list] : [...list];
      });
    });

    return {
      Q1: u,
      Q2: h,
      Q3: m,
      Q4: { open: q4Open, done: [...l.done, ...n.done] } as QuadrantData,
    } as Record<QuadrantKey, QuadrantData>;
  }, [data]);

  const findTask = (id: string): TaskRow | null => {
    if (!data) return null;
    for (const bucket of Object.values(data)) {
      for (const list of Object.values(bucket.open)) {
        const t = list.find((x) => x.id === id);
        if (t) return t;
      }
      const t = bucket.done.find((x) => x.id === id);
      if (t) return t;
    }
    return null;
  };

  const onDragStart = (e: DragStartEvent) => {
    setActiveTask(findTask(String(e.active.id)));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const overData = over.data.current as
      | { type?: string; projectId?: string }
      | undefined;
    if (!overData) return;

    const overId = String(over.id);
    const task = findTask(String(active.id));
    if (!task) return;

    // overId tem formato "quad-{prio}::proj-{pid}" para projeto, ou "quad-{prio}" para o quadrante.
    const quadMatch = overId.match(/^quad-(urgent|high|medium|low)/);
    const targetPriority = quadMatch?.[1] as TaskPriority | undefined;
    if (!targetPriority) return;

    const currentBucket: TaskPriority =
      task.priority === "none" ? "low" : task.priority;

    const movedQuadrant = currentBucket !== targetPriority;
    const movedProject =
      overData.type === "project" &&
      typeof overData.projectId === "string" &&
      overData.projectId !== "_none" &&
      overData.projectId !== task.project_id;

    if (movedQuadrant) {
      updatePriority.mutate({ taskId: task.id, priority: targetPriority });
    }
    if (movedProject && overData.projectId) {
      updateTask.mutate({ id: task.id, patch: { project_id: overData.projectId } });
    }
  };

  const goToToday = () => navigate("/app/hoje");
  const toggleCompleted = () => setShowCompleted((v) => !v);
  const handleAdd = () => setShowQuickAdd((v) => !v);

  const renderQuadrant = (cfg: (typeof QUADRANTS)[number]) => {
    const bucket = byQuadrant[cfg.key];
    return (
      <EisenhowerQuadrant
        key={cfg.key}
        droppableId={`quad-${cfg.priority}`}
        theme={cfg.theme}
        open={bucket.open}
        done={bucket.done}
        projects={projects}
        showCompleted={showCompleted}
        onToggleCompleted={toggleCompleted}
        onGoToToday={goToToday}
        onAdd={cfg.key === "Q1" ? handleAdd : undefined}
        onOpenTask={setOpenTaskId}
        primary={cfg.key === "Q1"}
      />
    );
  };

  return (
    <main className="container mx-auto flex h-full max-w-7xl flex-col gap-3 px-3 py-4 md:px-4 md:py-5">
      <SEO
        title="Matriz de Eisenhower — Oxy Growth OS"
        description="Organize tarefas por urgência e importância em quatro quadrantes."
      />

      <header className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight md:text-xl">
          Matriz de Eisenhower
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Mais opções"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={toggleCompleted}>
              {showCompleted ? "Ocultar concluídas" : "Mostrar concluídas"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={goToToday}>Ir para hoje</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {showQuickAdd && (
        <div className="rounded-lg border bg-card p-2 shadow-soft">
          <QuickAdd />
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-label="Carregando" />
        </div>
      )}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar tarefas: {error.message}
        </Card>
      )}

      {!isLoading && !error && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveTask(null)}
        >
          {isMobile ? (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as QuadrantKey)}
              className="flex flex-1 flex-col gap-3"
            >
              <TabsList className="grid grid-cols-4">
                {QUADRANTS.map((q) => (
                  <TabsTrigger key={q.key} value={q.key} className="text-xs">
                    {q.theme.numeral}
                  </TabsTrigger>
                ))}
              </TabsList>
              {QUADRANTS.map((q) => (
                <TabsContent
                  key={q.key}
                  value={q.key}
                  className="flex-1 outline-none"
                >
                  {renderQuadrant(q)}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div
              role="grid"
              aria-label="Quadrantes Eisenhower"
              className={cn(
                "grid flex-1 grid-cols-2 grid-rows-2 gap-3 md:gap-4",
                "min-h-[calc(100vh-9rem)]",
              )}
            >
              {QUADRANTS.map(renderQuadrant)}
            </div>
          )}

          <DragOverlay>
            {activeTask && (
              <div className="rotate-1 cursor-grabbing rounded-md border bg-card px-3 py-2 text-sm shadow-lg ring-2 ring-primary">
                <p className="line-clamp-2 font-medium leading-snug">
                  {activeTask.title}
                </p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <TaskDetailSheet
        taskId={openTaskId}
        onOpenChange={(o) => !o && setOpenTaskId(null)}
      />
    </main>
  );
}
