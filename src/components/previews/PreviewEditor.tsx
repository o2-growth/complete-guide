import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PreviewSwitcher } from "./PreviewSwitcher";
import { PREVIEW_LABELS, PreviewContent, PreviewKind, getTaskPreview } from "./preview-utils";

interface Props {
  customFields: Record<string, unknown> | null | undefined;
  onSave: (next: Record<string, unknown>) => void;
}

/**
 * Editor + preview em tempo real. Salva em custom_fields.preview no blur dos campos.
 */
export function PreviewEditor({ customFields, onSave }: Props) {
  const initial = getTaskPreview(customFields);
  const [draft, setDraft] = useState<PreviewContent>(initial);

  // Reset quando troca de task
  useEffect(() => {
    setDraft(getTaskPreview(customFields));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(customFields?.preview ?? {})]);

  const persist = (patch: Partial<PreviewContent>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
  };

  const flush = () => {
    const merged = { ...(customFields ?? {}), preview: draft };
    onSave(merged);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select
            value={draft.kind}
            onValueChange={(v) => {
              persist({ kind: v as PreviewKind });
              setTimeout(flush, 0);
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PREVIEW_LABELS) as PreviewKind[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {PREVIEW_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">URL da imagem / criativo</Label>
          <Input
            value={draft.imageUrl ?? ""}
            onChange={(e) => persist({ imageUrl: e.target.value })}
            onBlur={flush}
            placeholder="https://…"
            className="h-9"
          />
        </div>

        {(draft.kind === "ig_story" || draft.kind === "email") && (
          <div className="space-y-1">
            <Label className="text-xs">Headline / título</Label>
            <Input
              value={draft.headline ?? ""}
              onChange={(e) => persist({ headline: e.target.value })}
              onBlur={flush}
              className="h-9"
            />
          </div>
        )}

        {draft.kind === "email" && (
          <div className="space-y-1">
            <Label className="text-xs">Assunto do e-mail</Label>
            <Input
              value={draft.subject ?? ""}
              onChange={(e) => persist({ subject: e.target.value })}
              onBlur={flush}
              className="h-9"
            />
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs">
            {draft.kind === "email" ? "Corpo do e-mail" : "Legenda / texto"}
          </Label>
          <Textarea
            value={draft.caption ?? ""}
            onChange={(e) => persist({ caption: e.target.value })}
            onBlur={flush}
            rows={6}
            placeholder={
              draft.kind === "linkedin"
                ? "Hook nos 3 primeiros parágrafos…"
                : "Legenda + #hashtags"
            }
          />
        </div>

        {(draft.kind === "ig_story" || draft.kind === "email") && (
          <div className="space-y-1">
            <Label className="text-xs">CTA</Label>
            <Input
              value={draft.ctaLabel ?? ""}
              onChange={(e) => persist({ ctaLabel: e.target.value })}
              onBlur={flush}
              placeholder={draft.kind === "email" ? "Assinar agora" : "Saiba mais"}
              className="h-9"
            />
          </div>
        )}
      </div>

      <div className="flex items-start justify-center rounded-lg border bg-muted/20 p-4">
        <PreviewSwitcher content={draft} defaultKind={draft.kind} showSwitcher={false} />
      </div>
    </div>
  );
}
