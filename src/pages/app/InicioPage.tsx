import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useRecentPages } from "@/hooks/useRecentPages";
import { useProjects } from "@/hooks/useProjects";
import { MyWorkPanel } from "@/components/tasks/MyWorkPanel";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/SEO";

export default function InicioPage() {
  const { user } = useAuth();
  const { recents: recentNav } = useRecentPages();
  const { data: projects = [] } = useProjects();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    document.title = "Início — Oxy Growth OS";
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name || data?.full_name || "");
      });
  }, [user]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const recentProjects = useMemo(
    () =>
      projects
        .filter((p) => !p.archived)
        .slice(0, 6),
    [projects],
  );

  return (
    <div className="flex h-full flex-col">
      <SEO title="Início" />
      <header className="border-b bg-background/80 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting}
              {displayName ? `, ${displayName.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <CreateTaskModal
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nova tarefa
              </Button>
            }
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Meu trabalho
              </h2>
              <MyWorkPanel />
            </section>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-primary" /> Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {recentNav.length === 0 && recentProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nada recente ainda.</p>
                ) : (
                  <>
                    {recentNav.slice(0, 5).map((r) => (
                      <Link
                        key={r.path}
                        to={r.path}
                        className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        {r.path.replace("/app/", "").replace(/\//g, " · ") || "Página"}
                      </Link>
                    ))}
                    {recentProjects.map((p) => (
                      <Link
                        key={p.id}
                        to={`/app/projetos/${p.id}`}
                        className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        {p.name}
                        {p.pipefy_card_id && (
                          <span className="ml-1 text-[10px] text-primary">· Pipefy</span>
                        )}
                      </Link>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" /> Agenda
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p className="mb-3">
                  Conecte seu calendário para ver os próximos eventos na Início.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/app/configuracoes/integracoes">Configurar integrações</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex gap-3 py-4">
                <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                <div className="text-sm">
                  <p className="font-medium">Foco e priorização</p>
                  <p className="text-muted-foreground">Pomodoro, Eisenhower e ICE na barra de ferramentas.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" asChild>
                      <Link to="/app/foco">Foco</Link>
                    </Button>
                    <Button size="sm" variant="secondary" asChild>
                      <Link to="/app/eisenhower">Eisenhower</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
