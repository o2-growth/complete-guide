import { useMemo, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { TaskTypeCard } from "./_components/task-types/TaskTypeCard";
import { TaskTypeDialog } from "./_components/task-types/TaskTypeDialog";
import {
  emptyTaskTypeForm,
  slugify,
  type TaskTypeFormState,
} from "./_components/task-types/utils";

export default function TaskTypesPage() {
  const { data, isLoading } = useTaskTypes();
  const upsert = useUpsertTaskType();
  const del = useDeleteTaskType();
  const reseed = useReseedTaskTypes();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TaskTypeFormState>(emptyTaskTypeForm);
  const [confirmDelete, setConfirmDelete] = useState<TaskType | null>(null);

  const openCreate = () => {
    setForm(emptyTaskTypeForm);
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
            <TaskTypeCard key={t.id} type={t} onEdit={openEdit} onDelete={setConfirmDelete} />
          ))}
        </div>
      )}

      <TaskTypeDialog
        open={open}
        onOpenChange={setOpen}
        form={form}
        setForm={setForm}
        onSave={onSave}
        saving={upsert.isPending}
      />

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
