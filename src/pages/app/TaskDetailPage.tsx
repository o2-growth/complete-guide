import { Link, useNavigate, useParams } from "react-router-dom";
import { X, Share2, Sparkles, MoreHorizontal, ChevronRight, PanelRightClose, PanelRightOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TaskDetailContent } from "@/components/tasks/TaskDetailSheet";
import { ActivityPanel } from "@/components/tasks/ActivityPanel";
import { useTask } from "@/hooks/useTaskDetail";
import { useProjects } from "@/hooks/useProjects";
import SEO from "@/components/SEO";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task } = useTask(id ?? null);
  const { data: projects = [] } = useProjects();
  const [activityOpen, setActivityOpen] = useState(true);

  if (!id) {
    return (
      <div className="p-8 text-sm text-muted-foreground">Tarefa não encontrada.</div>
    );
  }

  const project = task?.project_id
    ? projects.find((p) => p.id === task.project_id)
    : null;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
      <SEO title={task?.title || "Detalhe da tarefa"} />

      {/* Header rico estilo print 4 */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <div className="flex min-w-0 items-center gap-1.5">
          {project ? (
            <Link
              to={`/app/projetos/${project.id}`}
              className="inline-flex items-center gap-1.5 truncate rounded px-1.5 py-0.5 text-sm hover:bg-accent"
            >
              {project.color && (
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: project.color }}
                />
              )}
              <span className="truncate">{project.name}</span>
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">Tarefa</span>
          )}
          {task?.code && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              <span className="font-mono text-xs text-muted-foreground">{task.code}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {task?.created_at && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Criada {formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Link to="/app/genio">
                  <Sparkles className="h-3.5 w-3.5" /> Pergunte à IA
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir o Gênio</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Share2 className="h-3.5 w-3.5" /> Compartilhar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setActivityOpen((v) => !v)}
            aria-label={activityOpen ? "Esconder atividade" : "Mostrar atividade"}
          >
            {activityOpen ? (
              <PanelRightClose className="h-3.5 w-3.5" />
            ) : (
              <PanelRightOpen className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => navigate(-1)}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <TaskDetailContent taskId={id} />
        </div>
        {activityOpen && (
          <aside className="hidden w-[380px] shrink-0 lg:flex">
            <ActivityPanel taskId={id} />
          </aside>
        )}
      </div>
    </div>
  );
}
