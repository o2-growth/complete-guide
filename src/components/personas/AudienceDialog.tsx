import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type Audience,
  type AudienceInput,
  useCreateAudience,
  useUpdateAudience,
} from "@/hooks/useAudiences";
import { type Persona, type SocialChannel } from "@/hooks/usePersonas";

const CHANNELS: { value: SocialChannel; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "Email" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X" },
  { value: "whatsapp", label: "WhatsApp" },
];

interface AudienceDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  audience?: Audience | null;
  personas: Persona[];
}

export function AudienceDialog({ open, onOpenChange, audience, personas }: AudienceDialogProps) {
  const create = useCreateAudience();
  const update = useUpdateAudience();
  const isEdit = !!audience;

  const [form, setForm] = useState<AudienceInput>({
    name: "",
    description: null,
    persona_ids: [],
    channels: [],
    size_estimate: null,
  });

  useEffect(() => {
    if (open) {
      if (audience) {
        setForm({
          name: audience.name,
          description: audience.description,
          persona_ids: [...audience.persona_ids],
          channels: [...audience.channels],
          size_estimate: audience.size_estimate,
        });
      } else {
        setForm({
          name: "",
          description: null,
          persona_ids: [],
          channels: [],
          size_estimate: null,
        });
      }
    }
  }, [open, audience]);

  const togglePersona = (id: string) =>
    setForm((f) => {
      const cur = new Set(f.persona_ids ?? []);
      if (cur.has(id)) cur.delete(id);
      else cur.add(id);
      return { ...f, persona_ids: Array.from(cur) };
    });

  const toggleChannel = (c: SocialChannel) =>
    setForm((f) => {
      const cur = new Set(f.channels ?? []);
      if (cur.has(c)) cur.delete(c);
      else cur.add(c);
      return { ...f, channels: Array.from(cur) };
    });

  const submit = async () => {
    if (!form.name.trim()) return;
    if (isEdit && audience) {
      await update.mutateAsync({ id: audience.id, patch: form });
    } else {
      await create.mutateAsync(form);
    }
    onOpenChange(false);
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar público" : "Novo público"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="audience-name">Nome *</Label>
            <Input
              id="audience-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Decisores B2B SaaS"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="audience-description">Descrição</Label>
            <Textarea
              id="audience-description"
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value || null })}
              placeholder="Critérios, contexto, comportamento esperado…"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Personas vinculadas</Label>
            {personas.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Crie personas antes de vinculá-las a um público.
              </p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
                {personas.map((p) => {
                  const checked = (form.persona_ids ?? []).includes(p.id);
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 rounded p-1.5 hover:bg-muted/40"
                    >
                      <Checkbox
                        id={`p-${p.id}`}
                        checked={checked}
                        onCheckedChange={() => togglePersona(p.id)}
                      />
                      <label
                        htmlFor={`p-${p.id}`}
                        className="flex flex-1 cursor-pointer items-center gap-2 text-sm"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: p.color }}
                          aria-hidden
                        />
                        <span className="truncate">{p.name}</span>
                        {p.occupation && (
                          <span className="ml-1 truncate text-xs text-muted-foreground">
                            · {p.occupation}
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Canais</Label>
            <div className="flex flex-wrap gap-1.5">
              {CHANNELS.map((c) => {
                const active = (form.channels ?? []).includes(c.value);
                return (
                  <Badge
                    key={c.value}
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleChannel(c.value)}
                  >
                    {c.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="audience-size">Tamanho estimado</Label>
            <Input
              id="audience-size"
              type="number"
              min={0}
              value={form.size_estimate ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  size_estimate: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Ex: 12000"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!form.name.trim() || pending} onClick={submit}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Salvar" : "Criar público"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
