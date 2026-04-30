import { useMemo, useState } from "react";
import {
  Image as ImageIcon,
  Camera,
  Video,
  Linkedin,
  Mail,
  Workflow,
  Store,
  BarChart3,
  Inbox,
  Tag,
  Plus,
  Trash2,
  Pencil,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteTaskType,
  useReseedTaskTypes,
  useTaskTypes,
  useUpsertTaskType,
  type TaskType,
} from "@/hooks/useTaskTypes";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Image: ImageIcon,
  Camera,
  Video,
  Linkedin,
  Mail,
  Workflow,
  Store,
  BarChart3,
  Inbox,
  Tag,
};

function TypeIcon({ name, className }: { name: string | null; className?: string }) {
  const C = (name && ICONS[name]) || Tag;
  return <C className={className} />;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

interface FormState {
  id?: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  default_estimate_minutes: number | null;
  description: string;
  checklistText: string;
}

const emptyForm: FormState = {
  name: "",
  slug: "",
  icon: "Tag",
  color: "#0EA5E9",
  default_estimate_minutes: 60,
  description: "",
  checklistText: "",
};

export default function TaskTypesPage() {
  const { data, isLoading } = useTaskTypes();
  const upsert = useUpsertTaskType();
  const del = useDeleteTaskType();
  const reseed = useReseedTaskTypes();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<TaskType | null>(null);

  const isEdit = !!form.id;

  const openCreate = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (t: TaskType) => {
    setForm({
      id: t.id,
      name: t.name,
      slug: t.slug,
      icon: t.icon ?? "Tag",
      color: t.color ?? "#0EA5E9",
      default_estimate_minutes: t.default_estimate_minutes,
      description: t.description ?? "",
      checklistText: (t.checklist ?? []).map((c) => c.label).join("\n"),
    });
    setOpen(true);
  };

  const onSave = async () => {
    if (!form.name.trim()) return;
    const checklist = form.checklistText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((label) => ({ label, done: false }));
    await upsert.mutateAsync({
      id: form.id,
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      icon: form.icon,
      color: form.color,
      default_estimate_minutes: form.default_estimate_minutes,
      description: form.description.trim() || null,
      checklist,
    });
    setOpen(false);
  };

  const sorted = useMemo(() => (data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)), [data]);

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tipos de tarefa</h1>
          <p className="text-sm text-muted-foreground">
            Modelos reutilizáveis com checklist, estimativa e regras de preview por canal.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => reseed.mutate()} disabled={reseed.isPending}>
            <RotateCcw className="h-4 w-4" />
            Restaurar defaults
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo tipo
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhum tipo cadastrado.</p>
            <Button onClick={() => reseed.mutate()}>
              <RotateCcw className="h-4 w-4" /> Carregar 9 tipos default
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sorted.map((t) => (
            <Card key={t.id} className="group">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: (t.color ?? "#0EA5E9") + "20", color: t.color ?? "#0EA5E9" }}
                >
                  <TypeIcon name={t.icon} className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                    {t.name}
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {t.slug}
                    </Badge>
                  </CardTitle>
                  {t.description && (
                    <CardDescription className="mt-1 line-clamp-2">{t.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setConfirmDelete(t)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {t.default_estimate_minutes != null && (
                  <span>⏱ {t.default_estimate_minutes}min</span>
                )}
                {t.checklist && t.checklist.length > 0 && (
                  <span>☑ {t.checklist.length} itens</span>
                )}
                {t.workflow && (t.workflow as Record<string, unknown>).preview ? (
                  <Badge variant="outline">
                    preview: {String((t.workflow as Record<string, unknown>).preview)}
                  </Badge>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar tipo" : "Novo tipo de tarefa"}</DialogTitle>
            <DialogDescription>
              Defina nome, ícone, estimativa padrão e checklist sugerido.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: f.id ? f.slug : slugify(e.target.value),
                  }))
                }
                placeholder="Ex.: Post Feed Instagram"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="ig_feed"
                  className="font-mono text-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label>Estimativa (min)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.default_estimate_minutes ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      default_estimate_minutes: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Ícone</Label>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(ICONS).map((key) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setForm((f) => ({ ...f, icon: key }))}
                      className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${
                        form.icon === key ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
                      }`}
                      title={key}
                    >
                      <TypeIcon name={key} className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Cor</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="h-10 w-16 p-1"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Checklist (uma linha por item)</Label>
              <Textarea
                value={form.checklistText}
                onChange={(e) => setForm((f) => ({ ...f, checklistText: e.target.value }))}
                rows={5}
                placeholder={"Briefing\nCopy\nDesign\nRevisão\nAgendamento"}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={onSave} disabled={upsert.isPending || !form.name.trim()}>
              <Save className="h-4 w-4" />
              {isEdit ? "Salvar" : "Criar tipo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover tipo?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.name}" será removido permanentemente. Tarefas existentes mantêm o tipo, mas não será mais possível selecioná-lo em novas tarefas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) del.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
