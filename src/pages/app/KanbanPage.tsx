import { KanbanSquare } from "lucide-react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";

export default function KanbanPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KanbanSquare className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Kanban</h1>
          <p className="text-sm text-muted-foreground">
            Arraste tarefas entre colunas. Mover por status dispara auto-assign quando a matriz estiver configurada.
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <KanbanBoard />
      </div>
    </div>
  );
}