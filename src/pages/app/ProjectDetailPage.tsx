import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ListTodo, KanbanSquare, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject, useProjectTasks } from "@/hooks/useProjects";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { TaskRow as TaskRowItem } from "@/components/tasks/TaskRow";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import type { TaskRow } from "@/hooks/useTasks";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);
  const { data: tasks, isLoading: lt } = useProjectTasks(id);
  const [openId, setOpenId] = useState<string | null>(null);

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

  return (
    <div className="container max-w-7xl py-6 space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2"><Link to="/app/projetos"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Projetos</Link></Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">{project.key}</Badge>
              {project.archived && <Badge variant="secondary" className="text-[10px]">Arquivado</Badge>}
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{project.name}</h1>
            {project.description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.description}</p>}
          </div>
          <div className="flex min-w-[220px] flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">{done} de {total} concluídas</span>
            <Progress value={progress} className="h-1.5 w-full" />
            <span className="text-[11px] font-medium">{progress}%</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list"><ListTodo className="mr-1.5 h-3.5 w-3.5" /> Lista</TabsTrigger>
          <TabsTrigger value="kanban"><KanbanSquare className="mr-1.5 h-3.5 w-3.5" /> Kanban</TabsTrigger>
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
      </Tabs>

      <TaskDetailSheet taskId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  );
}