import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { useProjects } from "@/hooks/useProjects";
import {
  useCreateFieldDefinition,
  useCustomFieldDefinitions,
  useDeleteFieldDefinition,
  useReorderFieldDefinitions,
  useUpdateFieldDefinition,
  type CustomFieldDefinition,
  type CustomFieldDefinitionInput,
  type CustomFieldScope,
} from "@/hooks/useCustomFields";
import { FieldDefinitionDialog } from "./_components/custom-fields/FieldDefinitionDialog";

const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "Texto",
  textarea: "Texto longo",
  number: "Número",
  date: "Data",
  datetime: "Data/hora",
  select: "Seleção",
  multi_select: "Multi-seleção",
  checkbox: "Checkbox",
  url: "URL",
  email: "E-mail",
  phone: "Telefone",
  currency: "Moeda",
  rating: "Estrelas",
  user: "Usuário",
  tag: "Tag",
  file: "Arquivo",
  formula: "Fórmula",
};

interface SortableRowProps {
  def: CustomFieldDefinition;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableRow({ def, onEdit, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: def.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="border">
      <CardContent className="flex items-center gap-3 p-3">
        <button
          aria-label="Reordenar"
          className="cursor-grab text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{def.label}</span>
            <Badge variant="outline" className="text-[10px]">
              {FIELD_TYPE_LABEL[def.field_type] ?? def.field_type}
            </Badge>
            {def.required && (
              <Badge variant="secondary" className="text-[10px]">
                Obrigatório
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <code className="font-mono">{def.key}</code>
            {def.help_text && <span className="truncate">· {def.help_text}</span>}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

interface ScopeSectionProps {
  scope: CustomFieldScope;
  taskTypeId?: string | null;
  projectId?: string | null;
}

function ScopeSection({ scope, taskTypeId, projectId }: ScopeSectionProps) {
  const { data, isLoading } = useCustomFieldDefinitions({
    scope,
    task_type_id: scope === "task_type" ? taskTypeId ?? null : undefined,
    project_id: scope === "project" ? projectId ?? null : undefined,
  });

  const create = useCreateFieldDefinition();
  const update = useUpdateFieldDefinition();
  const remove = useDeleteFieldDefinition();
  const reorder = useReorderFieldDefinitions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomFieldDefinition | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CustomFieldDefinition | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const items = useMemo(() => data ?? [], [data]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(items, oldIdx, newIdx);
    reorder.mutate(next.map((d, i) => ({ id: d.id, position: i })));
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (def: CustomFieldDefinition) => {
    setEditing(def);
    setDialogOpen(true);
  };

  const handleSubmit = async (input: CustomFieldDefinitionInput) => {
    if (editing) {
      await update.mutateAsync({
        id: editing.id,
        patch: {
          label: input.label,
          required: input.required,
          help_text: input.help_text,
          default_value: input.default_value,
          options: input.options,
        },
      });
    } else {
      await create.mutateAsync(input);
    }
    setDialogOpen(false);
  };

  const needsScopeRef =
    (scope === "task_type" && !taskTypeId) || (scope === "project" && !projectId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {scope === "global"
            ? "Estes campos aparecem em todas as tarefas do workspace."
            : scope === "task_type"
              ? "Selecione um tipo de tarefa para ver/criar campos exclusivos dele."
              : "Selecione um projeto para ver/criar campos exclusivos dele."}
        </p>
        <Button onClick={openCreate} disabled={needsScopeRef}>
          <Plus className="mr-2 h-4 w-4" />
          Novo campo
        </Button>
      </div>

      {needsScopeRef ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          Selecione um {scope === "task_type" ? "tipo de tarefa" : "projeto"} acima para começar.
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum campo customizado neste escopo. Clique em <strong>Novo campo</strong> para começar.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((def) => (
                <SortableRow
                  key={def.id}
                  def={def}
                  onEdit={() => openEdit(def)}
                  onDelete={() => setConfirmDelete(def)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <FieldDefinitionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        scope={scope}
        taskTypeId={taskTypeId}
        projectId={projectId}
        initial={editing}
        onSubmit={handleSubmit}
        saving={create.isPending || update.isPending}
      />

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => {
          if (!o) setConfirmDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover campo?</AlertDialogTitle>
            <AlertDialogDescription>
              Os valores associados em todas as tarefas também serão apagados. Esta ação é
              irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) {
                  remove.mutate(confirmDelete.id);
                  setConfirmDelete(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CustomFieldsPage() {
  const { data: taskTypes = [] } = useTaskTypes();
  const { data: projects = [] } = useProjects();

  const [activeScope, setActiveScope] = useState<CustomFieldScope>("global");
  const [taskTypeId, setTaskTypeId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Campos customizados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estenda o schema das tarefas com campos próprios. Aplique globalmente, por tipo de tarefa
          ou por projeto.
        </p>
      </div>

      <Tabs
        value={activeScope}
        onValueChange={(v) => setActiveScope(v as CustomFieldScope)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="global">Globais</TabsTrigger>
          <TabsTrigger value="task_type">Por tipo de tarefa</TabsTrigger>
          <TabsTrigger value="project">Por projeto</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-4">
          <ScopeSection scope="global" />
        </TabsContent>

        <TabsContent value="task_type" className="space-y-4">
          <div className="max-w-sm">
            <Select
              value={taskTypeId ?? ""}
              onValueChange={(v) => setTaskTypeId(v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tipo de tarefa" />
              </SelectTrigger>
              <SelectContent>
                {taskTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScopeSection scope="task_type" taskTypeId={taskTypeId} />
        </TabsContent>

        <TabsContent value="project" className="space-y-4">
          <div className="max-w-sm">
            <Select value={projectId ?? ""} onValueChange={(v) => setProjectId(v || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScopeSection scope="project" projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
