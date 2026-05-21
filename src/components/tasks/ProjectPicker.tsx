import { useMemo, useState } from "react";
import { ExternalLink, FolderKanban, Plug, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useProjects, type ProjectWithStats } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

export interface ProjectPickerProps {
  value: string | null;
  onChange: (projectId: string | null) => void;
  excludeIds?: string[];
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

function isPipefy(p: ProjectWithStats) {
  return !!p.pipefy_card_id;
}

export function ProjectPicker({
  value,
  onChange,
  excludeIds = [],
  placeholder = "Selecionar produto…",
  className,
  compact = false,
}: ProjectPickerProps) {
  const { data: projects = [] } = useProjects();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = useMemo(
    () => projects.find((p) => p.id === value) ?? null,
    [projects, value],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects
      .filter((p) => !p.archived && !excludeIds.includes(p.id))
      .filter((p) => {
        if (!needle) return true;
        return (
          p.name.toLowerCase().includes(needle) ||
          p.key.toLowerCase().includes(needle) ||
          (p.pipefy_phase_name ?? "").toLowerCase().includes(needle)
        );
      })
      .slice(0, 40);
  }, [projects, q, excludeIds]);

  const pipefy = filtered.filter(isPipefy);
  const manual = filtered.filter((p) => !isPipefy(p));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={cn(
            "h-8 w-full justify-start font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: selected.color || "hsl(var(--primary))" }}
              />
              <span className="truncate">{selected.name}</span>
              {isPipefy(selected) && (
                <Badge variant="secondary" className="shrink-0 text-[9px] px-1">
                  Pipefy
                </Badge>
              )}
            </span>
          ) : (
            <>
              <FolderKanban className="mr-2 h-3.5 w-3.5 shrink-0 opacity-60" />
              {placeholder}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar produto ou projeto…"
              className="h-8 pl-7 text-sm"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-auto p-1">
          {value && (
            <button
              type="button"
              className="w-full rounded px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Remover vínculo principal
            </button>
          )}
          {pipefy.length > 0 && (
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Pipefy
            </p>
          )}
          {pipefy.map((p) => (
            <ProjectOption key={p.id} project={p} onPick={() => { onChange(p.id); setOpen(false); }} />
          ))}
          {manual.length > 0 && (
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Projetos
            </p>
          )}
          {manual.map((p) => (
            <ProjectOption key={p.id} project={p} onPick={() => { onChange(p.id); setOpen(false); }} />
          ))}
          {filtered.length === 0 && (
            <p className="p-3 text-center text-xs text-muted-foreground">
              Nenhum projeto encontrado. Conecte o Pipefy em Configurações → Integrações.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ProjectOption({
  project,
  onPick,
}: {
  project: ProjectWithStats;
  onPick: () => void;
}) {
  const fromPipe = isPipefy(project);
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full items-start gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted"
    >
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ background: project.color || "hsl(var(--primary))" }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium">{project.name}</span>
          <Badge variant="outline" className="font-mono text-[9px] shrink-0">
            {project.key}
          </Badge>
        </div>
        {fromPipe && project.pipefy_phase_name && (
          <span className="text-[10px] text-muted-foreground">{project.pipefy_phase_name}</span>
        )}
      </div>
      {fromPipe && project.pipefy_url && (
        <a
          href={project.pipefy_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground hover:text-primary"
          onClick={(e) => e.stopPropagation()}
          aria-label="Abrir no Pipefy"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      {fromPipe && <Plug className="h-3 w-3 shrink-0 text-violet-500 opacity-70" />}
    </button>
  );
}
