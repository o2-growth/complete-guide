import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pin, Pencil, Trash2, Plus, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import {
  useSavedViews,
  useDeleteSavedView,
  useCreateSavedView,
  useUpdateSavedView,
  type SavedView,
} from "@/hooks/useGlobalSearchAdvanced";
import { SmartListBuilder } from "@/components/saved-views/SmartListBuilder";
import type { RuleGroup } from "@/lib/smart-list-query";
import { toast } from "sonner";

function isRuleGroupShape(v: unknown): v is RuleGroup {
  return (
    !!v &&
    typeof v === "object" &&
    "combinator" in (v as object) &&
    Array.isArray((v as RuleGroup).rules)
  );
}

export function SavedViewsList() {
  const navigate = useNavigate();
  const { data: views = [] } = useSavedViews();
  const deleteView = useDeleteSavedView();
  const createView = useCreateSavedView();
  const updateView = useUpdateSavedView();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SavedView | null>(null);

  const handleApply = (v: SavedView) => navigate(`/app/buscar?view=${v.id}`);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Smart lists</h2>
          <p className="text-xs text-muted-foreground">
            Visões salvas com filtros AND/OR. Aplique para buscar rapidamente.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova smart list
        </Button>
      </div>

      {views.length === 0 ? (
        <EmptyState
          icon={ListFilter}
          title="Nenhuma smart list ainda"
          description="Crie filtros compostos pra encontrar tarefas com 1 clique."
        />
      ) : (
        <div className="space-y-2">
          {views.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Pin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{v.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {summarize(v.filters)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleApply(v)}>
                Aplicar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Editar"
                onClick={() => setEditing(v)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Excluir"
                onClick={async () => {
                  await deleteView.mutateAsync(v.id);
                  toast.success("Smart list excluída");
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova smart list</DialogTitle>
          </DialogHeader>
          <SmartListBuilder
            onCancel={() => setCreateOpen(false)}
            onSubmit={async (group, name) => {
              await createView.mutateAsync({
                name,
                source: "tasks",
                filters: group as unknown as Record<string, unknown>,
                icon: "ListFilter",
                color: "#0EA5E9",
              });
              toast.success("Smart list criada");
              setCreateOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar smart list</DialogTitle>
          </DialogHeader>
          {editing && (
            <SmartListBuilder
              initialName={editing.name}
              initial={
                isRuleGroupShape(editing.filters)
                  ? (editing.filters as RuleGroup)
                  : { combinator: "and", rules: [] }
              }
              onCancel={() => setEditing(null)}
              onSubmit={async (group, name) => {
                await updateView.mutateAsync({
                  id: editing.id,
                  name,
                  filters: group as unknown as Record<string, unknown>,
                });
                toast.success("Smart list atualizada");
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function summarize(filters: Record<string, unknown>): string {
  if (isRuleGroupShape(filters)) {
    const count = countRules(filters as RuleGroup);
    return `${count} ${count === 1 ? "condição" : "condições"} (${
      (filters as RuleGroup).combinator === "and" ? "E" : "OU"
    })`;
  }
  if (typeof filters.query === "string") return `Busca: "${filters.query}"`;
  return "Visão salva";
}

function countRules(group: RuleGroup): number {
  let n = 0;
  for (const r of group.rules) {
    if ((r as RuleGroup).combinator) n += countRules(r as RuleGroup);
    else n += 1;
  }
  return n;
}
