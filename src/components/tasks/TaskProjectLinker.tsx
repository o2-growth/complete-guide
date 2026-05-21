import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Link2, Plus, Trash2, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectPicker } from "./ProjectPicker";
import {
  useTaskProjectLinks,
  useAddTaskProjectLink,
  useRemoveTaskProjectLink,
} from "@/hooks/useTaskProjectLinks";
import { useProjects } from "@/hooks/useProjects";

interface TaskProjectLinkerProps {
  taskId: string;
  primaryProjectId: string | null;
  onPrimaryChange: (projectId: string | null) => void;
}

export function TaskProjectLinker({
  taskId,
  primaryProjectId,
  onPrimaryChange,
}: TaskProjectLinkerProps) {
  const { data: links = [] } = useTaskProjectLinks(taskId);
  const add = useAddTaskProjectLink();
  const remove = useRemoveTaskProjectLink();
  const { data: projects = [] } = useProjects();

  const primary = projects.find((p) => p.id === primaryProjectId);
  const exclude = [
    primaryProjectId,
    ...links.map((l) => l.project_id),
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Link2 className="h-4 w-4 text-primary" />
        Produto / projeto
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Lista principal
        </p>
        <ProjectPicker
          value={primaryProjectId}
          onChange={onPrimaryChange}
          excludeIds={links.map((l) => l.project_id)}
        />
        {primary?.pipefy_url && (
          <a
            href={primary.pipefy_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plug className="h-3 w-3" /> Ver card no Pipefy
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {primaryProjectId && (
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
            <Link to={`/app/projetos/${primaryProjectId}`}>Abrir projeto →</Link>
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Produtos relacionados (pipe)
        </p>
        {links.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Vincule outros cards do Pipefy ou projetos sem mudar a lista principal.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {links.map((l) => {
              const p = l.project;
              if (!p) return null;
              return (
                <li
                  key={l.id}
                  className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: p.color || "hsl(var(--primary))" }}
                  />
                  <Link
                    to={`/app/projetos/${p.id}`}
                    className="min-w-0 flex-1 truncate hover:text-primary"
                  >
                    {p.name}
                  </Link>
                  {p.pipefy_card_id && (
                    <Badge variant="secondary" className="text-[9px]">Pipefy</Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    aria-label="Remover vínculo"
                    onClick={() => remove.mutate({ id: l.id, taskId })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <AddLinkPicker
              taskId={taskId}
              excludeIds={exclude}
              disabled={add.isPending}
              onAdd={(projectId, kind) =>
                add.mutateAsync({ taskId, projectId, linkKind: kind })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AddLinkPicker({
  taskId,
  excludeIds,
  disabled,
  onAdd,
}: {
  taskId: string;
  excludeIds: string[];
  disabled: boolean;
  onAdd: (projectId: string, kind: "product" | "related") => Promise<void>;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [kind, setKind] = useState<"product" | "related">("product");

  return (
    <>
      <ProjectPicker
        value={projectId}
        onChange={setProjectId}
        excludeIds={excludeIds}
        placeholder="Adicionar produto do pipe…"
        compact
      />
      <div className="mt-2 flex gap-2">
        <Select value={kind} onValueChange={(v) => setKind(v as "product" | "related")}>
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product">Produto</SelectItem>
            <SelectItem value="related">Relacionado</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          disabled={!projectId || disabled}
          onClick={async () => {
            if (!projectId) return;
            await onAdd(projectId, kind);
            setProjectId(null);
          }}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Vincular
        </Button>
      </div>
    </>
  );
}
