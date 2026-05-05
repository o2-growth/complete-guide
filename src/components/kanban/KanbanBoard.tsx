import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { Loader2, KanbanSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useKanbanTasks, useMoveTaskStatus, useTaskStatuses, type TaskRow } from "@/hooks/useTasks";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { KanbanColumn, type KanbanStatus } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

interface Props {
  projectId?: string | null;
}

export function KanbanBoard({ projectId }: Props) {
  const { data: statuses, isLoading: ls } = useTaskStatuses();
  const { data: tasks, isLoading: lt, error } = useKanbanTasks(projectId);
  const move = useMoveTaskStatus();

  const [openId, setOpenId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskRow | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const grouped = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    (statuses ?? []).forEach((s) => map.set(s.id, []));
    (tasks ?? []).forEach((t) => {
      if (!t.status_id) return;
      const arr = map.get(t.status_id);
      if (arr) arr.push(t);
    });
    return map;
  }, [statuses, tasks]);

  const findTask = (id: string) => (tasks ?? []).find((t) => t.id === id) ?? null;

  const onDragStart = (e: DragStartEvent) => {
    const t = findTask(String(e.active.id));
    setActiveTask(t);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const task = findTask(String(active.id));
    if (!task) return;

    // Pode soltar em uma coluna (status_id direto) ou em outro card
    const overData = over.data.current as { type?: string; status?: KanbanStatus; task?: TaskRow } | undefined;
    let destStatusId: string | null = null;
    if (overData?.type === "column" && overData.status) {
      destStatusId = overData.status.id;
    } else if (overData?.type === "task" && overData.task) {
      destStatusId = overData.task.status_id;
    }

    if (!destStatusId || destStatusId === task.status_id) return;

    moveToStatus(task.id, destStatusId);
  };

  const moveToStatus = (taskId: string, statusId: string) => {
    const destStatus = (statuses ?? []).find((s) => s.id === statusId);
    if (!destStatus) return;
    move.mutate({
      taskId,
      statusId,
      isDone: !!destStatus.is_done,
    });
  };

  if (ls || lt) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Erro ao carregar Kanban: {error.message}
      </Card>
    );
  }

  if (!statuses || statuses.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 border-dashed p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <KanbanSquare className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium">Nenhum status configurado</p>
          <p className="mt-1 text-xs text-muted-foreground">Crie status do fluxo de trabalho em Configurações.</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveTask(null)}
      >
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-3" style={{ minHeight: "calc(100vh - 220px)" }}>
            {statuses.map((s) => (
              <KanbanColumn
                key={s.id}
                status={s as KanbanStatus}
                tasks={grouped.get(s.id) ?? []}
                allStatuses={statuses as KanbanStatus[]}
                onOpen={setOpenId}
                onMoveToStatus={moveToStatus}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay>
          {activeTask ? (
            <div className="w-[284px]">
              <KanbanCard task={activeTask} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailSheet taskId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </>
  );
}