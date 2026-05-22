import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  MessageSquare,
  Settings,
  LayoutGrid,
  ListTodo,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useRecentTasks } from "@/hooks/useRecentTasks";
import { useProjects } from "@/hooks/useProjects";
import { MyWorkPanel } from "@/components/tasks/MyWorkPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/SEO";

export default function InicioPage() {
  const { user } = useAuth();
  const { data: recentTasks = [] } = useRecentTasks(8);
  const { data: projects = [] } = useProjects();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    document.title = "Minhas tarefas — Oxy Growth OS";
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

  const projectsById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const firstName = displayName ? displayName.split(" ")[0] : "";

  return (
    <div className="flex h-full flex-col">
      <SEO title="Minhas tarefas" />

      {/* Header — "Minhas tarefas" + ações topo direito (igual print 2) */}
      <header className="border-b px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Minhas tarefas</span>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-7">
              <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
              Gerenciar cartões
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Saudação */}
      <div className="px-6 pt-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}
          {firstName ? `, ${firstName}` : ""}
        </h1>
      </div>

      {/* Grid 2x2 de cartões */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-2">
          {/* Card 1 — Recentes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5">
              {recentTasks.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Suas tarefas e listas recentes vão aparecer aqui.
                </p>
              ) : (
                recentTasks.map((t) => {
                  const proj = t.project_id ? projectsById.get(t.project_id) : null;
                  return (
                    <Link
                      key={t.id}
                      to={`/app/tarefas/${t.id}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                    >
                      <ListTodo className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{t.title}</span>
                      {proj && (
                        <span className="truncate text-xs text-muted-foreground">
                          · em {proj.name}
                        </span>
                      )}
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Card 2 — Agenda */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                Agenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">
                  Conecte seu calendário para ver os próximos eventos e entrar na sua próxima chamada.
                </p>
                <div className="mt-1 w-full space-y-1.5">
                  <Button asChild variant="outline" size="sm" className="w-full justify-between">
                    <Link to="/app/configuracoes/integracoes">
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded bg-[#4285F4]" />
                        Google Agenda
                      </span>
                      <span className="text-xs text-primary">Conectar</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full justify-between">
                    <Link to="/app/configuracoes/integracoes">
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded bg-[#0078D4]" />
                        Microsoft Outlook
                      </span>
                      <span className="text-xs text-primary">Conectar</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3 — Meu trabalho */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                Meu trabalho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MyWorkPanel compact />
            </CardContent>
          </Card>

          {/* Card 4 — Comentários atribuídos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                Comentários atribuídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">
                  Você não tem comentários atribuídos.{" "}
                  <Link to="/app/comentarios-atribuidos" className="text-primary hover:underline">
                    Saiba mais
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
