import { KanbanSquare } from "lucide-react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { PageHeader } from "@/components/layout/PageHeader";

export default function KanbanPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader
        icon={KanbanSquare}
        title="Kanban"
        description="Arraste tarefas entre colunas. Mover por status dispara auto-assign quando a matriz estiver configurada."
      />

      <div className="min-h-0 flex-1">
        <KanbanBoard />
      </div>
    </div>
  );
}
