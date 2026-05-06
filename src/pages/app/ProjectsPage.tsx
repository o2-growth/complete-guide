import { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus, Archive, ArchiveRestore, Search, Loader2, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/skeletons/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useProjects, useCreateProject, useArchiveProject, ProjectWithStats } from "@/hooks/useProjects";
import { useSquads } from "@/hooks/useSquads";
import { cn } from "@/lib/utils";

function CreateProjectDialog() {
  const create = useCreateProject();
  const { data: squads } = useSquads();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [squadId, setSquadId] = useState<string>("none");
  const [description, setDescription] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Novo projeto</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Criar projeto</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nome</Label>
              <Input name="name" value={name} onChange={(e) => {
                setName(e.target.value);
                if (!key) setKey(e.target.value.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, ""));
              }} placeholder="Ex: Lançamento Q3" />
            </div>
            <div className="space-y-1.5">
              <Label>Sigla</Label>
              <Input name="key" value={key} maxLength={6} onChange={(e) => setKey(e.target.value.toUpperCase())} placeholder="LQ3" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Squad</Label>
            <Select value={squadId} onValueChange={setSquadId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem squad</SelectItem>
                {(squads ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!name || !key || create.isPending}
            onClick={async () => {
              await create.mutateAsync({
                name, key,
                squad_id: squadId === "none" ? null : squadId,
                description,
              });
              setOpen(false); setName(""); setKey(""); setDescription(""); setSquadId("none");
            }}
          >
            {create.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const PROJECT_FAV_KEY = "oxy.project-favorites";

function readProjectFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PROJECT_FAV_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (Array.isArray(arr)) return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    // ignore
  }
  return new Set();
}

function writeProjectFavorites(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROJECT_FAV_KEY, JSON.stringify([...ids]));
  window.dispatchEvent(new CustomEvent("oxy:project-favs"));
}

function useProjectFavorites() {
  const [ids, setIds] = useState<Set<string>>(() => readProjectFavorites());
  useEffect(() => {
    const h = () => setIds(readProjectFavorites());
    window.addEventListener("oxy:project-favs", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("oxy:project-favs", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  const toggle = useCallback((id: string) => {
    const next = readProjectFavorites();
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeProjectFavorites(next);
    setIds(next);
  }, []);
  return { ids, toggle };
}

function ProjectCard({ project, index }: { project: ProjectWithStats; index?: number }) {
  const archive = useArchiveProject();
  const favs = useProjectFavorites();
  const isFav = favs.ids.has(project.id);
  const staggerDelay =
    typeof index === "number" && index < 5 ? `${index * 40}ms` : undefined;
  return (
    <Card
      className="group relative overflow-hidden transition hover:shadow-md animate-fade-in [--card-pad-tweak:var(--density-card-pad)]"
      style={staggerDelay ? { animationDelay: staggerDelay } : undefined}
    >
      <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: project.color || project.squadColor || "hsl(var(--primary))" }} />
      <CardHeader className="pb-3" style={{ padding: "var(--density-card-pad)", paddingBottom: "calc(var(--density-card-pad) * 0.6)" }}>
        <div className="flex items-start justify-between gap-3">
          <Link to={`/app/projetos/${project.id}`} className="min-w-0 flex-1">
            <CardTitle className="truncate text-base hover:text-primary">{project.name}</CardTitle>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Badge variant="outline" className="font-mono text-[10px]">{project.key}</Badge>
              {project.squadName && <span>· {project.squadName}</span>}
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(isFav && "text-amber-500")}
                  aria-label={isFav ? "Remover dos favoritos" : "Favoritar"}
                  aria-pressed={isFav}
                  onClick={(e) => {
                    e.preventDefault();
                    favs.toggle(project.id);
                  }}
                >
                  <Star className={cn("h-4 w-4", isFav && "fill-current")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFav ? "Remover dos favoritos" : "Favoritar"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon" variant="ghost"
                  aria-label={project.archived ? "Restaurar" : "Arquivar"}
                  onClick={() => archive.mutate({ id: project.id, archived: !project.archived })}
                >
                  {project.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{project.archived ? "Restaurar" : "Arquivar"}</TooltipContent>
            </Tooltip>
          </div>
        </div>
        {project.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{project.description}</p>}
      </CardHeader>
      <CardContent className="space-y-3" style={{ padding: "var(--density-card-pad)", paddingTop: 0 }}>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded-md bg-muted/30 px-1 py-1.5">
            <p className="font-semibold text-foreground">{project.openTasks}</p>
            <p className="text-muted-foreground">Abertas</p>
          </div>
          <div className="rounded-md bg-emerald-500/10 px-1 py-1.5">
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">{project.doneTasks}</p>
            <p className="text-muted-foreground">Concluídas</p>
          </div>
          <div className={cn("rounded-md px-1 py-1.5", project.overdue > 0 ? "bg-rose-500/10" : "bg-muted/30")}>
            <p className={cn("font-semibold", project.overdue > 0 ? "text-rose-700 dark:text-rose-400" : "text-foreground")}>{project.overdue}</p>
            <p className="text-muted-foreground">Atrasadas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectsPage() {
  const { data, isLoading, error, refetch } = useProjects();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(() => {
    return (data ?? []).filter((p) => {
      if (!showArchived && p.archived) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.key.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, search, showArchived]);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; color: string | null; items: ProjectWithStats[] }>();
    for (const p of filtered) {
      const key = p.squadName ?? "__none__";
      const existing = map.get(key) ?? { name: p.squadName ?? "Sem squad", color: p.squadColor, items: [] };
      existing.items.push(p);
      map.set(key, existing);
    }
    return Array.from(map.values());
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <CardGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <PageHeader
        icon={FolderKanban}
        title="Projetos"
        description="Hierarquia Squad → Projeto → Tarefas com múltiplas visões."
        actions={<CreateProjectDialog />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar por nome ou sigla..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant={showArchived ? "default" : "outline"} size="sm" onClick={() => setShowArchived((s) => !s)}>
          {showArchived ? "Ocultar arquivados" : "Mostrar arquivados"}
        </Button>
      </div>

      {error ? (
        <ErrorState
          title="Não foi possível carregar projetos"
          description={(error as Error).message}
          onRetry={() => refetch()}
        />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Sem projetos ainda"
          description="Crie seu primeiro projeto pra organizar squads, tarefas e visões."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <section key={g.name}>
              <div className="mb-3 flex items-center gap-2">
                {g.color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} aria-hidden />}
                <h2 className="text-sm font-semibold text-muted-foreground">{g.name}</h2>
                <span className="text-[11px] text-muted-foreground/60">· {g.items.length}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {g.items.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}