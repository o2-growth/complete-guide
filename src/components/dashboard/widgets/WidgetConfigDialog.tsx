import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import type { DashboardWidget } from "@/hooks/useDashboards";
import { useUpdateWidget } from "@/hooks/useDashboards";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  widget: DashboardWidget | null;
}

export function WidgetConfigDialog({ open, onOpenChange, widget }: Props) {
  const [title, setTitle] = useState("");
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const updateWidget = useUpdateWidget();

  useEffect(() => {
    if (widget) {
      setTitle(widget.title);
      setWidth(widget.width);
      setHeight(widget.height);
      setConfig({ ...(widget.config ?? {}) });
    }
  }, [widget]);

  if (!widget) return null;

  async function handleSave() {
    if (!widget) return;
    await updateWidget.mutateAsync({
      id: widget.id,
      dashboard_id: widget.dashboard_id,
      title,
      width,
      height,
      config,
    });
    onOpenChange(false);
  }

  function setCfg(key: string, value: unknown) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  // Renderiza campos específicos por kind.
  function renderKindFields() {
    switch (widget!.kind) {
      case "kpi":
        return (
          <>
            <div className="space-y-2">
              <Label>Métrica</Label>
              <Select
                value={(config.metric as string) ?? "total"}
                onValueChange={(v) => setCfg("metric", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Total</SelectItem>
                  <SelectItem value="done">Concluídas</SelectItem>
                  <SelectItem value="overdue">Atrasadas</SelectItem>
                  <SelectItem value="spent_hours">Tempo gasto (h)</SelectItem>
                  <SelectItem value="cycle_avg">Ciclo médio (h)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <RangeField config={config} setCfg={setCfg} />
          </>
        );
      case "chart_bar":
        return (
          <>
            <div className="space-y-2">
              <Label>Dimensão</Label>
              <Select
                value={(config.dimension as string) ?? "assignee"}
                onValueChange={(v) => setCfg("dimension", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignee">Por responsável</SelectItem>
                  <SelectItem value="status">Por status</SelectItem>
                  <SelectItem value="type">Por tipo</SelectItem>
                  <SelectItem value="priority">Por prioridade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <RangeField config={config} setCfg={setCfg} />
          </>
        );
      case "chart_line":
        return <RangeField config={config} setCfg={setCfg} />;
      case "chart_donut":
        return (
          <>
            <div className="space-y-2">
              <Label>Dimensão</Label>
              <Select
                value={(config.dimension as string) ?? "status"}
                onValueChange={(v) => setCfg("dimension", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Por status</SelectItem>
                  <SelectItem value="type">Por tipo</SelectItem>
                  <SelectItem value="priority">Por prioridade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <RangeField config={config} setCfg={setCfg} />
          </>
        );
      case "task_list":
        return (
          <>
            <div className="space-y-2">
              <Label>Filtro</Label>
              <Select
                value={(config.filter as string) ?? "open"}
                onValueChange={(v) => setCfg("filter", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="open">Abertas</SelectItem>
                  <SelectItem value="overdue">Atrasadas</SelectItem>
                  <SelectItem value="done">Concluídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Limite</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={(config.limit as number) ?? 8}
                onChange={(e) => setCfg("limit", Number(e.target.value) || 8)}
              />
            </div>
            <RangeField config={config} setCfg={setCfg} />
          </>
        );
      case "recent_activity":
      case "goals_progress":
        return (
          <div className="space-y-2">
            <Label>Limite</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={(config.limit as number) ?? 8}
              onChange={(e) => setCfg("limit", Number(e.target.value) || 8)}
            />
          </div>
        );
      case "embed":
        return (
          <div className="space-y-2">
            <Label>URL (https)</Label>
            <Input
              type="url"
              value={(config.url as string) ?? ""}
              onChange={(e) => setCfg("url", e.target.value)}
              placeholder="https://..."
            />
          </div>
        );
      case "markdown":
        return (
          <div className="space-y-2">
            <Label>Conteúdo Markdown</Label>
            <Textarea
              rows={8}
              value={(config.content as string) ?? ""}
              onChange={(e) => setCfg("content", e.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Largura (1-4)</Label>
              <Input
                type="number"
                min={1}
                max={4}
                value={width}
                onChange={(e) => setWidth(Math.min(4, Math.max(1, Number(e.target.value) || 1)))}
              />
            </div>
            <div className="space-y-2">
              <Label>Altura (1-4)</Label>
              <Input
                type="number"
                min={1}
                max={4}
                value={height}
                onChange={(e) => setHeight(Math.min(4, Math.max(1, Number(e.target.value) || 1)))}
              />
            </div>
          </div>

          {renderKindFields()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateWidget.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RangeField({
  config,
  setCfg,
}: {
  config: Record<string, unknown>;
  setCfg: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Período</Label>
      <Select
        value={(config.range as string) ?? "30d"}
        onValueChange={(v) => setCfg("range", v)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Últimos 7 dias</SelectItem>
          <SelectItem value="30d">Últimos 30 dias</SelectItem>
          <SelectItem value="90d">Últimos 90 dias</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
