import { useEffect, useMemo, useState } from "react";
import { addWeeks, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkloadHeatmap } from "@/components/workload/WorkloadHeatmap";
import { AssignmentMatrixPanel } from "@/components/workload/AssignmentMatrixPanel";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { useTenantMembers, useWorkloadTasks } from "@/hooks/useWorkload";
import { getWeekRange } from "@/components/workload/workload-utils";

export default function WorkloadPage() {
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = "Workload — Carga da equipe | Oxy Growth OS";
    return () => {
      document.title = prev;
    };
  }, []);

  const { days, from, to } = useMemo(() => getWeekRange(anchor), [anchor]);
  const { data: members, isLoading: lm } = useTenantMembers();
  const { data: tasks, isLoading: lt } = useWorkloadTasks(from, to);

  const weekLabel = `${format(days[0], "dd MMM", { locale: ptBR })} – ${format(days[6], "dd MMM yyyy", { locale: ptBR })}`;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" /> Insights
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Workload</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Carga semanal da equipe. Arraste tarefas entre células para realocar.
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

      <Tabs defaultValue="heatmap">
        <TabsList>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="matrix">Matriz de auto-assign</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap" className="mt-4">
          {(lm || lt) && (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          )}
          <WorkloadHeatmap
            days={days}
            members={members ?? []}
            tasks={tasks ?? []}
            onOpenTask={setOpenTaskId}
          />
          <Legend />
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <AssignmentMatrixPanel members={members ?? []} />
        </TabsContent>
      </Tabs>

      <TaskDetailSheet
        taskId={openTaskId}
        onOpenChange={(o) => !o && setOpenTaskId(null)}
      />
    </div>
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