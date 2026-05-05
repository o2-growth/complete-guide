import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { BarChart3, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { toast } from "sonner";
import {
  useDashboards,
  useDashboard,
  useCreateDashboard,
  useDeleteDashboard,
  useReorderWidgets,
  useRemoveWidget,
  type DashboardWidget,
} from "@/hooks/useDashboards";
import { SortableWidget } from "@/components/dashboard/widgets/SortableWidget";
import { AddWidgetDialog } from "@/components/dashboard/widgets/AddWidgetDialog";
import { WidgetConfigDialog } from "@/components/dashboard/widgets/WidgetConfigDialog";

const ACTIVE_KEY = "oxy.activeDashboardId";

export default function DashboardPage() {
  const { data: dashboards, isLoading: loadingList } = useDashboards();
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACTIVE_KEY);
  });

  // Sincroniza com lista (selecionar primeiro disponível se nenhum ativo).
  useEffect(() => {
    if (!dashboards || dashboards.length === 0) return;
    if (!activeId || !dashboards.some((d) => d.id === activeId)) {
      const next = dashboards[0].id;
      setActiveId(next);
      window.localStorage.setItem(ACTIVE_KEY, next);
    }
  }, [dashboards, activeId]);

  const { data: dash, isLoading: loadingDash } = useDashboard(activeId);

  const [editing, setEditing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [configWidget, setConfigWidget] = useState<DashboardWidget | null>(null);

  const removeWidget = useRemoveWidget();
  const reorderWidgets = useReorderWidgets();
  const deleteDashboard = useDeleteDashboard();

  // Cópia local da ordem para drag-drop fluido (otimismo + persistência on drop).
  const [localWidgets, setLocalWidgets] = useState<DashboardWidget[]>([]);
  useEffect(() => {
    if (dash?.widgets) setLocalWidgets(dash.widgets);
  }, [dash?.widgets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const widgetIds = useMemo(() => localWidgets.map((w) => w.id), [localWidgets]);

  function handleSelectDashboard(id: string) {
    setActiveId(id);
    window.localStorage.setItem(ACTIVE_KEY, id);
    setEditing(false);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localWidgets.findIndex((w) => w.id === active.id);
    const newIndex = localWidgets.findIndex((w) => w.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(localWidgets, oldIndex, newIndex);
    setLocalWidgets(next);
    if (!dash) return;
    await reorderWidgets.mutateAsync({
      dashboard_id: dash.id,
      order: next.map((w, i) => ({ id: w.id, position: i })),
    });
  }

  async function handleRemoveWidget(w: DashboardWidget) {
    if (!confirm(`Remover widget "${w.title}"?`)) return;
    await removeWidget.mutateAsync({ id: w.id, dashboard_id: w.dashboard_id });
  }

  async function handleDeleteDashboard() {
    if (!dash) return;
    await deleteDashboard.mutateAsync(dash.id);
    setDeleteOpen(false);
    setEditing(false);
    setActiveId(null);
    window.localStorage.removeItem(ACTIVE_KEY);
  }

  if (loadingList) {
    return (
      <div className="p-6 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando dashboards…
      </div>
    );
  }

  // Empty state — sem nenhum dashboard ainda.
  if (!dashboards || dashboards.length === 0) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="border rounded-xl p-10 text-center space-y-4">
          <BarChart3 className="h-10 w-10 text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-semibold">Nenhum dashboard ainda</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Crie seu primeiro dashboard para visualizar KPIs, gráficos e listas no jeito do seu time.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo dashboard
          </Button>
        </div>
        <CreateDashboardDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => handleSelectDashboard(id)} />
      </div>
    );
  }

  const nextPosition = localWidgets.length > 0 ? Math.max(...localWidgets.map((w) => w.position)) + 1 : 0;

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <Select value={activeId ?? undefined} onValueChange={handleSelectDashboard}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione um dashboard" />
            </SelectTrigger>
            <SelectContent>
              {dashboards.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo dashboard
          </Button>
          {dash && (
            <>
              {editing ? (
                <>
                  <Button size="sm" onClick={() => setAddOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar widget
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                    className="text-red-600 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Sair da edição
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {dash?.description && (
        <p className="text-sm text-muted-foreground">{dash.description}</p>
      )}

      {loadingDash && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
        </div>
      )}

      {!loadingDash && dash && localWidgets.length === 0 && (
        <div className="border rounded-xl p-10 text-center space-y-4">
          <BarChart3 className="h-10 w-10 text-primary mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Dashboard vazio</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione widgets para começar.
            </p>
          </div>
          <Button onClick={() => { setEditing(true); setAddOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar widget
          </Button>
        </div>
      )}

      {!loadingDash && localWidgets.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
            <div
              className="grid gap-3 auto-rows-min"
              style={{
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              }}
            >
              {localWidgets.map((w) => (
                <SortableWidget
                  key={w.id}
                  widget={w}
                  editing={editing}
                  onEdit={(x) => setConfigWidget(x)}
                  onRemove={handleRemoveWidget}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Dialogs */}
      <CreateDashboardDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => handleSelectDashboard(id)}
      />
      {dash && (
        <AddWidgetDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          dashboardId={dash.id}
          nextPosition={nextPosition}
        />
      )}
      <WidgetConfigDialog
        open={!!configWidget}
        onOpenChange={(v) => !v && setConfigWidget(null)}
        widget={configWidget}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir dashboard?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o dashboard "{dash?.name}" e todos os seus widgets. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDashboard}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateDashboardDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateDashboard();

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.info("Informe um nome");
      return;
    }
    const id = await create.mutateAsync({
      name: trimmed,
      description: description.trim() || null,
    });
    onCreated(id);
    setName("");
    setDescription("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo dashboard</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Visão geral, Squad IA, Mídia paga"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={create.isPending}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
