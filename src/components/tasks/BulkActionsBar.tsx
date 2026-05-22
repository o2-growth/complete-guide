import { useMemo } from "react";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  Copy,
  Flag,
  FolderInput,
  MoreHorizontal,
  Tag,
  Trash2,
  Users,
  Wand2,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import { useTaskStatuses } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const PRIORITIES = [
  { value: "urgent", label: "Urgente", color: "text-[hsl(var(--prio-urgent))]" },
  { value: "high", label: "Alta", color: "text-[hsl(var(--prio-high))]" },
  { value: "medium", label: "Média", color: "text-[hsl(var(--prio-medium))]" },
  { value: "low", label: "Baixa", color: "text-[hsl(var(--prio-low))]" },
  { value: "none", label: "Nenhuma", color: "text-muted-foreground" },
] as const;

export function BulkActionsBar() {
  const { selectedIds, count, clear, bulkMode } = useBulkSelection();
  const { data: members = [] } = useTenantMembers();
  const { data: statuses = [] } = useTaskStatuses();
  const { data: projects = [] } = useProjects();
  const qc = useQueryClient();

  const ids = useMemo(() => Array.from(selectedIds), [selectedIds]);

  if (!bulkMode) return null;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["project-tasks"] });
    qc.invalidateQueries({ queryKey: ["tasks-for-projects"] });
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["project-open-counts"] });
    clear();
  };

  const updateMany = async (
    patch: Record<string, unknown>,
    successMsg: string,
  ) => {
    const { error } = await supabase.from("tasks").update(patch).in("id", ids);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(successMsg);
    refresh();
  };

  const setStatus = (id: string) => updateMany({ status_id: id }, `Status atualizado em ${count} tarefa(s)`);
  const setPriority = (value: string) =>
    updateMany({ priority: value }, `Prioridade atualizada em ${count} tarefa(s)`);
  const assign = (userId: string) =>
    updateMany({ assignee_id: userId }, `Responsável atualizado em ${count} tarefa(s)`);
  const setDue = (date: Date | undefined) =>
    updateMany({ due_at: date?.toISOString() ?? null }, `Vencimento atualizado em ${count} tarefa(s)`);
  const moveTo = (projectId: string) =>
    updateMany({ project_id: projectId }, `${count} tarefa(s) movida(s)`);

  const markDone = () =>
    updateMany({ done_at: new Date().toISOString() }, `${count} tarefa(s) concluída(s)`);
  const archive = () => updateMany({ archived: true }, `${count} tarefa(s) arquivada(s)`);

  const duplicate = async () => {
    // Busca os registros completos e re-insere com novos ids.
    const { data: srcs, error: selErr } = await supabase
      .from("tasks")
      .select("*")
      .in("id", ids);
    if (selErr || !srcs) {
      toast.error(selErr?.message ?? "Erro ao copiar");
      return;
    }
    const copies = srcs.map((t) => {
      const { id, code, created_at, updated_at, done_at, ...rest } = t as Record<string, unknown> & {
        id: string;
        code: string | null;
        created_at: string;
        updated_at: string;
        done_at: string | null;
      };
      void id;
      void code;
      void created_at;
      void updated_at;
      void done_at;
      return { ...rest, title: `${(rest.title as string) ?? ""} (cópia)` };
    });
    const { error: insErr } = await supabase.from("tasks").insert(copies);
    if (insErr) {
      toast.error(insErr.message);
      return;
    }
    toast.success(`${copies.length} tarefa(s) copiada(s)`);
    refresh();
  };

  const remove = async () => {
    if (!window.confirm(`Apagar ${count} tarefa(s)? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("tasks").delete().in("id", ids);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${count} tarefa(s) excluída(s)`);
    refresh();
  };

  return (
    <div className="sticky bottom-4 z-30 mx-auto flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-full border bg-background/95 px-3 py-1.5 shadow-lg backdrop-blur">
      <span className="px-1 text-xs font-medium whitespace-nowrap">
        <strong>{count}</strong> Tarefa selecionada
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={clear}
        aria-label="Limpar seleção"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
      <div className="h-4 w-px bg-border mx-1" />

      {/* Status */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" /> Status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          {statuses.map((s) => (
            <DropdownMenuItem key={s.id} onClick={() => setStatus(s.id)}>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: s.color ?? "#94a3b8" }}
                />
                {s.name}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={markDone}>
            <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Marcar como concluída
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Responsáveis */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs">
            <Users className="h-3.5 w-3.5" /> Responsáveis
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuLabel>Atribuir a</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {members.map((u) => (
            <DropdownMenuItem key={u.id} onClick={() => assign(u.id)}>
              {u.display_name || u.full_name || u.email}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Datas */}
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs">
            <CalendarDays className="h-3.5 w-3.5" /> Datas
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            locale={ptBR}
            onSelect={(d) => d && setDue(d)}
          />
          <div className="border-t p-2">
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-xs"
              onClick={() => setDue(undefined)}
            >
              Limpar vencimento
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Prioridade (Campos personalizados → na verdade nosso campo nativo) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs">
            <Flag className="h-3.5 w-3.5" /> Prioridade
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          {PRIORITIES.map((p) => (
            <DropdownMenuItem key={p.value} onClick={() => setPriority(p.value)}>
              <Flag className={`mr-2 h-3.5 w-3.5 ${p.color}`} />
              {p.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Etiquetas — placeholder */}
      <Button size="sm" variant="ghost" disabled className="h-7 gap-1.5 px-2 text-xs">
        <Tag className="h-3.5 w-3.5" /> Etiquetas
      </Button>

      {/* Mover */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs">
            <FolderInput className="h-3.5 w-3.5" /> Mover
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="max-h-72 overflow-y-auto">
          <DropdownMenuLabel>Mover para</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {projects
            .filter((p) => !p.archived && p.kind !== "space_root")
            .slice(0, 30)
            .map((p) => (
              <DropdownMenuItem key={p.id} onClick={() => moveTo(p.id)}>
                <span className="inline-flex items-center gap-2">
                  {p.color && (
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: p.color }}
                    />
                  )}
                  {p.name}
                </span>
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Copiar */}
      <Button
        size="sm"
        variant="ghost"
        className="h-7 gap-1.5 px-2 text-xs"
        onClick={duplicate}
      >
        <Copy className="h-3.5 w-3.5" /> Copiar
      </Button>

      {/* Excluir */}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={remove}
        aria-label="Excluir selecionadas"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      {/* Mais */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs">
            <MoreHorizontal className="h-3.5 w-3.5" /> Mais
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={archive}>
            <Archive className="mr-2 h-3.5 w-3.5" /> Arquivar
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Wand2 className="mr-2 h-3.5 w-3.5" /> Aplicar template (em breve)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
