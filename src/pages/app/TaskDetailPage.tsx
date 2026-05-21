import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskDetailContent } from "@/components/tasks/TaskDetailSheet";
import SEO from "@/components/SEO";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="p-8 text-sm text-muted-foreground">Tarefa não encontrada.</div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
      <SEO title="Detalhe da tarefa" />
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        <Button variant="link" size="sm" className="text-xs text-muted-foreground" asChild>
          <Link to="/app/inicio">Início</Link>
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto">
        <TaskDetailContent taskId={id} />
      </div>
    </div>
  );
}
