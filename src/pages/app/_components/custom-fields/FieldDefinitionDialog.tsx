import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CUSTOM_FIELD_TYPES,
  type CustomFieldDefinition,
  type CustomFieldDefinitionInput,
  type CustomFieldOption,
  type CustomFieldScope,
  type CustomFieldType,
} from "@/hooks/useCustomFields";

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: "Texto curto",
  textarea: "Texto longo",
  number: "Número",
  date: "Data",
  datetime: "Data e hora",
  select: "Seleção única",
  multi_select: "Seleção múltipla",
  checkbox: "Checkbox",
  url: "URL",
  email: "E-mail",
  phone: "Telefone",
  currency: "Moeda (R$)",
  rating: "Avaliação (estrelas)",
  user: "Usuário",
  tag: "Tag",
  file: "Arquivo",
  formula: "Fórmula (calculado)",
};

const HAS_OPTIONS: CustomFieldType[] = ["select", "multi_select"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

export interface FieldDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: CustomFieldScope;
  taskTypeId?: string | null;
  projectId?: string | null;
  initial?: CustomFieldDefinition | null;
  onSubmit: (input: CustomFieldDefinitionInput) => Promise<void> | void;
  saving?: boolean;
}

interface FormState {
  key: string;
  label: string;
  field_type: CustomFieldType;
  required: boolean;
  help_text: string;
  default_value: string;
  options: CustomFieldOption[];
  optionDraft: { value: string; label: string };
  keyTouched: boolean;
}

const empty = (): FormState => ({
  key: "",
  label: "",
  field_type: "text",
  required: false,
  help_text: "",
  default_value: "",
  options: [],
  optionDraft: { value: "", label: "" },
  keyTouched: false,
});

export function FieldDefinitionDialog({
  open,
  onOpenChange,
  scope,
  taskTypeId,
  projectId,
  initial,
  onSubmit,
  saving,
}: FieldDefinitionDialogProps) {
  const [form, setForm] = useState<FormState>(empty);
  const isEdit = !!initial;

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        key: initial.key,
        label: initial.label,
        field_type: initial.field_type,
        required: initial.required,
        help_text: initial.help_text ?? "",
        default_value:
          initial.default_value === null || initial.default_value === undefined
            ? ""
            : typeof initial.default_value === "string"
              ? initial.default_value
              : JSON.stringify(initial.default_value),
        options: initial.options ?? [],
        optionDraft: { value: "", label: "" },
        keyTouched: true,
      });
    } else {
      setForm(empty());
    }
  }, [open, initial]);

  const showOptions = HAS_OPTIONS.includes(form.field_type);

  const canSave = useMemo(() => {
    if (!form.label.trim() || !form.key.trim()) return false;
    if (showOptions && form.options.length === 0) return false;
    return true;
  }, [form, showOptions]);

  const handleAddOption = () => {
    const v = form.optionDraft.value.trim() || slugify(form.optionDraft.label);
    const l = form.optionDraft.label.trim();
    if (!v || !l) return;
    if (form.options.some((o) => o.value === v)) return;
    setForm((f) => ({
      ...f,
      options: [...f.options, { value: v, label: l }],
      optionDraft: { value: "", label: "" },
    }));
  };

  const handleRemoveOption = (value: string) => {
    setForm((f) => ({ ...f, options: f.options.filter((o) => o.value !== value) }));
  };

  const handleSubmit = async () => {
    if (!canSave) return;
    let parsedDefault: unknown = null;
    const dv = form.default_value.trim();
    if (dv !== "") {
      switch (form.field_type) {
        case "number":
        case "currency":
        case "rating":
          parsedDefault = Number(dv);
          break;
        case "checkbox":
          parsedDefault = dv === "true" || dv === "1";
          break;
        case "multi_select":
          parsedDefault = dv.split(",").map((x) => x.trim()).filter(Boolean);
          break;
        default:
          parsedDefault = dv;
      }
    }
    const input: CustomFieldDefinitionInput = {
      scope,
      task_type_id: scope === "task_type" ? (taskTypeId ?? null) : null,
      project_id: scope === "project" ? (projectId ?? null) : null,
      key: form.key,
      label: form.label,
      field_type: form.field_type,
      required: form.required,
      help_text: form.help_text || null,
      default_value: parsedDefault,
      options: showOptions ? form.options : [],
    };
    await onSubmit(input);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar campo" : "Novo campo customizado"}</DialogTitle>
          <DialogDescription>
            Defina um novo campo extensível. O escopo {scope === "global" ? "abrange todas as tarefas" : scope === "task_type" ? "filtra pelo tipo de tarefa" : "filtra pelo projeto"}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Rótulo</Label>
            <Input
              value={form.label}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  label: e.target.value,
                  key: f.keyTouched ? f.key : slugify(e.target.value),
                }))
              }
              placeholder="Ex.: Cliente final"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Chave</Label>
              <Input
                value={form.key}
                onChange={(e) =>
                  setForm((f) => ({ ...f, key: slugify(e.target.value), keyTouched: true }))
                }
                placeholder="cliente_final"
                className="font-mono text-sm"
                disabled={isEdit}
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={form.field_type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, field_type: v as CustomFieldType }))
                }
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOM_FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {FIELD_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">Obrigatório</Label>
              <p className="text-xs text-muted-foreground">
                Avisa quando vazio em validações futuras.
              </p>
            </div>
            <Switch
              checked={form.required}
              onCheckedChange={(v) => setForm((f) => ({ ...f, required: v }))}
            />
          </div>

          {showOptions && (
            <div className="grid gap-2">
              <Label>Opções</Label>
              <div className="grid gap-2">
                {form.options.map((o) => (
                  <div key={o.value} className="flex items-center gap-2 rounded border bg-muted/40 px-2 py-1.5 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{o.value}</span>
                    <span className="flex-1">{o.label}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleRemoveOption(o.value)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="rótulo"
                    value={form.optionDraft.label}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        optionDraft: { ...f.optionDraft, label: e.target.value },
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddOption}>
                    <Plus className="mr-1 h-4 w-4" /> Adicionar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  A chave da opção é gerada automaticamente do rótulo.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Valor padrão (opcional)</Label>
            <Input
              value={form.default_value}
              onChange={(e) => setForm((f) => ({ ...f, default_value: e.target.value }))}
              placeholder={
                form.field_type === "checkbox"
                  ? "true | false"
                  : form.field_type === "multi_select"
                    ? "valor1,valor2"
                    : "—"
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Texto de ajuda (opcional)</Label>
            <Textarea
              value={form.help_text}
              onChange={(e) => setForm((f) => ({ ...f, help_text: e.target.value }))}
              rows={2}
              placeholder="Aparece abaixo do campo no formulário."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave || saving}>
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? "Salvar alterações" : "Criar campo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
