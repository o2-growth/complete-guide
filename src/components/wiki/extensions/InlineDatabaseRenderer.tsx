import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Database, LayoutGrid, ListTodo, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskRow as TaskRowItem } from "@/components/tasks/TaskRow";
import { TaskGalleryView } from "@/components/tasks/views/TaskGalleryView";
import { TaskChartView } from "@/components/tasks/views/TaskChartView";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { TaskRow } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

export type InlineDatabaseKind = "tasks" | "wiki" | "tickets";
export type InlineDatabaseViewMode = "list" | "gallery" | "chart";

export interface InlineDatabaseFilter {
  /** Filtro por projeto (UUID). */
  project_id?: string | null;
  /** Filtro por responsável (UUID). */
  assignee_id?: string | null;
  /** Filtro por prioridade. */
  priority?: TaskRow["priority"] | null;
  /** Apenas tasks pendentes (done_at IS NULL). */
  only_open?: boolean;
  /** Limite de rows. */
  limit?: number;
}

export interface InlineDatabaseConfig {
  kind: InlineDatabaseKind;
  filter: InlineDatabaseFilter;
  view_mode: InlineDatabaseViewMode;
  view_config?: Record<string, unknown>;
}

interface Props {
  config: InlineDatabaseConfig;
  isEditing?: boolean;
  onEditConfig?: () => void;
}

function useInlineTasks(filter: InlineDatabaseFilter) {
  const { tenantId, loading } = useWorkspace();

  return useQuery({
    queryKey: ["inline-database-tasks", tenantId, filter],
    enabled: !loading && !!tenantId,
    queryFn: async (): Promise<TaskRow[]> => {
      let q = supabase
        .from("tasks")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(filter.limit ?? 50);

      if (filter.project_id) q = q.eq("project_id", filter.project_id);
      if (filter.assignee_id) q = q.eq("assignee_id", filter.assignee_id);
      if (filter.priority) q = q.eq("priority", filter.priority);
      if (filter.only_open) q = q.is("done_at", null);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TaskRow[];
    },
  });
}

function ViewIcon({ mode }: { mode: InlineDatabaseViewMode }) {
  if (mode === "gallery") return <LayoutGrid className="h-3.5 w-3.5" />;
  if (mode === "chart") return <BarChart3 className="h-3.5 w-3.5" />;
  return <ListTodo className="h-3.5 w-3.5" />;
}

export function InlineDatabaseRenderer({ config, isEditing, onEditConfig }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  // MVP: tasks only.
  if (config.kind !== "tasks") {
    return (
      <Card className="border-dashed p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span>
            Database <strong>{config.kind}</strong> ainda não suportado inline.
          </span>
        </div>
      </Card>
    );
  }

  // Em modo edição mostra placeholder com botão "Editar config" — clique no
  // próprio container abre tudo, mas evita render pesado pra cada keystroke.
  if (isEditing) {
    return (
      <Card
        className="cursor-pointer border-dashed bg-muted/30 p-4 transition hover:bg-muted/50"
        role="button"
        onClick={onEditConfig}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <ViewIcon mode={config.view_mode} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Database de tasks</span>
              <Badge variant="outline" className="text-[10px]">
                {config.view_mode === "list"
                  ? "Lista"
                  : config.view_mode === "gallery"
                    ? "Galeria"
                    : "Gráfico"}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {Object.keys(config.filter ?? {}).length === 0
                ? "Sem filtros (todas as tarefas do tenant)"
                : Object.entries(config.filter ?? {})
                    .filter(([, v]) => v !== null && v !== undefined && v !== "")
                    .map(([k, v]) => `${k}: ${String(v)}`)
                    .join(" • ")}
            </p>
          </div>
          <Button size="sm" variant="ghost" className="gap-1" onClick={onEditConfig}>
            <Settings className="h-3.5 w-3.5" /> Configurar
          </Button>
        </div>
      </Card>
    );
  }

  return <InlineTasksView config={config} openId={openId} setOpenId={setOpenId} />;
}

function InlineTasksView({
  config,
  openId,
  setOpenId,
}: {
  config: InlineDatabaseConfig;
  openId: string | null;
  setOpenId: (id: string | null) => void;
}) {
  const { data: tasks = [], isLoading } = useInlineTasks(config.filter);

  const limited = useMemo(() => tasks.slice(0, config.filter.limit ?? 50), [tasks, config.filter.limit]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (config.view_mode === "gallery") {
    return (
      <div className={cn("rounded-md border p-3")}>
        <div className="mb-2 flex items-center justify-between">
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Database className="h-3 w-3" /> {limited.length} tarefa(s)
          </Badge>
        </div>
        <TaskGalleryView
          tasks={limited}
          emptyTitle="Sem tarefas"
          emptyDescription="Nada bate com este filtro."
        />
      </div>
    );
  }

  if (config.view_mode === "chart") {
    return (
      <div className="rounded-md border p-3">
        <div className="mb-2 flex items-center justify-between">
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Database className="h-3 w-3" /> {limited.length} tarefa(s)
          </Badge>
        </div>
        <TaskChartView tasks={limited} compact height={260} />
      </div>
    );
  }

  // list mode
  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Database className="h-3 w-3" /> {limited.length} tarefa(s)
        </Badge>
      </div>
      {limited.length === 0 ? (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
          Sem tarefas neste recorte.
        </div>
      ) : (
        <div className="divide-y">
          {limited.map((t) => (
            <TaskRowItem key={t.id} task={t} onOpen={setOpenId} />
          ))}
        </div>
      )}
      <TaskDetailSheet taskId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  );
}
