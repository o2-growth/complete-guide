import { useState } from "react";
import {
  Archive,
  Check,
  ChevronDown,
  Flag,
  FolderKanban,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useBulkUpdateTasks, useTaskStatuses, type TaskPriority } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import { cn } from "@/lib/utils";

const PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: "urgent", label: "Urgente" },
  { value: "high", label: "Alta" },
  { value: "medium", label: "Média" },
  { value: "low", label: "Baixa" },
  { value: "none", label: "Nenhuma" },
];

/**
 * Toolbar fixa no rodapé que aparece quando >=1 tasks estão selecionadas.
 * Aplica patches em batch via useBulkUpdateTasks. Esc / botão X limpam seleção.
 */
export function BulkActionsToolbar() {
  const bulk = useBulkSelection();
  const ids = [...bulk.selectedIds];
  const bulkUpdate = useBulkUpdateTasks();
  const { data: statuses } = useTaskStatuses();
  const { data: projects } = useProjects();
  const { data: members } = useTenantMembers();
  const [pending, setPending] = useState<"archive" | "delete" | null>(null);

  if (!bulk.bulkMode) return null;

  const handlePatch = async (patch: Parameters<typeof bulkUpdate.mutateAsync>[0]["patch"]) => {
    await bulkUpdate.mutateAsync({ ids, patch });
  };

  const handleArchive = async () => {
    setPending("archive");
    await handlePatch({ archived: true });
    bulk.clear();
    setPending(null);
  };

  const handleDelete = async () => {
    // No domínio Oxy "Excluir" arquiva permanentemente — soft delete.
    setPending("delete");
    await handlePatch({ archived: true });
    bulk.clear();
    setPending(null);
  };

  return (
    <div
      role="toolbar"
      aria-label="Ações em massa"
      className={cn(
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-in fade-in-0 slide-in-from-bottom-4",
        "flex flex-wrap items-center gap-1 rounded-full border bg-card/95 px-3 py-2 shadow-elevated backdrop-blur",
        "motion-reduce:animate-none motion-reduce:transform-none",
      )}
    >
      <span className="px-2 text-sm font-medium tabular-nums" aria-live="polite">
        {bulk.count} {bulk.count === 1 ? "tarefa" : "tarefas"} selecionada{bulk.count === 1 ? "" : "s"}
      </span>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      {/* Mover para projeto */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <FolderKanban className="h-4 w-4" />
            Projeto
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="max-h-72 overflow-y-auto">
          <DropdownMenuLabel>Mover para…</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(projects ?? []).filter((p) => !p.archived).map((p) => (
            <DropdownMenuItem
              key={p.id}
              onClick={() => handlePatch({ project_id: p.id })}
            >
              {p.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Atribuir a */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <User className="h-4 w-4" />
            Responsável
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="max-h-72 overflow-y-auto">
          <DropdownMenuLabel>Atribuir a…</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handlePatch({ assignee_id: null })}>
            Sem responsável
          </DropdownMenuItem>
          {(members ?? []).map((m) => (
            <DropdownMenuItem
              key={m.id}
              onClick={() => handlePatch({ assignee_id: m.id })}
            >
              {m.display_name || m.full_name || m.email || "Membro"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Prioridade */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Flag className="h-4 w-4" />
            Prioridade
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          {PRIORITIES.map((p) => (
            <DropdownMenuItem
              key={p.value}
              onClick={() => handlePatch({ priority: p.value })}
            >
              {p.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Check className="h-4 w-4" />
            Status
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="max-h-72 overflow-y-auto">
          {(statuses ?? []).map((s) => (
            <DropdownMenuItem
              key={s.id}
              onClick={() =>
                handlePatch({
                  status_id: s.id,
                  done_at: s.is_done ? new Date().toISOString() : null,
                })
              }
            >
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color || "hsl(var(--muted-foreground))" }}
                aria-hidden
              />
              {s.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      {/* Arquivar (com confirm) */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5" disabled={pending !== null}>
            <Archive className="h-4 w-4" />
            Arquivar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar {bulk.count} tarefas?</AlertDialogTitle>
            <AlertDialogDescription>
              Tarefas arquivadas saem das listas ativas. Você pode restaurá-las depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Arquivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Excluir (alias de arquivar permanente — Supabase não deleta de fato). */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" disabled={pending !== null}>
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {bulk.count} tarefas?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove as tarefas das listas. Para preservar histórico, o sistema arquiva.
              Você pode restaurar a partir do log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      {/* Limpar seleção */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Limpar seleção"
        onClick={() => bulk.clear()}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
