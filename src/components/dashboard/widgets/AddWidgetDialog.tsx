import { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { WIDGET_CATALOG, type WidgetCatalogItem } from "./widget-catalog";
import { useAddWidget } from "@/hooks/useDashboards";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dashboardId: string;
  nextPosition: number;
}

export function AddWidgetDialog({ open, onOpenChange, dashboardId, nextPosition }: Props) {
  const [selected, setSelected] = useState<WidgetCatalogItem | null>(null);
  const [title, setTitle] = useState("");
  const addWidget = useAddWidget();

  function reset() {
    setSelected(null);
    setTitle("");
  }

  async function handleAdd() {
    if (!selected) return;
    await addWidget.mutateAsync({
      dashboard_id: dashboardId,
      kind: selected.kind,
      title: title.trim() || selected.label,
      config: selected.defaultConfig,
      width: selected.defaultWidth,
      height: selected.defaultHeight,
      position: nextPosition,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar widget</DialogTitle>
          <DialogDescription>
            Escolha um tipo de widget para incluir no dashboard.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[420px] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {WIDGET_CATALOG.map((item) => {
              const Icon = item.icon;
              const isSelected = selected?.kind === item.kind;
              return (
                <button
                  key={item.kind}
                  type="button"
                  onClick={() => {
                    setSelected(item);
                    if (!title) setTitle(item.label);
                  }}
                  className={cn(
                    "text-left p-3 rounded-lg border transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {selected && (
          <div className="space-y-2">
            <Label htmlFor="widget-title">Título</Label>
            <Input
              id="widget-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selected.label}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={!selected || addWidget.isPending}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
