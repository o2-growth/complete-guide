import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, ArrowRight, Sparkles, Plug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { TaskListGrouped } from "@/components/tasks/TaskListGrouped";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import DailyFocusCard from "@/components/ai/DailyFocusCard";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";

const AppHome = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const { allDone: onboardingDone } = useOnboardingChecklist();

  const { data: tasks = [], isLoading: tasksLoading } = useTasks("assigned");
  const { data: projects = [] } = useProjects();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const pipefyProjects = useMemo(
    () => projects.filter((p) => p.pipefy_card_id).slice(0, 6),
    [projects],
  );

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name ?? ""));
  }, [user]);

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
              <Sparkles className="mr-1.5 h-3 w-3" /> Painel de trabalho
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">
              {displayName ? `Olá, ${displayName}` : "Bem-vindo"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Suas tarefas em aberto + projetos puxados do Pipefy. Crie no campo abaixo ou
              clique numa linha pra editar.
            </p>
          </div>
        </div>

        <QuickAdd />

        {onboardingDone && <DailyFocusCard />}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Minhas tarefas em aberto
              </h2>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link to="/app/atribuidas">
                  Ver todas <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            {tasksLoading ? (
              <ListSkeleton rows={6} />
            ) : (
              <TaskListGrouped
                tasks={tasks}
                onOpen={(id) => setOpenTaskId(id)}
                scope="home"
              />
            )}
          </section>

          <aside className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Projetos do Pipefy
              </h2>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link to="/app/projetos?source=pipefy">
                  Ver todos <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>

            {pipefyProjects.length === 0 ? (
              <Card className="p-4 text-center">
                <Plug className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Nenhum projeto sincronizado ainda.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link to="/app/configuracoes/integracoes/pipefy">Configurar</Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-2">
                {pipefyProjects.map((p) => (
                  <Card key={p.id} className="p-3 hover:bg-accent/40 transition-colors">
                    <Link to={`/app/projetos/${p.id}`} className="block min-w-0">
                      <div className="flex items-start gap-2">
                        {p.color && (
                          <span
                            className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
                            style={{ background: p.color }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          {p.pipefy_phase_name && (
                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                              {p.pipefy_phase_name}
                            </p>
                          )}
                        </div>
                        {p.pipefy_url && (
                          <a
                            href={p.pipefy_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Abrir no Pipefy"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>

      <TaskDetailSheet
        taskId={openTaskId}
        onOpenChange={(open) => !open && setOpenTaskId(null)}
      />
    </div>
  );
};

export default AppHome;
