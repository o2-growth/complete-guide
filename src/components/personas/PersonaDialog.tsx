import { useEffect, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  type Persona,
  type PersonaInput,
  type SocialChannel,
  useCreatePersona,
  useUpdatePersona,
} from "@/hooks/usePersonas";

const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const CHANNELS: { value: SocialChannel; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "Email" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X" },
  { value: "whatsapp", label: "WhatsApp" },
];

const COLORS = ["#0EA5E9", "#7c3aed", "#ef4444", "#10b981", "#f59e0b", "#ec4899", "#64748b"];

interface PersonaDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  persona?: Persona | null;
}

export function PersonaDialog({ open, onOpenChange, persona }: PersonaDialogProps) {
  const create = useCreatePersona();
  const update = useUpdatePersona();
  const isEdit = !!persona;

  const [form, setForm] = useState<PersonaInput>({
    name: "",
    age_range: null,
    occupation: null,
    pain_points: [],
    goals: [],
    channels: [],
    bio: null,
    avatar_url: null,
    color: "#0EA5E9",
  });
  const [painInput, setPainInput] = useState("");
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => {
    if (open) {
      if (persona) {
        setForm({
          name: persona.name,
          age_range: persona.age_range,
          occupation: persona.occupation,
          pain_points: [...persona.pain_points],
          goals: [...persona.goals],
          channels: [...persona.channels],
          bio: persona.bio,
          avatar_url: persona.avatar_url,
          color: persona.color,
        });
      } else {
        setForm({
          name: "",
          age_range: null,
          occupation: null,
          pain_points: [],
          goals: [],
          channels: [],
          bio: null,
          avatar_url: null,
          color: "#0EA5E9",
        });
      }
      setPainInput("");
      setGoalInput("");
    }
  }, [open, persona]);

  const addPain = () => {
    const t = painInput.trim();
    if (!t) return;
    setForm((f) => ({ ...f, pain_points: [...(f.pain_points ?? []), t] }));
    setPainInput("");
  };
  const addGoal = () => {
    const t = goalInput.trim();
    if (!t) return;
    setForm((f) => ({ ...f, goals: [...(f.goals ?? []), t] }));
    setGoalInput("");
  };
  const removePain = (i: number) =>
    setForm((f) => ({ ...f, pain_points: (f.pain_points ?? []).filter((_, idx) => idx !== i) }));
  const removeGoal = (i: number) =>
    setForm((f) => ({ ...f, goals: (f.goals ?? []).filter((_, idx) => idx !== i) }));

  const toggleChannel = (c: SocialChannel) =>
    setForm((f) => {
      const cur = new Set(f.channels ?? []);
      if (cur.has(c)) cur.delete(c);
      else cur.add(c);
      return { ...f, channels: Array.from(cur) };
    });

  const submit = async () => {
    if (!form.name.trim()) return;
    if (isEdit && persona) {
      await update.mutateAsync({ id: persona.id, patch: form });
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
          <DialogTitle>{isEdit ? "Editar persona" : "Nova persona"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="persona-name">Nome *</Label>
              <Input
                id="persona-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Marina, gestora de marketing"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Faixa etária</Label>
              <Select
                value={form.age_range ?? "_"}
                onValueChange={(v) => setForm({ ...form, age_range: v === "_" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Não definida</SelectItem>
                  {AGE_RANGES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="persona-occupation">Ocupação</Label>
              <Input
                id="persona-occupation"
                value={form.occupation ?? ""}
                onChange={(e) => setForm({ ...form, occupation: e.target.value || null })}
                placeholder="Ex: Gerente de Marketing"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="persona-bio">Bio</Label>
              <Textarea
                id="persona-bio"
                rows={3}
                value={form.bio ?? ""}
                onChange={(e) => setForm({ ...form, bio: e.target.value || null })}
                placeholder="Quem é essa pessoa, contexto, comportamentos…"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="persona-avatar">URL do avatar</Label>
              <Input
                id="persona-avatar"
                value={form.avatar_url ?? ""}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value || null })}
                placeholder="https://…"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className="h-7 w-7 rounded-full border-2 transition"
                    style={{
                      background: c,
                      borderColor: form.color === c ? "hsl(var(--foreground))" : "transparent",
                    }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Dores</Label>
            <div className="flex gap-2">
              <Input
                value={painInput}
                onChange={(e) => setPainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPain();
                  }
                }}
                placeholder="Adicionar dor e Enter…"
              />
              <Button type="button" size="sm" variant="secondary" onClick={addPain}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(form.pain_points ?? []).length > 0 && (
              <ul className="mt-2 space-y-1">
                {(form.pain_points ?? []).map((p, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1 text-sm">
                    <span className="flex-1">{p}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removePain(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Objetivos</Label>
            <div className="flex gap-2">
              <Input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addGoal();
                  }
                }}
                placeholder="Adicionar objetivo e Enter…"
              />
              <Button type="button" size="sm" variant="secondary" onClick={addGoal}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(form.goals ?? []).length > 0 && (
              <ul className="mt-2 space-y-1">
                {(form.goals ?? []).map((g, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1 text-sm">
                    <span className="flex-1">{g}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeGoal(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Canais preferenciais</Label>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!form.name.trim() || pending} onClick={submit}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Salvar" : "Criar persona"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
