import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects } from "@/hooks/useProjects";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import type { TaskRow } from "@/hooks/useTasks";
import type {
  InlineDatabaseConfig,
  InlineDatabaseFilter,
  InlineDatabaseKind,
  InlineDatabaseViewMode,
} from "./InlineDatabaseRenderer";

interface Props {
  open: boolean;
  initial?: InlineDatabaseConfig;
  onOpenChange: (open: boolean) => void;
  onConfirm: (config: InlineDatabaseConfig) => void;
}

const ALL = "__all__";

const DEFAULT_CONFIG: InlineDatabaseConfig = {
  kind: "tasks",
  filter: { only_open: true, limit: 25 },
  view_mode: "list",
};

export function InlineDatabaseConfigDialog({ open, initial, onOpenChange, onConfirm }: Props) {
  const [kind, setKind] = useState<InlineDatabaseKind>(initial?.kind ?? "tasks");
  const [viewMode, setViewMode] = useState<InlineDatabaseViewMode>(initial?.view_mode ?? "list");
  const [filter, setFilter] = useState<InlineDatabaseFilter>(initial?.filter ?? DEFAULT_CONFIG.filter);

  const { data: projects = [] } = useProjects();
  const { data: members = [] } = useTenantMembers();

  // sincroniza ao abrir
  useEffect(() => {
    if (open) {
      setKind(initial?.kind ?? "tasks");
      setViewMode(initial?.view_mode ?? "list");
      setFilter(initial?.filter ?? DEFAULT_CONFIG.filter);
    }
  }, [open, initial]);

  const handleConfirm = () => {
    onConfirm({ kind, filter, view_mode: viewMode });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inserir database</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as InlineDatabaseKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tasks">Tarefas</SelectItem>
                <SelectItem value="wiki" disabled>
                  Wiki (em breve)
                </SelectItem>
                <SelectItem value="tickets" disabled>
                  Tickets (em breve)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Visualização</Label>
            <Select
              value={viewMode}
              onValueChange={(v) => setViewMode(v as InlineDatabaseViewMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">Lista</SelectItem>
                <SelectItem value="gallery">Galeria</SelectItem>
                <SelectItem value="chart">Gráfico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {kind === "tasks" && (
            <>
              <div className="space-y-1.5">
                <Label>Projeto</Label>
                <Select
                  value={filter.project_id ?? ALL}
                  onValueChange={(v) =>
                    setFilter((f) => ({ ...f, project_id: v === ALL ? null : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Responsável</Label>
                <Select
                  value={filter.assignee_id ?? ALL}
                  onValueChange={(v) =>
                    setFilter((f) => ({ ...f, assignee_id: v === ALL ? null : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name ?? m.display_name ?? m.email ?? "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Select
                  value={filter.priority ?? ALL}
                  onValueChange={(v) =>
                    setFilter((f) => ({
                      ...f,
                      priority: v === ALL ? null : (v as TaskRow["priority"]),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todas</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="none">Sem prioridade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="only-open"
                  checked={!!filter.only_open}
                  onCheckedChange={(c) =>
                    setFilter((f) => ({ ...f, only_open: c === true }))
                  }
                />
                <Label htmlFor="only-open" className="cursor-pointer text-sm font-normal">
                  Apenas tarefas pendentes
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label>Limite</Label>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={filter.limit ?? 25}
                  onChange={(e) =>
                    setFilter((f) => ({
                      ...f,
                      limit: Math.max(1, Math.min(200, Number(e.target.value) || 25)),
                    }))
                  }
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Inserir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
