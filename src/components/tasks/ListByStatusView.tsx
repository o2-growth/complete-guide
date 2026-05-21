import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TaskTableView } from "./TaskTableView";
import { CreateTaskModal } from "./CreateTaskModal";
import { useTaskStatuses, useCreateTask, type TaskRow } from "@/hooks/useTasks";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { taskDetailPath } from "@/lib/task-routes";
import { toast } from "sonner";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

interface ListByStatusViewProps {
  tasks: TaskRow[];
  projectId: string;
  isLoading?: boolean;
}

export function ListByStatusView({ tasks, projectId, isLoading }: ListByStatusViewProps) {
  const navigate = useNavigate();
  const { data: statuses = [] } = useTaskStatuses();
  const createTask = useCreateTask();
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [newStatusName, setNewStatusName] = useState<string | null>(null);

  const createStatus = useMutation({
    mutationFn: async (name: string) => {
      if (!tenantId) throw new Error("sem workspace");
      const trimmed = name.trim();
      if (!trimmed) throw new Error("nome vazio");
      const nextPos = (statuses[statuses.length - 1]?.position ?? 0) + 1;
      const { error } = await supabase.from("task_statuses").insert({
        tenant_id: tenantId,
        name: trimmed,
        slug: slugify(trimmed) || `status-${Date.now()}`,
        position: nextPos,
        color: "#94a3b8",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["task-statuses"] });
      setNewStatusName(null);
      toast.success("Status criado");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });

  const byStatus = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const s of statuses) map.set(s.id, []);
    const unassigned: TaskRow[] = [];
    for (const t of tasks) {
      if (t.status_id && map.has(t.status_id)) {
        map.get(t.status_id)!.push(t);
      } else {
        unassigned.push(t);
      }
    }
    return { map, unassigned };
  }, [tasks, statuses]);

  const addInline = async (statusId: string) => {
    const title = draftTitle.trim();
    if (!title) return;
    try {
      await createTask.mutateAsync({
        projectId,
        title,
        statusId,
        assigneeId: user?.id ?? null,
      });
      setDraftTitle("");
      setAddingFor(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <div className="space-y-6">
      {statuses.map((status) => {
        const groupTasks = byStatus.map.get(status.id) ?? [];
        return (
          <section key={status.id} className="rounded-lg border bg-card/50">
            <div
              className="flex items-center gap-2 border-b px-3 py-2"
              style={{ borderLeftWidth: 4, borderLeftColor: status.color ?? "#94a3b8" }}
            >
              <Badge
                variant="secondary"
                className="text-[10px] font-semibold uppercase"
                style={{ backgroundColor: `${status.color ?? "#94a3b8"}22` }}
              >
                {status.name}
              </Badge>
              <span className="text-xs text-muted-foreground">{groupTasks.length}</span>
            </div>
            <div className="p-2">
              <TaskTableView
                tasks={groupTasks}
                onOpen={(id) => navigate(taskDetailPath(id))}
                isLoading={isLoading}
              />
              {addingFor === status.id ? (
                <div className="mt-2 flex gap-2 px-2">
                  <input
                    className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Nome da tarefa…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void addInline(status.id);
                      if (e.key === "Escape") setAddingFor(null);
                    }}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => addInline(status.id)}>
                    Adicionar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-full justify-start text-muted-foreground"
                  onClick={() => {
                    setAddingFor(status.id);
                    setDraftTitle("");
                  }}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar tarefa
                </Button>
              )}
            </div>
          </section>
        );
      })}
      {byStatus.unassigned.length > 0 && (
        <section className="rounded-lg border border-dashed p-2">
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">Sem status</p>
          <TaskTableView
            tasks={byStatus.unassigned}
            onOpen={(id) => navigate(taskDetailPath(id))}
          />
        </section>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {newStatusName !== null ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              autoFocus
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              placeholder="Nome do status (ex: Em revisão)"
              className="h-8 max-w-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") createStatus.mutate(newStatusName);
                if (e.key === "Escape") setNewStatusName(null);
              }}
            />
            <Button
              size="sm"
              onClick={() => createStatus.mutate(newStatusName)}
              disabled={createStatus.isPending || !newStatusName.trim()}
            >
              Criar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setNewStatusName(null)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setNewStatusName("")}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Novo status
          </Button>
        )}
        <CreateTaskModal
          defaultProjectId={projectId}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Tarefa
            </Button>
          }
        />
      </div>
    </div>
  );
}
