import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ProjectWithStats } from "@/hooks/useProjects";
import type { TaskRow } from "@/hooks/useTasks";
import { EisenhowerProjectGroup } from "./EisenhowerProjectGroup";
import { EisenhowerTaskRow } from "./EisenhowerTaskRow";

export interface QuadrantTheme {
  /** Romano: I, II, III, IV. */
  numeral: string;
  /** Título: "Urgente e Importante", etc. */
  title: string;
  /** Cor central (CSS color, ex: "hsl(var(--prio-urgent))"). */
  accent: string;
  /** background sutil do quadrante. */
  bgClass: string;
  /** ring on-drag. */
  ringClass: string;
}

interface EisenhowerQuadrantProps {
  droppableId: string;
  theme: QuadrantTheme;
  /** open por project_id. */
  open: Record<string, TaskRow[]>;
  done: TaskRow[];
  projects: ProjectWithStats[];
  showCompleted: boolean;
  onToggleCompleted: () => void;
  onGoToToday: () => void;
  onAdd?: () => void;
  onOpenTask: (id: string) => void;
  /** Q1 mostra "+ Adicionar" como ação principal. */
  primary?: boolean;
}

export function EisenhowerQuadrant({
  droppableId,
  theme,
  open,
  done,
  projects,
  showCompleted,
  onToggleCompleted,
  onGoToToday,
  onAdd,
  onOpenTask,
  primary,
}: EisenhowerQuadrantProps) {
  const [doneOpen, setDoneOpen] = useState(false);

  // Drop direto no quadrante (sem projeto específico) — não muda projeto.
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { type: "quadrant" },
  });

  const projectMap = useMemo(() => {
    const m = new Map<string, ProjectWithStats>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  // Ordenação: projetos com mais tarefas primeiro; "_none" (sem projeto) por último.
  const orderedProjectIds = useMemo(() => {
    return Object.keys(open).sort((a, b) => {
      if (a === "_none") return 1;
      if (b === "_none") return -1;
      return open[b].length - open[a].length;
    });
  }, [open]);

  const totalOpen = Object.values(open).reduce((acc, list) => acc + list.length, 0);
  const DoneIcon = doneOpen ? ChevronDown : ChevronRight;

  return (
    <section
      ref={setNodeRef}
      aria-label={`Quadrante ${theme.numeral} — ${theme.title}`}
      className={cn(
        "flex h-full min-h-[260px] flex-col overflow-hidden rounded-xl border bg-card shadow-soft transition-all",
        theme.bgClass,
        isOver && "ring-2 ring-offset-2",
        isOver && theme.ringClass,
      )}
    >
      <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-background"
          style={{ backgroundColor: theme.accent }}
          aria-hidden
        >
          {theme.numeral}
        </div>
        <h2 className="truncate text-sm font-semibold">{theme.title}</h2>
        <span className="ml-1 text-xs tabular-nums text-muted-foreground">
          {totalOpen}
        </span>

        <div className="ml-auto flex items-center gap-0.5">
          {primary && onAdd && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={onAdd}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          )}
          {!primary && onAdd && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onAdd}
              aria-label="Adicionar tarefa"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Mais opções"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onToggleCompleted}>
                {showCompleted ? "Ocultar concluídas" : "Mostrar concluídas"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onGoToToday}>Ir para hoje</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {totalOpen === 0 && (
            <p className="select-none px-2 py-8 text-center text-xs text-muted-foreground/70">
              Sem tarefas neste quadrante.
              <br />
              Solte tarefas aqui ou crie uma nova.
            </p>
          )}

          {orderedProjectIds.map((pid) => {
            const proj = pid !== "_none" ? projectMap.get(pid) : null;
            return (
              <EisenhowerProjectGroup
                key={pid}
                droppableId={`${droppableId}::proj-${pid}`}
                projectId={pid}
                projectName={proj?.name ?? null}
                projectColor={proj?.color ?? null}
                tasks={open[pid]}
                accent={theme.accent}
                onOpenTask={onOpenTask}
              />
            );
          })}

          {showCompleted && done.length > 0 && (
            <div className="mt-2 border-t border-border/50 pt-2">
              <button
                type="button"
                onClick={() => setDoneOpen((v) => !v)}
                className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs font-medium text-muted-foreground hover:bg-muted/60"
                aria-expanded={doneOpen}
              >
                <DoneIcon className="h-3.5 w-3.5" />
                Concluído
                <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/70">
                  {done.length}
                </span>
              </button>

              {doneOpen && (
                <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-border/40 pl-1.5">
                  {done.map((t) => (
                    <EisenhowerTaskRow
                      key={t.id}
                      task={t}
                      accent={theme.accent}
                      projectId={t.project_id}
                      projectName={projectMap.get(t.project_id)?.name ?? null}
                      onOpen={onOpenTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </section>
  );
}
