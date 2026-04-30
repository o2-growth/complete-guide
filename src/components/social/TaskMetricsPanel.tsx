import { useState } from "react";
import { BarChart3, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSaveMetric, useTaskMetrics, useDeleteMetric } from "@/hooks/useSocialContent";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  taskId: string;
}

const FIELDS: Array<{ key: "reach" | "impressions" | "likes" | "comments" | "saves" | "shares" | "clicks" | "followers_gained"; label: string }> = [
  { key: "reach", label: "Alcance" },
  { key: "impressions", label: "Impressões" },
  { key: "likes", label: "Curtidas" },
  { key: "comments", label: "Comentários" },
  { key: "saves", label: "Salvos" },
  { key: "shares", label: "Compart." },
  { key: "clicks", label: "Cliques" },
  { key: "followers_gained", label: "+Seguidores" },
];

export function TaskMetricsPanel({ taskId }: Props) {
  const { data: metrics = [], isLoading } = useTaskMetrics(taskId);
  const save = useSaveMetric();
  const del = useDeleteMetric();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, number>>({});

  const submit = async () => {
    await save.mutateAsync({ task_id: taskId, ...form });
    setForm({});
    setOpen(false);
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-primary" /> Métricas
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(!open)}>
          <Plus className="mr-1 h-3 w-3" /> Registrar
        </Button>
      </div>

      {open && (
        <div className="space-y-2 rounded border bg-background p-2">
          <div className="grid grid-cols-2 gap-2">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <Label className="text-[10px]">{f.label}</Label>
                <Input
                  type="number"
                  className="h-7 text-xs"
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) || 0 })}
                />
              </div>
            ))}
          </div>
          <Button size="sm" onClick={submit} disabled={save.isPending} className="w-full">
            {save.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Salvar coleta
          </Button>
        </div>
      )}

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : metrics.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">Nenhuma coleta registrada ainda.</p>
      ) : (
        <div className="space-y-1.5">
          {metrics.map((m) => (
            <div key={m.id} className="rounded border bg-background p-2 text-[11px]">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold">
                  {format(new Date(m.collected_at), "dd MMM yyyy HH:mm", { locale: ptBR })}
                </span>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => del.mutate(m.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {FIELDS.map((f) => {
                  const val = m[f.key] ?? 0;
                  if (!val) return null;
                  return <Badge key={f.key} variant="outline" className="text-[9px]">{f.label}: {val.toLocaleString("pt-BR")}</Badge>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
