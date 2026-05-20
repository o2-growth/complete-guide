import { useMemo } from "react";
import { Archive, CheckCircle2, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function BulkActionsBar() {
  const { selectedIds, count, clear, bulkMode } = useBulkSelection();
  const { data: members = [] } = useTenantMembers();
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

  const markDone = async () => {
    const { error } = await supabase
      .from("tasks")
      .update({ done_at: new Date().toISOString() })
      .in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${count} tarefa(s) concluída(s)`);
    refresh();
  };

  const archive = async () => {
    const { error } = await supabase.from("tasks").update({ archived: true }).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${count} tarefa(s) arquivada(s)`);
    refresh();
  };

  const assign = async (userId: string) => {
    const { error } = await supabase.from("tasks").update({ assignee_id: userId }).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success("Responsável atualizado");
    refresh();
  };

  return (
    <div className="sticky bottom-4 z-30 mx-auto flex w-fit items-center gap-2 rounded-full border bg-background/95 px-3 py-1.5 shadow-lg backdrop-blur">
      <span className="text-sm font-medium">{count} selecionada(s)</span>
      <div className="h-4 w-px bg-border" />
      <Button size="sm" variant="ghost" onClick={markDone}>
        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Concluir
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost">
            <Users className="mr-1.5 h-3.5 w-3.5" /> Atribuir
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
      <Button size="sm" variant="ghost" onClick={archive}>
        <Archive className="mr-1.5 h-3.5 w-3.5" /> Arquivar
      </Button>
      <div className="h-4 w-px bg-border" />
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={clear} aria-label="Limpar seleção">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}