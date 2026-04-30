import { useState } from "react";
import { Plus, Trash2, Pencil, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useSLAPolicies,
  useUpsertSLAPolicy,
  useDeleteSLAPolicy,
  type SLAPolicy,
  type Priority,
} from "@/hooks/useSLA";
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { Skeleton } from "@/components/ui/skeleton";

const PRIORITIES: { value: Priority | "any"; label: string }[] = [
  { value: "any", label: "Qualquer prioridade" },
  { value: "urgent", label: "Urgente" },
  { value: "high", label: "Alta" },
  { value: "medium", label: "Média" },
  { value: "low", label: "Baixa" },
  { value: "none", label: "Sem prioridade" },
];

function PolicyDialog({
  policy,
  trigger,
}: {
  policy?: SLAPolicy;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { data: types = [] } = useTaskTypes();
  const upsert = useUpsertSLAPolicy();

  const [form, setForm] = useState({
    name: policy?.name ?? "",
    type_id: policy?.type_id ?? "any",
    priority: (policy?.priority ?? "any") as Priority | "any",
    response_hours: policy?.response_hours ?? 4,
    resolution_hours: policy?.resolution_hours ?? 24,
    warning_threshold_pct: policy?.warning_threshold_pct ?? 75,
    business_hours_only: policy?.business_hours_only ?? false,
    active: policy?.active ?? true,
  });

  const submit = async () => {
    if (!form.name.trim()) return;
    await upsert.mutateAsync({
      ...(policy?.id ? { id: policy.id } : {}),
      name: form.name.trim(),
      type_id: form.type_id === "any" ? null : (form.type_id as string),
      priority: form.priority === "any" ? null : (form.priority as Priority),
      response_hours: Number(form.response_hours),
      resolution_hours: Number(form.resolution_hours),
      warning_threshold_pct: Number(form.warning_threshold_pct),
      business_hours_only: form.business_hours_only,
      active: form.active,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{policy ? "Editar SLA" : "Nova política SLA"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Conteúdo IG · Prioridade Alta"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de tarefa</Label>
              <Select value={form.type_id} onValueChange={(v) => setForm({ ...form, type_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer tipo</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority | "any" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>1ª resposta (h)</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={form.response_hours}
                onChange={(e) => setForm({ ...form, response_hours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Resolução (h)</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={form.resolution_hours}
                onChange={(e) => setForm({ ...form, resolution_hours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Alerta em (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.warning_threshold_pct}
                onChange={(e) => setForm({ ...form, warning_threshold_pct: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">Política ativa</Label>
              <p className="text-xs text-muted-foreground">Aplicada automaticamente às tarefas correspondentes</p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(c) => setForm({ ...form, active: c })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!form.name.trim() || upsert.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SLAPage() {
  const { data: policies = [], isLoading } = useSLAPolicies();
  const { data: types = [] } = useTaskTypes();
  const remove = useDeleteSLAPolicy();

  const typeName = (id: string | null) =>
    id ? types.find((t) => t.id === id)?.name ?? "—" : "Qualquer tipo";

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            SLAs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Defina prazos de resposta e resolução por tipo de tarefa e prioridade. Tarefas que ultrapassam o limite são sinalizadas automaticamente.
          </p>
        </div>
        <PolicyDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nova política
            </Button>
          }
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      )}

      {!isLoading && policies.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium">Nenhuma política configurada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie sua primeira política para começar a monitorar SLAs.
            </p>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {policies.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{p.name}</h3>
                  {!p.active && <Badge variant="outline">Inativa</Badge>}
                  <Badge variant="secondary">{typeName(p.type_id)}</Badge>
                  {p.priority && (
                    <Badge variant="outline" className="capitalize">{p.priority}</Badge>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">1ª resposta</p>
                    <p className="font-medium">{p.response_hours}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Resolução</p>
                    <p className="font-medium">{p.resolution_hours}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Alerta em</p>
                    <p className="font-medium">{p.warning_threshold_pct}%</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <PolicyDialog
                  policy={p}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Remover "${p.name}"?`)) remove.mutate(p.id);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}