import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, FileStack, Folder, Hash, Inbox, KanbanSquare, LayoutGrid, ListTodo, Loader2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProject, useProjectTasks, useTasksForProjects } from "@/hooks/useProjects";
import { useProjectTree, collectDescendantIds, findNode } from "@/hooks/useProjectTree";
import { useSaveProjectAsTemplate } from "@/hooks/useProjectTemplates";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { TaskRow as TaskRowItem } from "@/components/tasks/TaskRow";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskGalleryView } from "@/components/tasks/views/TaskGalleryView";
import { TaskChartView } from "@/components/tasks/views/TaskChartView";
import type { TaskRow } from "@/hooks/useTasks";
import { useMemo } from "react";

const PROJECT_VIEW_KEY = "oxy:project-view";

function getStoredProjectView(projectId: string | undefined) {
  if (typeof window === "undefined" || !projectId) return "list";
  try {
    const raw = window.localStorage.getItem(`${PROJECT_VIEW_KEY}:${projectId}`);
    if (raw === "list" || raw === "kanban" || raw === "gallery" || raw === "chart") return raw;
  } catch {
    // ignore
  }
  return "list";
}

function setStoredProjectView(projectId: string | undefined, value: string) {
  if (typeof window === "undefined" || !projectId) return;
  try {
    window.localStorage.setItem(`${PROJECT_VIEW_KEY}:${projectId}`, value);
  } catch {
    // ignore
  }
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);
  const { tree } = useProjectTree();
  const node = useMemo(() => (id ? findNode(tree, id) : null), [tree, id]);
  const kind = (project?.kind ?? node?.kind ?? "list") as "space_root" | "folder" | "list" | "inbox";
  const isAggregator = kind === "space_root" || kind === "folder";
  const descendantIds = useMemo(
    () => (isAggregator && node ? collectDescendantIds(node) : []),
    [isAggregator, node],
  );
  const childrenNodes = node?.children ?? [];

  const ownTasks = useProjectTasks(isAggregator ? undefined : id);
  const aggTasks = useTasksForProjects(isAggregator ? descendantIds : undefined);
  const tasks = isAggregator ? aggTasks.data : ownTasks.data;
  const lt = isAggregator ? aggTasks.isLoading : ownTasks.isLoading;

  const [openId, setOpenId] = useState<string | null>(null);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplName, setTplName] = useState("");
  const saveTpl = useSaveProjectAsTemplate();
  const [view, setView] = useState<string>(() => getStoredProjectView(id));
  const handleViewChange = (v: string) => {
    setView(v);
    setStoredProjectView(id, v);
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!project) {
    return (
      <div className="container max-w-7xl py-8">
        <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>
        <Button asChild variant="ghost" className="mt-4"><Link to="/app/projetos"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link></Button>
      </div>
    );
  }

  const allTasks = (tasks ?? []) as TaskRow[];
  const done = allTasks.filter((t) => !!t.done_at).length;
  const total = allTasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const kindMeta: Record<typeof kind, { label: string; Icon: typeof Folder }> = {
    space_root: { label: "Espaço", Icon: Hash },
    folder: { label: "Pasta", Icon: Folder },
    list: { label: "Lista", Icon: ListTodo },
    inbox: { label: "Inbox", Icon: Inbox },
  };
  const KindIcon = kindMeta[kind].Icon;

  return (
    <div className="container max-w-7xl py-6 space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2"><Link to="/app/projetos"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Projetos</Link></Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">{project.key}</Badge>
              <Badge variant="secondary" className="gap-1 text-[10px]"><KindIcon className="h-3 w-3" /> {kindMeta[kind].label}</Badge>
              {project.is_private && (
                <Badge variant="outline" className="gap-1 text-[10px]"><Lock className="h-3 w-3" /> Privado</Badge>
              )}
              {project.archived && <Badge variant="secondary" className="text-[10px]">Arquivado</Badge>}
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{project.name}</h1>
            {project.description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.description}</p>}
            {isAggregator && (
              <p className="mt-1 text-xs text-muted-foreground">
                Mostrando tarefas agregadas de {descendantIds.length} {descendantIds.length === 1 ? "item" : "itens"} desta {kindMeta[kind].label.toLowerCase()}.
              </p>
            )}
          </div>
          <div className="flex min-w-[220px] flex-col items-end gap-1">
            <Dialog open={tplOpen} onOpenChange={setTplOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="mb-1">
                  <FileStack className="mr-1.5 h-3.5 w-3.5" /> Salvar como template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Salvar como template</DialogTitle></DialogHeader>
                <div className="space-y-1.5">
                  <Label>Nome do template</Label>
                  <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder={project.name} />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setTplOpen(false)}>Cancelar</Button>
                  <Button
                    disabled={!tplName || saveTpl.isPending}
                    onClick={async () => {
                      await saveTpl.mutateAsync({ project_id: project.id, name: tplName });
                      setTplOpen(false); setTplName("");
                    }}
                  >Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <span className="text-xs text-muted-foreground">{done} de {total} concluídas</span>
            <Progress value={progress} className="h-1.5 w-full" />
            <span className="text-[11px] font-medium">{progress}%</span>
          </div>
        </div>
      </div>

      {isAggregator && childrenNodes.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Conteúdo</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {childrenNodes.map((c) => {
              const Meta = kindMeta[c.kind].Icon;
              return (
                <Link
                  key={c.id}
                  to={`/app/projetos/${c.id}`}
                  className="group flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <Meta className="h-4 w-4 text-muted-foreground group-hover:text-foreground" style={c.color ? { color: c.color } : undefined} />
                  <span className="truncate">{c.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <Tabs value={view} onValueChange={handleViewChange}>
        <TabsList>
          <TabsTrigger value="list"><ListTodo className="mr-1.5 h-3.5 w-3.5" /> Lista</TabsTrigger>
          <TabsTrigger value="kanban"><KanbanSquare className="mr-1.5 h-3.5 w-3.5" /> Kanban</TabsTrigger>
          <TabsTrigger value="gallery"><LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> Galeria</TabsTrigger>
          <TabsTrigger value="chart"><BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Gráfico</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {lt ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : allTasks.length === 0 ? (
            <Card className="py-12 text-center text-sm text-muted-foreground">Nenhuma tarefa neste projeto ainda.</Card>
          ) : (
            <Card className="divide-y">
              {allTasks.map((t) => <TaskRowItem key={t.id} task={t} onOpen={setOpenId} />)}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <div className="min-h-[60vh]">
            <KanbanBoard projectId={id} />
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="mt-4">
          <TaskGalleryView
            tasks={allTasks}
            isLoading={lt}
            emptyTitle="Nenhuma tarefa neste projeto"
            emptyDescription="Crie a primeira pra ver os cards aqui."
          />
        </TabsContent>

        <TabsContent value="chart" className="mt-4">
          <TaskChartView tasks={allTasks} isLoading={lt} />
        </TabsContent>
      </Tabs>

      <TaskDetailSheet taskId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  );
}