import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  TEMPLATE_KIND_LABELS,
  TEMPLATE_KINDS,
  useCreateTemplate,
  useUpdateTemplate,
  type TemplateBody,
  type TemplateKind,
  type UnifiedTemplate,
} from "@/hooks/useUnifiedTemplates";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: UnifiedTemplate | null;
  defaultKind?: TemplateKind;
}

const DEFAULT_BODY: Record<TemplateKind, TemplateBody> = {
  project: { name: "", description: "", sections: [] },
  task_checklist: { items: [] },
  message: { subject: "", body: "", variables: [] },
  form: { fields: [] },
  brief: { context: "", target: "", deliverables: "", deadline_template: "" },
  content_caption: { text: "", channels: [] },
  hashtag_group: { tags: [] },
};

/**
 * Editor genérico com dispatch interno por kind. Para tipos compostos
 * (project/form/checklist), expomos JSON cru — a UX especializada por kind
 * fica para uma sub-fase. Para text-first kinds, há campos dedicados.
 */
export function TemplateEditorDialog({ open, onOpenChange, template, defaultKind }: Props) {
  const isEditing = !!template;
  const create = useCreateTemplate();
  const update = useUpdateTemplate();

  const [kind, setKind] = useState<TemplateKind>(template?.kind ?? defaultKind ?? "task_checklist");
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [tagsRaw, setTagsRaw] = useState((template?.tags ?? []).join(", "));
  const [isPinned, setIsPinned] = useState(template?.is_pinned ?? false);
  const [bodyDraft, setBodyDraft] = useState<TemplateBody>(template?.body ?? DEFAULT_BODY[template?.kind ?? defaultKind ?? "task_checklist"]);

  useEffect(() => {
    if (!open) return;
    setKind(template?.kind ?? defaultKind ?? "task_checklist");
    setName(template?.name ?? "");
    setDescription(template?.description ?? "");
    setTagsRaw((template?.tags ?? []).join(", "));
    setIsPinned(template?.is_pinned ?? false);
    setBodyDraft(template?.body ?? DEFAULT_BODY[template?.kind ?? defaultKind ?? "task_checklist"]);
  }, [open, template, defaultKind]);

  // Quando kind muda em criação, reseta body para template do kind.
  useEffect(() => {
    if (isEditing) return;
    setBodyDraft(DEFAULT_BODY[kind]);
  }, [kind, isEditing]);

  const tags = useMemo(
    () =>
      tagsRaw
        .split(",")
        .map((t) => t.trim().replace(/^#+/, ""))
        .filter(Boolean),
    [tagsRaw],
  );

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Dê um nome ao modelo");
      return;
    }
    try {
      if (isEditing && template) {
        await update.mutateAsync({
          id: template.id,
          patch: {
            name: name.trim(),
            description: description.trim() || null,
            body: bodyDraft,
            tags,
            is_pinned: isPinned,
          },
        });
      } else {
        await create.mutateAsync({
          kind,
          name: name.trim(),
          description: description.trim() || null,
          body: bodyDraft,
          tags,
          is_pinned: isPinned,
        });
      }
      onOpenChange(false);
    } catch {
      // toast já tratado nas mutations
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar modelo" : "Novo modelo"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-kind">Tipo</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as TemplateKind)} disabled={isEditing}>
                <SelectTrigger id="tpl-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {TEMPLATE_KIND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Nome</Label>
              <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Checklist de pré-publicação" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-desc">Descrição</Label>
            <Textarea id="tpl-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Para que serve este modelo?" rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-tags">Tags (separadas por vírgula)</Label>
            <Input id="tpl-tags" value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="lancamento, social, ig" />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="tpl-pin" checked={isPinned} onCheckedChange={setIsPinned} />
            <Label htmlFor="tpl-pin" className="cursor-pointer text-sm">
              Fixar no topo
            </Label>
          </div>

          <KindBodyEditor kind={kind} value={bodyDraft} onChange={setBodyDraft} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {isEditing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface KindBodyProps {
  kind: TemplateKind;
  value: TemplateBody;
  onChange: (next: TemplateBody) => void;
}

function KindBodyEditor({ kind, value, onChange }: KindBodyProps) {
  switch (kind) {
    case "task_checklist":
      return <ChecklistBody value={value} onChange={onChange} />;
    case "message":
      return <MessageBody value={value} onChange={onChange} />;
    case "content_caption":
      return <CaptionBody value={value} onChange={onChange} />;
    case "hashtag_group":
      return <HashtagBody value={value} onChange={onChange} />;
    case "brief":
      return <BriefBody value={value} onChange={onChange} />;
    default:
      return <JsonBody kind={kind} value={value} onChange={onChange} />;
  }
}

/* ---------------- task_checklist ---------------- */
function ChecklistBody({ value, onChange }: { value: TemplateBody; onChange: (v: TemplateBody) => void }) {
  const items = (value as { items?: Array<{ text: string; required: boolean }> }).items ?? [];
  const setItems = (next: Array<{ text: string; required: boolean }>) => onChange({ items: next });
  return (
    <div className="space-y-2">
      <Label>Itens do checklist</Label>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={it.text}
              onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
              placeholder={`Item ${i + 1}`}
            />
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <Switch
                checked={it.required}
                onCheckedChange={(v) => setItems(items.map((x, j) => (j === i ? { ...x, required: v } : x)))}
              />
              Obrig.
            </label>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setItems(items.filter((_, j) => j !== i))}>
              ×
            </Button>
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={() => setItems([...items, { text: "", required: false }])}>
        + Adicionar item
      </Button>
    </div>
  );
}

/* ---------------- message ---------------- */
function MessageBody({ value, onChange }: { value: TemplateBody; onChange: (v: TemplateBody) => void }) {
  const v = value as { subject?: string; body?: string };
  return (
    <div className="space-y-2">
      <Label>Assunto (opcional)</Label>
      <Input value={v.subject ?? ""} onChange={(e) => onChange({ ...v, subject: e.target.value, body: v.body ?? "" })} placeholder="Olá, {{first_name}}!" />
      <Label>Corpo (use {`{{variavel}}`} para placeholders)</Label>
      <Textarea
        value={v.body ?? ""}
        onChange={(e) => onChange({ ...v, body: e.target.value })}
        rows={6}
        placeholder={"Olá, {{first_name}}!\n\nObrigado por…"}
      />
    </div>
  );
}

/* ---------------- content_caption ---------------- */
function CaptionBody({ value, onChange }: { value: TemplateBody; onChange: (v: TemplateBody) => void }) {
  const v = value as { text?: string; channels?: string[] };
  const channels = v.channels ?? [];
  const toggle = (ch: string) => {
    const next = channels.includes(ch) ? channels.filter((c) => c !== ch) : [...channels, ch];
    onChange({ text: v.text ?? "", channels: next });
  };
  const all = ["instagram", "linkedin", "tiktok", "facebook", "youtube", "twitter", "email"];
  return (
    <div className="space-y-2">
      <Label>Texto da legenda</Label>
      <Textarea value={v.text ?? ""} onChange={(e) => onChange({ ...v, text: e.target.value, channels })} rows={5} />
      <Label>Canais aplicáveis</Label>
      <div className="flex flex-wrap gap-1.5">
        {all.map((ch) => (
          <Button
            key={ch}
            type="button"
            size="sm"
            variant={channels.includes(ch) ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => toggle(ch)}
          >
            {ch}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- hashtag_group ---------------- */
function HashtagBody({ value, onChange }: { value: TemplateBody; onChange: (v: TemplateBody) => void }) {
  const tags = ((value as { tags?: string[] }).tags ?? []).join(" ");
  return (
    <div className="space-y-2">
      <Label>Hashtags (separadas por espaço ou vírgula)</Label>
      <Textarea
        value={tags}
        onChange={(e) =>
          onChange({
            tags: e.target.value
              .split(/[\s,]+/)
              .map((t) => t.replace(/^#+/, ""))
              .filter(Boolean),
          })
        }
        rows={3}
        placeholder="growth marketing b2b saas"
      />
    </div>
  );
}

/* ---------------- brief ---------------- */
function BriefBody({ value, onChange }: { value: TemplateBody; onChange: (v: TemplateBody) => void }) {
  const v = value as { context?: string; target?: string; deliverables?: string; deadline_template?: string };
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Contexto</Label>
        <Textarea value={v.context ?? ""} onChange={(e) => onChange({ ...v, context: e.target.value })} rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label>Público</Label>
        <Textarea value={v.target ?? ""} onChange={(e) => onChange({ ...v, target: e.target.value })} rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label>Entregáveis</Label>
        <Textarea value={v.deliverables ?? ""} onChange={(e) => onChange({ ...v, deliverables: e.target.value })} rows={2} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Prazo padrão</Label>
        <Input value={v.deadline_template ?? ""} onChange={(e) => onChange({ ...v, deadline_template: e.target.value })} placeholder="ex.: 7 dias após kickoff" />
      </div>
    </div>
  );
}

/* ---------------- fallback (project, form): JSON cru ---------------- */
function JsonBody({ kind, value, onChange }: { kind: TemplateKind; value: TemplateBody; onChange: (v: TemplateBody) => void }) {
  const [text, setText] = useState(JSON.stringify(value ?? {}, null, 2));
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setText(JSON.stringify(value ?? {}, null, 2));
  }, [value]);
  return (
    <div className="space-y-2">
      <Label>Body ({TEMPLATE_KIND_LABELS[kind]}) — JSON</Label>
      <Textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            const parsed = JSON.parse(e.target.value || "{}");
            onChange(parsed);
            setErr(null);
          } catch (ex) {
            setErr(ex instanceof Error ? ex.message : "JSON inválido");
          }
        }}
        rows={8}
        className="font-mono text-xs"
      />
      {err && <p className="text-xs text-destructive">{err}</p>}
      <p className="text-[11px] text-muted-foreground">
        Editor visual para este tipo virá em sub-fase futura. Por enquanto edite o JSON conforme a estrutura documentada no patch SQL.
      </p>
    </div>
  );
}
