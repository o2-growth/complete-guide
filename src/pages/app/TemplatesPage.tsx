import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, FileStack, Plus, Trash2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProjectTemplates,
  useApplyProjectTemplate,
  useDeleteProjectTemplate,
  useSaveProjectAsTemplate,
  type ProjectTemplate,
} from "@/hooks/useProjectTemplates";
import { useProjects } from "@/hooks/useProjects";
import { useSquads } from "@/hooks/useSquads";

function ApplyDialog({ template }: { template: ProjectTemplate }) {
  const [open, setOpen] = useState(false);
  const apply = useApplyProjectTemplate();
  const { data: squads = [] } = useSquads();
  const navigate = useNavigate();
  const [name, setName] = useState(template.name);
  const [key, setKey] = useState(template.name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, ""));
  const [squadId, setSquadId] = useState(template.suggested_squad_id ?? "none");

  const submit = async () => {
    const id = await apply.mutateAsync({
      template_id: template.id,
      name,
      key,
      squad_id: squadId === "none" ? null : squadId,
    });
    setOpen(false);
    if (id) navigate(`/app/projetos/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Sparkles className="mr-2 h-3.5 w-3.5" /> Usar template</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Criar projeto a partir do template</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sigla</Label>
              <Input value={key} maxLength={6} onChange={(e) => setKey(e.target.value.toUpperCase())} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Squad</Label>
            <Select value={squadId} onValueChange={setSquadId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem squad</SelectItem>
                {squads.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={!name || !key || apply.isPending} onClick={submit}>Criar projeto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateFromProjectDialog() {
  const [open, setOpen] = useState(false);
  const { data: projects = [] } = useProjects();
  const save = useSaveProjectAsTemplate();
  const [projectId, setProjectId] = useState<string>("");
  const [name, setName] = useState("");

  const submit = async () => {
    await save.mutateAsync({ project_id: projectId, name });
    setOpen(false);
    setProjectId(""); setName("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Salvar projeto como template</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Salvar projeto como template</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Projeto base</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {projects.filter((p) => !p.archived).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.key})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nome do template</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Lançamento de produto" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={!projectId || !name || save.isPending} onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TemplatesPage() {
  const { data: templates = [], isLoading } = useProjectTemplates();
  const remove = useDeleteProjectTemplate();

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
            <FileStack className="mr-1.5 h-3 w-3" /> Templates · Fase 2 · Passo 23
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Templates de projeto</h1>
          <p className="mt-1 text-sm text-muted-foreground">Clone projetos recorrentes em 1 clique. Tarefas, prioridades e checklists já incluídos.</p>
        </div>
        <CreateFromProjectDialog />
      </header>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : templates.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Copy className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium">Nenhum template ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Salve um projeto existente para começar.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => {
            const taskCount = t.payload?.tasks?.length ?? 0;
            return (
              <Card key={t.id} className="relative overflow-hidden p-4">
                <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: t.color || "hsl(var(--primary))" }} />
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{t.name}</h3>
                      {t.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>}
                    </div>
                    <Button
                      size="icon" variant="ghost"
                      onClick={() => { if (confirm(`Remover "${t.name}"?`)) remove.mutate(t.id); }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{taskCount} {taskCount === 1 ? "tarefa" : "tarefas"}</Badge>
                  <ApplyDialog template={t} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}