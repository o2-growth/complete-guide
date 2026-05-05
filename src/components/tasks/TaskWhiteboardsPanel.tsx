import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Palette, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useWhiteboards,
  useCreateWhiteboard,
} from "@/hooks/useWhiteboards";

interface TaskWhiteboardsPanelProps {
  taskId: string;
  projectId?: string | null;
}

export function TaskWhiteboardsPanel({ taskId, projectId }: TaskWhiteboardsPanelProps) {
  const navigate = useNavigate();
  const { data: boards = [], isLoading } = useWhiteboards({ taskId });
  const createWb = useCreateWhiteboard();

  const handleCreate = async () => {
    const created = await createWb.mutateAsync({
      name: "Whiteboard da tarefa",
      taskId,
      projectId: projectId ?? null,
    });
    navigate(`/app/whiteboards/${created.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Diagrame, faça brainstorm ou rascunhe diretamente vinculado a esta tarefa.
        </p>
        <Button size="sm" onClick={handleCreate} disabled={createWb.isPending}>
          {createWb.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Criar whiteboard
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : boards.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          <Palette className="mx-auto mb-2 h-6 w-6 opacity-60" />
          Nenhum whiteboard vinculado a esta tarefa.
        </div>
      ) : (
        <ul className="space-y-2">
          {boards.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => navigate(`/app/whiteboards/${b.id}`)}
                className="group flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:bg-muted/30"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Palette className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium group-hover:underline">
                    {b.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Atualizado{" "}
                    {formatDistanceToNow(new Date(b.updated_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
