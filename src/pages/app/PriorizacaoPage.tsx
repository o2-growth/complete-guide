import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import SEO from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjects } from "@/hooks/useProjects";
import type { TaskRow } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

function scoreTone(score: number | null | undefined): string {
  if (score == null) return "bg-muted text-muted-foreground";
  if (score >= 600) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  if (score >= 300) return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  return "bg-slate-500/15 text-slate-600 dark:text-slate-400";
}

export default function PriorizacaoPage() {
  const { tenantId } = useWorkspace();
  const { data: projects } = useProjects();
  const [activeTask, setActiveTask] = useState<TaskRow | null>(null);
  const [search, setSearch] = useState("");

  const projectsById = useMemo(() => {
    const map = new Map<string, { name: string; color: string | null }>();
    (projects ?? []).forEach((p) => map.set(p.id, { name: p.name, color: p.color }));
    return map;
  }, [projects]);

  const query = useQuery({
    queryKey: ["priorizacao", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<TaskRow[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .is("done_at", null)
        .not("ice_score", "is", null)
        .order("ice_score", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as TaskRow[];
    },
  });

  const filtered = useMemo(() => {
    const all = query.data ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((t) => t.title.toLowerCase().includes(q));
  }, [query.data, search]);

  return (
    <div className="container mx-auto py-6">
      <SEO title="Priorização (ICE)" />
      <PageHeader
        title="Priorização"
        description="Tarefas ranqueadas por ICE Score (Impacto × Confiança × Facilidade)."
        icon={Sparkles}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar tarefa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> ≥ 600 (alto)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> 300–599 (médio)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-slate-500" /> &lt; 300 (baixo)
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-lg border bg-card">
        {query.isLoading ? (
          <div className="p-4">
            <ListSkeleton rows={8} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Nenhuma tarefa com ICE pontuada"
            description="Abra uma tarefa e preencha Impacto, Confiança e Facilidade pra ela entrar no ranking."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Tarefa</TableHead>
                <TableHead className="w-40">Projeto</TableHead>
                <TableHead className="w-12 text-center">I</TableHead>
                <TableHead className="w-12 text-center">C</TableHead>
                <TableHead className="w-12 text-center">E</TableHead>
                <TableHead className="w-20 text-center">Score</TableHead>
                <TableHead className="w-32">Vencimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t, idx) => {
                const project = projectsById.get(t.project_id);
                const due = t.due_at ? new Date(t.due_at) : null;
                const overdue = due ? isPast(due) : false;
                return (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => setActiveTask(t)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>
                      {project ? (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          {project.color && (
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ background: project.color }}
                            />
                          )}
                          <span className="truncate">{project.name}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{t.ice_impact ?? "—"}</TableCell>
                    <TableCell className="text-center tabular-nums">{t.ice_confidence ?? "—"}</TableCell>
                    <TableCell className="text-center tabular-nums">{t.ice_ease ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={cn("font-semibold", scoreTone(t.ice_score))}>
                        {t.ice_score}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {due ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs",
                            overdue ? "text-red-500" : "text-muted-foreground",
                          )}
                        >
                          {overdue ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <CalendarIcon className="h-3 w-3" />
                          )}
                          {format(due, "dd 'de' MMM", { locale: ptBR })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <TaskDetailSheet
        taskId={activeTask?.id ?? null}
        onOpenChange={(open) => !open && setActiveTask(null)}
      />
    </div>
  );
}
