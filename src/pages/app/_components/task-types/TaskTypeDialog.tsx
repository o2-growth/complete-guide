import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TypeIcon } from "./TypeIcon";
import { TASK_TYPE_ICONS, slugify, type TaskTypeFormState } from "./utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: TaskTypeFormState;
  setForm: React.Dispatch<React.SetStateAction<TaskTypeFormState>>;
  onSave: () => void;
  saving: boolean;
}

export function TaskTypeDialog({ open, onOpenChange, form, setForm, onSave, saving }: Props) {
  const isEdit = !!form.id;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                {Object.keys(TASK_TYPE_ICONS).map((key) => (
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" /> Cancelar
          </Button>
          <Button onClick={onSave} disabled={saving || !form.name.trim()}>
            <Save className="h-4 w-4" />
            {isEdit ? "Salvar" : "Criar tipo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
