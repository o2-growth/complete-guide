import { useState } from "react";
import { ChevronDown, ChevronRight, Inbox } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { TaskRow } from "@/hooks/useTasks";
import { EisenhowerTaskRow } from "./EisenhowerTaskRow";

interface EisenhowerProjectGroupProps {
  /** id sintético usado pelo droppable (`quad-{prio}::proj-{projectId}`). */
  droppableId: string;
  projectId: string;
  projectName: string | null;
  projectColor?: string | null;
  tasks: TaskRow[];
  accent: string;
  onOpenTask: (id: string) => void;
  defaultOpen?: boolean;
}

/**
 * Sub-header de projeto dentro de um quadrante: clicável para colapsar,
 * com contador. Recebe o drop pra mover tasks pra esse project_id.
 */
export function EisenhowerProjectGroup({
  droppableId,
  projectId,
  projectName,
  projectColor,
  tasks,
  accent,
  onOpenTask,
  defaultOpen = true,
}: EisenhowerProjectGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { type: "project", projectId },
  });

  const Icon = open ? ChevronDown : ChevronRight;
  const isInbox = !projectName;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md transition-colors",
        isOver && "bg-primary/5 ring-1 ring-primary/40",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60"
        aria-expanded={open}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {projectColor ? (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: projectColor }}
            aria-hidden
          />
        ) : isInbox ? (
          <Inbox className="h-3 w-3 shrink-0" aria-hidden />
        ) : null}
        <span className="truncate">{projectName ?? "Caixa de entrada"}</span>
        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/70">
          {tasks.length}
        </span>
      </button>

      {open && (
        <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-border/40 pl-1.5">
          {tasks.map((t) => (
            <EisenhowerTaskRow
              key={t.id}
              task={t}
              accent={accent}
              projectId={projectId}
              projectName={projectName}
              onOpen={onOpenTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
