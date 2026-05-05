import { useEffect, useMemo, useState } from "react";
import { addWeeks, format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkloadHeatmap } from "@/components/workload/WorkloadHeatmap";
import { AssignmentMatrixPanel } from "@/components/workload/AssignmentMatrixPanel";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import {
  useReallocatableTasks,
  useReassignTask,
  useTeamWorkload,
  useTenantMembers,
  useWorkloadTasks,
  type TeamWorkloadMember,
  type WorkloadStatus,
  type WorkloadTask,
} from "@/hooks/useWorkload";
import { getWeekRange } from "@/components/workload/workload-utils";
import { cn } from "@/lib/utils";

const STATUS_CHIP: Record<WorkloadStatus, string> = {
  low: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  mid: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  high: "bg-amber-500/15 text-amber-700 ring-amber-500/40 dark:text-amber-300",
  overload: "bg-red-500/15 text-red-700 ring-red-500/40 dark:text-red-300",
};

const STATUS_LABEL: Record<WorkloadStatus, string> = {
  low: "Tranquilo",
  mid: "Saudável",
  high: "Cheio",
  overload: "Sobrecarregado",
};

function memberDisplay(m: TeamWorkloadMember) {
  return m.display_name || m.full_name || m.email || "Sem nome";
}

function memberInitials(m: TeamWorkloadMember) {
  const s = memberDisplay(m).trim();
  return s
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function fmtHours(min: number) {
  if (!min || min <= 0) return "0h";
  return `${(Math.round((min / 60) * 10) / 10).toFixed(1)}h`;
}

export default function WorkloadPage() {
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [scope, setScope] = useState<"current" | "next">("current");

  useEffect(() => {
    const prev = document.title;
    document.title = "Workload — Carga da equipe | Oxy Growth OS";
    return () => {
      document.title = prev;
    };
  }, []);

  const effectiveAnchor = useMemo(
    () => (scope === "current" ? anchor : addWeeks(anchor, 1)),
    [anchor, scope],
  );

  const { days, from, to } = useMemo(() => getWeekRange(effectiveAnchor), [effectiveAnchor]);
  const { data: heatmapMembers, isLoading: lm } = useTenantMembers();
  const { data: heatmapTasks, isLoading: lt } = useWorkloadTasks(from, to);
  const { data: team = [], isLoading: lteam } = useTeamWorkload(effectiveAnchor);

  const weekLabel = `${format(days[0], "dd MMM", { locale: ptBR })} – ${format(days[6], "dd MMM yyyy", { locale: ptBR })}`;

  const sortedTeam = useMemo(
    () => [...team].sort((a, b) => b.percentage - a.percentage),
    [team],
  );

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" /> Insights
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Workload</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Carga semanal por pessoa. Realocate tarefas entre membros sem sair daqui.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setAnchor((d) => addWeeks(d, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>
            Esta semana
          </Button>
          <Button variant="outline" size="icon" onClick={() => setAnchor((d) => addWeeks(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-2 hidden text-sm font-medium text-muted-foreground sm:inline">
            {weekLabel}
          </span>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border bg-muted/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => setScope("current")}
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-colors",
              scope === "current" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => setScope("next")}
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-colors",
              scope === "next" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            Próxima semana
          </button>
        </div>
        <ReallocateDialog members={sortedTeam} />
      </div>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Time</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="matrix">Matriz de auto-assign</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          {lteam && (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          )}
          {!lteam && sortedTeam.length === 0 && (
            <Card className="p-12 text-center">
              <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum membro neste workspace.</p>
            </Card>
          )}
          {sortedTeam.length > 0 && (
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left font-medium">Membro</th>
                    <th className="p-3 text-left font-medium">Carga semanal</th>
                    <th className="p-3 text-right font-medium">Abertas</th>
                    <th className="p-3 text-right font-medium">Atrasadas</th>
                    <th className="p-3 text-left font-medium">Próxima entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeam.map((m) => (
                    <TeamRow key={m.user_id} m={m} onOpenTask={setOpenTaskId} />
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="heatmap" className="mt-4">
          {(lm || lt) && (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          )}
          <WorkloadHeatmap
            days={days}
            members={heatmapMembers ?? []}
            tasks={heatmapTasks ?? []}
            onOpenTask={setOpenTaskId}
          />
          <Legend />
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <AssignmentMatrixPanel members={heatmapMembers ?? []} />
        </TabsContent>
      </Tabs>

      <TaskDetailSheet
        taskId={openTaskId}
        onOpenChange={(o) => !o && setOpenTaskId(null)}
      />
    </div>
  );
}

function TeamRow({
  m,
  onOpenTask,
}: {
  m: TeamWorkloadMember;
  onOpenTask: (id: string) => void;
}) {
  const display = memberDisplay(m);
  return (
    <tr className="border-t">
      <td className="p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {m.avatar_url && <AvatarImage src={m.avatar_url} alt={display} />}
            <AvatarFallback className="text-[10px]">{memberInitials(m)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{display}</div>
            <div className="text-[11px] capitalize text-muted-foreground">{m.role}</div>
          </div>
        </div>
      </td>
      <td className="p-3 align-middle">
        <div className="flex items-center gap-3">
          <div className="min-w-[140px] flex-1">
            <Progress
              value={Math.min(100, m.percentage)}
              className={cn(
                "h-2",
                m.status === "overload" && "[&>div]:bg-red-500",
                m.status === "high" && "[&>div]:bg-amber-500",
              )}
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {fmtHours(m.allocated_minutes_week)} / {fmtHours(m.capacity_minutes_week)}
              </span>
              <span>{m.percentage}%</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0 ring-1 ring-inset", STATUS_CHIP[m.status])}
          >
            {STATUS_LABEL[m.status]}
          </Badge>
        </div>
      </td>
      <td className="p-3 text-right tabular-nums">{m.open_tasks}</td>
      <td className="p-3 text-right tabular-nums">
        {m.overdue_tasks > 0 ? (
          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-300">
            <AlertTriangle className="h-3.5 w-3.5" /> {m.overdue_tasks}
          </span>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </td>
      <td className="p-3">
        {m.next_task_title && m.next_due_at ? (
          <button
            type="button"
            className="max-w-[260px] truncate text-left text-xs hover:underline"
            onClick={() => {
              // Tenta abrir a próxima task; precisamos do id — conservativo.
              const id = (m as TeamWorkloadMember & { next_task_id?: string }).next_task_id;
              if (id) onOpenTask(id);
            }}
            title={m.next_task_title}
          >
            <div className="truncate font-medium">{m.next_task_title}</div>
            <div className="text-[11px] text-muted-foreground">
              {formatDistanceToNowStrict(new Date(m.next_due_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </div>
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">Nenhuma</span>
        )}
      </td>
    </tr>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
      <span className="font-medium">Carga:</span>
      <Swatch className="bg-muted/30" label="vazio" />
      <Swatch className="bg-[hsl(var(--prio-low)/0.28)]" label="leve (<40%)" />
      <Swatch className="bg-[hsl(var(--prio-medium)/0.32)]" label="ok (40–80%)" />
      <Swatch className="bg-[hsl(var(--prio-high)/0.38)]" label="cheio (80–100%)" />
      <Swatch className="bg-[hsl(var(--prio-urgent)/0.42)]" label="overload (>100%)" />
    </div>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-5 rounded-sm border ${className}`} />
      {label}
    </span>
  );
}

/* --------------- Realocate dialog --------------- */

function ReallocateDialog({ members }: { members: TeamWorkloadMember[] }) {
  const [open, setOpen] = useState(false);
  const { data: tasks = [], isLoading } = useReallocatableTasks();
  const reassign = useReassignTask();
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [hoverMemberId, setHoverMemberId] = useState<string | null>(null);

  const now = Date.now();
  const overdue = tasks.filter((t) => t.due_at && new Date(t.due_at).getTime() < now);
  const upcoming = tasks.filter((t) => !t.due_at || new Date(t.due_at).getTime() >= now);

  const handleDrop = async (memberId: string) => {
    if (!draggingTaskId) return;
    const task = tasks.find((t) => t.id === draggingTaskId);
    if (!task) return;
    const target = members.find((m) => m.user_id === memberId);
    if (target && target.percentage >= 100) {
      // Warning, mas continua. Toast ainda assim.
      // Sonner: warning fica vermelho-amarelo via .warning
      const { toast } = await import("sonner");
      toast.warning(`${memberDisplay(target)} já está com ${target.percentage}% — realocando mesmo assim`);
    }
    await reassign.mutateAsync({
      taskId: task.id,
      assigneeId: memberId,
      currentDueAt: task.due_at,
    });
    setDraggingTaskId(null);
    setHoverMemberId(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Realocar tarefas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Realocar tarefas</DialogTitle>
          <DialogDescription>
            Arraste uma tarefa pra um membro pra mudar o responsável. Atrasadas vêm primeiro.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tarefas {overdue.length > 0 && `(${overdue.length} atrasadas)`}
            </h3>
            {isLoading && (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
              </div>
            )}
            <div className="max-h-[420px] space-y-1.5 overflow-auto pr-1">
              {overdue.map((t) => (
                <DraggableTaskCard
                  key={t.id}
                  task={t}
                  overdue
                  onDragStart={() => setDraggingTaskId(t.id)}
                  onDragEnd={() => setDraggingTaskId(null)}
                />
              ))}
              {upcoming.map((t) => (
                <DraggableTaskCard
                  key={t.id}
                  task={t}
                  overdue={false}
                  onDragStart={() => setDraggingTaskId(t.id)}
                  onDragEnd={() => setDraggingTaskId(null)}
                />
              ))}
              {!isLoading && tasks.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem tarefas para realocar.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Membros
            </h3>
            <div className="max-h-[420px] space-y-1.5 overflow-auto pr-1">
              {members.map((m) => (
                <div
                  key={m.user_id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoverMemberId(m.user_id);
                  }}
                  onDragLeave={() => setHoverMemberId((cur) => (cur === m.user_id ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(m.user_id);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-md border p-2 transition-colors",
                    hoverMemberId === m.user_id && "border-primary bg-primary/5",
                    m.status === "overload" && "border-red-500/30",
                  )}
                >
                  <Avatar className="h-8 w-8">
                    {m.avatar_url && <AvatarImage src={m.avatar_url} alt={memberDisplay(m)} />}
                    <AvatarFallback className="text-[10px]">{memberInitials(m)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{memberDisplay(m)}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {fmtHours(m.allocated_minutes_week)} / {fmtHours(m.capacity_minutes_week)} · {m.percentage}%
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("ring-1 ring-inset", STATUS_CHIP[m.status])}
                  >
                    {STATUS_LABEL[m.status]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DraggableTaskCard({
  task,
  overdue,
  onDragStart,
  onDragEnd,
}: {
  task: WorkloadTask;
  overdue: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "cursor-grab rounded-md border bg-background p-2 text-xs shadow-sm transition-colors hover:border-primary",
        overdue && "border-red-500/30 bg-red-500/5",
      )}
    >
      <div className="flex items-center gap-2">
        {task.code && (
          <span className="font-mono text-[10px] text-muted-foreground">{task.code}</span>
        )}
        <span className="line-clamp-2 flex-1 font-medium">{task.title}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {task.due_at
            ? formatDistanceToNowStrict(new Date(task.due_at), {
                addSuffix: true,
                locale: ptBR,
              })
            : "sem prazo"}
        </span>
        <span>{fmtHours(task.estimate_minutes ?? 0)}</span>
      </div>
    </div>
  );
}
