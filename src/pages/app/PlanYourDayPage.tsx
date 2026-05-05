import { useEffect, useMemo, useRef, useState } from "react";
import * as chrono from "chrono-node";
import {
  Sunrise,
  Check,
  CalendarClock,
  SkipForward,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DueDateLabel } from "@/components/tasks/DueDateLabel";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { queryProfile } from "@/lib/query-config";
import {
  useToggleTaskDone,
  useDeleteTask,
  useRescheduleTask,
  type TaskRow,
} from "@/hooks/useTasks";
import { useConfetti } from "@/hooks/useConfetti";

const PRIORITY_RANK: Record<TaskRow["priority"], number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

interface ProjectMini {
  id: string;
  name: string;
}

function usePlanTasks() {
  const { user } = useAuth();
  const { tenantId, loading: wsLoading } = useWorkspace();
  return useQuery({
    ...queryProfile("workload"),
    queryKey: ["plan-day-tasks", user?.id, tenantId],
    enabled: !!user && !wsLoading && !!tenantId,
    queryFn: async (): Promise<TaskRow[]> => {
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .is("done_at", null)
        .not("due_at", "is", null)
        .lte("due_at", todayEnd.toISOString())
        .order("due_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      const rows = (data ?? []) as TaskRow[];
      // Reordena: prioridade desc, due_at asc.
      return rows.sort((a, b) => {
        const pa = PRIORITY_RANK[a.priority];
        const pb = PRIORITY_RANK[b.priority];
        if (pa !== pb) return pb - pa;
        const da = a.due_at ? new Date(a.due_at).getTime() : Infinity;
        const db = b.due_at ? new Date(b.due_at).getTime() : Infinity;
        return da - db;
      });
    },
  });
}

function useProjectsMap(ids: string[]) {
  const { tenantId } = useWorkspace();
  return useQuery({
    ...queryProfile("structural"),
    queryKey: ["plan-day-projects", tenantId, [...new Set(ids)].sort().join(",")],
    enabled: !!tenantId && ids.length > 0,
    queryFn: async (): Promise<Record<string, ProjectMini>> => {
      const unique = Array.from(new Set(ids));
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .in("id", unique);
      if (error) throw error;
      const map: Record<string, ProjectMini> = {};
      (data ?? []).forEach((p) => (map[p.id] = p as ProjectMini));
      return map;
    },
  });
}

function ReschedulePopover({
  task,
  onScheduled,
}: {
  task: TaskRow;
  onScheduled: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("amanhã 9h");
  const reschedule = useRescheduleTask();
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => {
    const r = chrono.pt.parse(text, new Date(), { forwardDate: true });
    if (r.length === 0) return null;
    return r[0].start.date();
  }, [text]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const handleReschedule = async () => {
    if (!parsed) return;
    await reschedule.mutateAsync({
      taskId: task.id,
      newDate: parsed,
      currentDueAt: task.due_at,
      keepTime: false,
    });
    setOpen(false);
    onScheduled();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-auto flex-col gap-1 border-2 border-primary/30 bg-primary/5 px-4 py-4 text-primary hover:bg-primary/10 hover:text-primary"
          aria-label="Reagendar (atalho 2)"
        >
          <CalendarClock className="h-5 w-5" />
          <span className="text-sm font-semibold">Reagendar</span>
          <span className="text-[10px] font-normal opacity-70">2</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="center">
        <div className="space-y-2">
          <p className="text-xs font-medium">Quando reagendar?</p>
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="amanhã 14h, sexta, dia 30"
            onKeyDown={(e) => {
              if (e.key === "Enter" && parsed) {
                e.preventDefault();
                handleReschedule();
              }
            }}
          />
          <p className="text-[11px] text-muted-foreground">
            {parsed
              ? `Para ${parsed.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`
              : "Não consegui entender — tente 'amanhã 9h' ou 'sexta'."}
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              type="button"
              disabled={!parsed || reschedule.isPending}
              onClick={handleReschedule}
            >
              {reschedule.isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              Confirmar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function PlanYourDayPage() {
  const { data: tasks = [], isLoading, error } = usePlanTasks();
  const projectIds = useMemo(() => tasks.map((t) => t.project_id), [tasks]);
  const { data: projectMap = {} } = useProjectsMap(projectIds);

  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const fireConfetti = useConfetti();

  const toggleDone = useToggleTaskDone();
  const deleteTask = useDeleteTask();

  const total = tasks.length;
  const current = tasks[index] ?? null;

  const advance = () => {
    if (index + 1 >= total) {
      setDone(true);
      fireConfetti(undefined, undefined, 80);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    setDone(false);
    setIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    if (index + 1 < total) setIndex((i) => i + 1);
  };

  const handleConclude = async () => {
    if (!current) return;
    await toggleDone.mutateAsync(current);
    advance();
  };

  const handleSkip = () => {
    advance();
  };

  const handleDelete = async () => {
    if (!current) return;
    if (!window.confirm(`Excluir "${current.title}"? Pode desfazer no toast.`)) return;
    await deleteTask.mutateAsync(current.id);
    advance();
  };

  // Atalhos teclado: 1/2/3/4 + setas
  useEffect(() => {
    if (!current || done) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (e.key === "1") {
        e.preventDefault();
        handleConclude();
      } else if (e.key === "3") {
        e.preventDefault();
        handleSkip();
      } else if (e.key === "4") {
        e.preventDefault();
        handleDelete();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, done, index, total]);

  // Reseta quando os dados mudam.
  useEffect(() => {
    if (index >= total && total > 0) setIndex(total - 1);
    if (total === 0) {
      setIndex(0);
      setDone(false);
    }
  }, [total, index]);

  return (
    <main className="container mx-auto flex max-w-3xl flex-col gap-4 px-3 py-4 md:px-4 md:py-6">
      <SEO
        title="Plano do dia — Oxy Growth OS"
        description="Decida tarefa por tarefa: conclua, reagende, pule ou exclua."
      />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-brand">
            <Sunrise className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Plano do dia</h1>
            <p className="text-sm text-muted-foreground">
              Decida o destino de cada tarefa atrasada ou pra hoje.
            </p>
          </div>
        </div>
      </header>

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

      {!isLoading && !error && total === 0 && (
        <EmptyState
          icon={Sparkles}
          title="Nada atrasado nem pra hoje"
          description="Aproveita. Você está em dia."
        />
      )}

      {!isLoading && !error && total > 0 && done && (
        <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-brand">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold">Tudo pronto.</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Você passou por todas as {total} tarefas. Bom dia produtivo!
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDone(false);
              setIndex(0);
            }}
          >
            Revisar de novo
          </Button>
        </Card>
      )}

      {!isLoading && !error && total > 0 && !done && current && (
        <>
          <div className="flex items-center gap-3">
            <Progress value={((index + 1) / total) * 100} aria-label="Progresso" className="h-2" />
            <span
              className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground"
              aria-live="polite"
            >
              {index + 1} de {total}
            </span>
          </div>

          <Card className="relative flex flex-col gap-4 p-5 md:p-8">
            <div className="absolute right-3 top-3 flex gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={goPrev}
                disabled={index === 0}
                aria-label="Tarefa anterior"
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={goNext}
                disabled={index + 1 >= total}
                aria-label="Próxima tarefa"
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pr-16">
              {current.code && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  {current.code}
                </Badge>
              )}
              {current.priority !== "none" && (
                <Badge
                  className={cn(
                    "text-[10px]",
                    current.priority === "urgent" && "bg-[hsl(var(--prio-urgent))]/15 text-[hsl(var(--prio-urgent))] hover:bg-[hsl(var(--prio-urgent))]/20",
                    current.priority === "high" && "bg-[hsl(var(--prio-high))]/15 text-[hsl(var(--prio-high))] hover:bg-[hsl(var(--prio-high))]/20",
                    current.priority === "medium" && "bg-[hsl(var(--prio-medium))]/15 text-[hsl(var(--prio-medium))] hover:bg-[hsl(var(--prio-medium))]/20",
                    current.priority === "low" && "bg-[hsl(var(--prio-low))]/15 text-[hsl(var(--prio-low))] hover:bg-[hsl(var(--prio-low))]/20",
                  )}
                  variant="secondary"
                >
                  {current.priority}
                </Badge>
              )}
              {projectMap[current.project_id] && (
                <Badge variant="secondary" className="text-[10px]">
                  {projectMap[current.project_id].name}
                </Badge>
              )}
            </div>

            <h2 className="text-xl font-bold leading-tight md:text-2xl">{current.title}</h2>

            {current.due_at && (
              <p className="text-sm text-muted-foreground">
                Vencia <DueDateLabel due={current.due_at} />
              </p>
            )}

            {current.description && (
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {current.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 md:grid-cols-4">
              <Button
                type="button"
                size="lg"
                onClick={handleConclude}
                disabled={toggleDone.isPending}
                className="h-auto flex-col gap-1 bg-success px-4 py-4 text-success-foreground hover:bg-success/90"
                aria-label="Concluir agora (atalho 1)"
              >
                <Check className="h-5 w-5" />
                <span className="text-sm font-semibold">Concluir</span>
                <span className="text-[10px] font-normal opacity-80">1</span>
              </Button>
              <ReschedulePopover task={current} onScheduled={advance} />
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={handleSkip}
                className="h-auto flex-col gap-1 border-2 px-4 py-4"
                aria-label="Pular hoje (atalho 3)"
              >
                <SkipForward className="h-5 w-5" />
                <span className="text-sm font-semibold">Pular</span>
                <span className="text-[10px] font-normal opacity-70">3</span>
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={handleDelete}
                disabled={deleteTask.isPending}
                className="h-auto flex-col gap-1 border-2 border-destructive/30 bg-destructive/5 px-4 py-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label="Excluir tarefa (atalho 4)"
              >
                <Trash2 className="h-5 w-5" />
                <span className="text-sm font-semibold">Excluir</span>
                <span className="text-[10px] font-normal opacity-70">4</span>
              </Button>
            </div>

            <p className="text-center text-[11px] text-muted-foreground/70">
              Use 1 / 2 / 3 / 4 ou ← / → pra navegar.
            </p>
          </Card>
        </>
      )}
    </main>
  );
}
