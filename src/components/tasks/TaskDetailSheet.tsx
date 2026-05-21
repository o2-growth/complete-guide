import { useEffect, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Flag,
  Loader2,
  Paperclip,
  Send,
  Trash2,
  Plus,
  Download,
  ListTodo,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PresenceAvatars } from "@/components/presence/PresenceAvatars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RichEditor } from "./RichEditor";
import { useAuth } from "@/hooks/useAuth";
import { useTaskStatuses, useToggleTaskDone, type TaskRow } from "@/hooks/useTasks";
import {
  useTask,
  useUpdateTask,
  useComments,
  useAddComment,
  useDeleteComment,
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  useSubtasks,
  useCreateSubtask,
  getSignedUrl,
  getChecklist,
  type ChecklistItem,
} from "@/hooks/useTaskDetail";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TaskTimerButton } from "@/components/timer/TimerIndicator";
import { TaskTimerPanel } from "@/components/timer/TaskTimerPanel";
import { PreviewEditor } from "@/components/previews/PreviewEditor";
import { TaskAIPanel } from "@/components/ai/TaskAIPanel";
import { TaskApprovalsPanel } from "@/components/approvals/TaskApprovalsPanel";
import { SocialMediaPanel } from "@/components/social/SocialMediaPanel";
import type { SocialChannel, PublishState } from "@/hooks/useSocialMedia";
import { TaskSocialContentPanel } from "@/components/social/TaskSocialContentPanel";
import { TaskMetricsPanel } from "@/components/social/TaskMetricsPanel";
import { TaskWhiteboardsPanel } from "@/components/tasks/TaskWhiteboardsPanel";
import { SLABadge } from "@/components/sla/SLABadge";
import { RecurrenceBuilder } from "./RecurrenceBuilder";
import { useRecurrence, useUpdateRecurrence } from "@/hooks/useRecurrence";
import { DueDateLabel } from "./DueDateLabel";
import { ProgressBar } from "./ProgressBar";
import { useUpdateTaskProgress } from "@/hooks/useTaskProgress";
import { usePersonas } from "@/hooks/usePersonas";
import { useAudiences } from "@/hooks/useAudiences";
import { TemplatePicker } from "@/components/modelos/TemplatePicker";
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { AssigneePicker } from "./AssigneePicker";
import { warnIfOverload } from "./assignee-utils";
import { useUserWorkload } from "@/hooks/useWorkload";
import { CustomFieldsPanel } from "./CustomFieldsPanel";

const PRIORITIES = [
  { value: "none", label: "Nenhuma" },
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

const PRIO_COLOR: Record<string, string> = {
  urgent: "text-[hsl(var(--prio-urgent))]",
  high: "text-[hsl(var(--prio-high))]",
  medium: "text-[hsl(var(--prio-medium))]",
  low: "text-[hsl(var(--prio-low))]",
  none: "text-muted-foreground",
};

function initials(name?: string | null, email?: string | null) {
  const s = (name || email || "?").trim();
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function formatBytes(b?: number | null) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

interface TaskDetailSheetProps {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailSheet({ taskId, onOpenChange }: TaskDetailSheetProps) {
  const open = !!taskId;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl">
        {taskId && <TaskDetailContent taskId={taskId} />}
      </SheetContent>
    </Sheet>
  );
}

function TaskDetailContent({ taskId }: { taskId: string }) {
  const { data: task, isLoading } = useTask(taskId);
  const { data: statuses } = useTaskStatuses();
  const { data: taskTypes } = useTaskTypes();
  const update = useUpdateTask();
  const toggleDone = useToggleTaskDone();
  const recurrenceQuery = useRecurrence(taskId);
  const updateRecurrence = useUpdateRecurrence(taskId);
  const updateProgress = useUpdateTaskProgress(taskId);
  const assigneeWorkload = useUserWorkload(task?.assignee_id ?? null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
    }
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !task) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const done = !!task.done_at;
  const due = task.due_at ? new Date(task.due_at) : null;
  const progress = task.progress_pct ?? 0;

  const saveTitle = () => {
    const t = title.trim();
    if (t && t !== task.title) update.mutate({ id: task.id, patch: { title: t } });
  };
  const saveDescription = () => {
    if (description !== (task.description ?? "")) {
      update.mutate({ id: task.id, patch: { description } });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          {task.code && (
            <Badge variant="outline" className="font-mono text-[10px]">
              {task.code}
            </Badge>
          )}
          <SLABadge task={task} />
          {task.gcal_event_id && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  aria-label="Sincronizada com Google Calendar"
                  className="inline-flex items-center text-primary"
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent>Sincronizada com Google Calendar</TooltipContent>
            </Tooltip>
          )}
          <span className="text-xs text-muted-foreground">
            criada {formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: ptBR })}
          </span>
          <div className="ml-auto">
            <PresenceAvatars room={`task:${task.id}`} />
          </div>
        </div>
        <SheetTitle className="sr-only">{task.title}</SheetTitle>
        <div className="mt-2 flex items-start gap-3">
          <Checkbox
            checked={done}
            onCheckedChange={() => toggleDone.mutate(task)}
            className="mt-1.5"
          />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className={cn(
              "h-auto border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0",
              done && "line-through text-muted-foreground",
            )}
          />
          <TaskTimerButton taskId={task.id} />
        </div>
      </SheetHeader>

      <div className="grid gap-3 border-b bg-muted/20 px-6 py-4 text-sm sm:grid-cols-3">
        <FieldLabel label="Status">
          <Select
            value={task.status_id ?? ""}
            onValueChange={(v) => update.mutate({ id: task.id, patch: { status_id: v } })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {(statuses ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: s.color ?? "#94a3b8" }}
                    />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldLabel>

        <FieldLabel label="Prioridade">
          <Select
            value={task.priority}
            onValueChange={(v) =>
              update.mutate({ id: task.id, patch: { priority: v as typeof task.priority } })
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <span className="inline-flex items-center gap-2">
                    <Flag className={cn("h-3.5 w-3.5", PRIO_COLOR[p.value])} />
                    {p.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldLabel>

        <FieldLabel label="Vencimento">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-full justify-start font-normal">
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {due ? <DueDateLabel due={due} done={done} absoluteFormat="dd 'de' MMM, yyyy" /> : "Sem data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={due ?? undefined}
                onSelect={(d) =>
                  update.mutate({
                    id: task.id,
                    patch: { due_at: d ? d.toISOString() : null },
                  })
                }
                locale={ptBR}
              />
              {due && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => update.mutate({ id: task.id, patch: { due_at: null } })}
                  >
                    <X className="mr-1 h-3 w-3" /> Limpar data
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </FieldLabel>
      </div>

      <div className="border-b bg-background px-6 py-4">
        <ICEScorePanel task={task} onUpdate={(patch) => update.mutate({ id: task.id, patch })} />
      </div>

      <div className="grid gap-4 border-b bg-background px-6 py-4 sm:grid-cols-2">
        <div>
          <RecurrenceBuilder
            value={recurrenceQuery.data?.rrule ?? null}
            onChange={(rule) => updateRecurrence.mutate(rule)}
            dtstart={due ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Progresso
          </p>
          <ProgressBar
            value={progress}
            onChange={(v) => updateProgress.mutate(v)}
          />
        </div>
      </div>

      <div className="grid gap-3 border-b bg-background px-6 py-4 text-sm sm:grid-cols-3">
        <FieldLabel label="Responsável">
          <AssigneePicker
            value={task.assignee_id}
            onChange={(userId) => {
              if (userId === task.assignee_id) return;
              update.mutate({ id: task.id, patch: { assignee_id: userId } });
              // Aviso de overload — usa cache atual (refetch a cada 10s).
              if (userId && assigneeWorkload.data && userId !== assigneeWorkload.data.user_id) {
                // Será re-checado na próxima render quando assigneeWorkload mudar.
              }
              if (userId && assigneeWorkload.data?.user_id === userId) {
                warnIfOverload(
                  task.title,
                  assigneeWorkload.data.percentage,
                  assigneeWorkload.data.status,
                );
              }
            }}
          />
        </FieldLabel>

        <FieldLabel label="Tipo">
          <Select
            value={task.type_id ?? "_"}
            onValueChange={(v) => {
              const typeId = v === "_" ? null : v;
              const patch: Partial<TaskRow> = { type_id: typeId };
              // Aplica default_estimate_minutes se a task não tem estimativa manual.
              if (typeId && (task.estimate_minutes == null || task.estimate_minutes === 0)) {
                const t = (taskTypes ?? []).find((x) => x.id === typeId);
                if (t?.default_estimate_minutes) {
                  patch.estimate_minutes = t.default_estimate_minutes;
                }
              }
              update.mutate({ id: task.id, patch });
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Sem tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_">Sem tipo</SelectItem>
              {(taskTypes ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="inline-flex items-center gap-2">
                    {t.color && (
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: t.color }}
                      />
                    )}
                    {t.name}
                    {t.default_estimate_minutes ? (
                      <span className="text-[10px] text-muted-foreground">
                        ~{Math.round(t.default_estimate_minutes / 60 * 10) / 10}h
                      </span>
                    ) : null}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldLabel>

        <FieldLabel label="Estimativa (min)">
          <Input
            type="number"
            min={0}
            step={15}
            defaultValue={task.estimate_minutes ?? ""}
            placeholder="—"
            className="h-8"
            onBlur={(e) => {
              const raw = e.target.value.trim();
              const parsed = raw === "" ? null : Math.max(0, Math.round(Number(raw)));
              if (parsed === task.estimate_minutes) return;
              update.mutate({ id: task.id, patch: { estimate_minutes: parsed } });
            }}
          />
        </FieldLabel>
      </div>

      <div className="flex-1 px-6 py-4">
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Descrição</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="subtasks">Subtarefas</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="attachments">Anexos</TabsTrigger>
            <TabsTrigger value="comments">Comentários</TabsTrigger>
            <TabsTrigger value="time">Tempo</TabsTrigger>
            <TabsTrigger value="ai">IA</TabsTrigger>
            <TabsTrigger value="approvals">Aprovações</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="strategy">Estratégia</TabsTrigger>
            <TabsTrigger value="custom-fields">Campos</TabsTrigger>
            <TabsTrigger value="whiteboard">Whiteboard</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <RichEditor
              value={description}
              onChange={setDescription}
              onBlur={saveDescription}
              placeholder="Detalhe a tarefa, objetivos, links de referência…"
              task={task}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Formate com **negrito**, listas, checklists e títulos. Salva ao perder o foco.
            </p>
          </TabsContent>

          <TabsContent value="checklist" className="mt-4">
            <ChecklistPanel task={task} onUpdate={update.mutate} />
          </TabsContent>

          <TabsContent value="subtasks" className="mt-4">
            <SubtasksPanel task={task} />
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <PreviewEditor
              customFields={task.custom_fields ?? null}
              onSave={(merged) =>
                update.mutate({ id: task.id, patch: { custom_fields: merged } })
              }
            />
          </TabsContent>

          <TabsContent value="attachments" className="mt-4">
            <AttachmentsPanel taskId={task.id} />
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentsPanel taskId={task.id} task={task} />
          </TabsContent>

          <TabsContent value="time" className="mt-4">
            <TaskTimerPanel taskId={task.id} />
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <TaskAIPanel task={task} />
          </TabsContent>

          <TabsContent value="approvals" className="mt-4">
            <TaskApprovalsPanel taskId={task.id} />
          </TabsContent>

          <TabsContent value="social" className="mt-4 space-y-4">
            <SocialMediaPanel
              taskId={task.id}
              channel={(task.social_channel as SocialChannel | null) ?? null}
              state={(task.publish_state as PublishState | null) ?? null}
              caption={task.social_caption ?? null}
              campaignId={task.campaign_id ?? null}
              scheduledAt={task.scheduled_at ?? null}
            />
            <TaskSocialContentPanel
              taskId={task.id}
              channel={(task.social_channel as SocialChannel | null) ?? null}
              caption={task.social_caption ?? ""}
              onCaptionChange={() => { /* refetch via query invalidation no save */ }}
            />
            <TaskMetricsPanel taskId={task.id} />
          </TabsContent>

          <TabsContent value="strategy" className="mt-4">
            <StrategyPanel
              taskId={task.id}
              personaId={task.persona_id ?? null}
              audienceId={task.audience_id ?? null}
              onUpdate={update.mutate}
            />
          </TabsContent>

          <TabsContent value="custom-fields" className="mt-4">
            <CustomFieldsPanel
              taskId={task.id}
              taskTypeId={task.type_id ?? null}
              projectId={task.project_id}
            />
          </TabsContent>

          <TabsContent value="whiteboard" className="mt-4">
            <TaskWhiteboardsPanel taskId={task.id} projectId={task.project_id ?? null} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ---------------- ICE Score ---------------- */
function ICEScorePanel({
  task,
  onUpdate,
}: {
  task: NonNullable<ReturnType<typeof useTask>["data"]>;
  onUpdate: (patch: Partial<TaskRow>) => void;
}) {
  const [impact, setImpact] = useState<number | null>(task.ice_impact ?? null);
  const [confidence, setConfidence] = useState<number | null>(task.ice_confidence ?? null);
  const [ease, setEase] = useState<number | null>(task.ice_ease ?? null);

  useEffect(() => {
    setImpact(task.ice_impact ?? null);
    setConfidence(task.ice_confidence ?? null);
    setEase(task.ice_ease ?? null);
  }, [task.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const localScore =
    impact != null && confidence != null && ease != null
      ? impact * confidence * ease
      : null;

  const clamp = (v: number) => Math.min(10, Math.max(1, Math.round(v)));

  const handleBlur = (
    field: "ice_impact" | "ice_confidence" | "ice_ease",
    raw: string,
    setter: (v: number | null) => void,
  ) => {
    if (raw.trim() === "") {
      setter(null);
      onUpdate({ [field]: null });
      return;
    }
    const v = clamp(Number(raw));
    setter(v);
    onUpdate({ [field]: v });
  };

  const scoreTierClass =
    localScore === null
      ? ""
      : localScore >= 667
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
      : localScore >= 334
      ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
      : "bg-muted text-muted-foreground";

  const scoreTierLabel =
    localScore === null
      ? null
      : localScore >= 667
      ? "Alto"
      : localScore >= 334
      ? "Médio"
      : "Baixo";

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        ICE Score
      </p>
      <div className="flex flex-wrap items-center gap-4">
        {(
          [
            { label: "Impacto", field: "ice_impact", value: impact, setter: setImpact },
            { label: "Confiança", field: "ice_confidence", value: confidence, setter: setConfidence },
            { label: "Facilidade", field: "ice_ease", value: ease, setter: setEase },
          ] as const
        ).map(({ label, field, value, setter }) => (
          <div key={field} className="flex items-center gap-2">
            <span className="w-16 text-xs text-muted-foreground">{label}</span>
            <Input
              type="number"
              min={1}
              max={10}
              value={value ?? ""}
              placeholder="—"
              className="h-8 w-16 text-center"
              onChange={(e) => setter(e.target.value === "" ? null : Number(e.target.value))}
              onBlur={(e) => handleBlur(field, e.target.value, setter)}
            />
          </div>
        ))}
        {localScore !== null && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">{localScore}</span>
            <Badge variant="outline" className={scoreTierClass}>
              {scoreTierLabel}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

/* ---------------- Checklist ---------------- */
function ChecklistPanel({
  task,
  onUpdate,
}: {
  task: ReturnType<typeof useTask>["data"];
  onUpdate: ReturnType<typeof useUpdateTask>["mutate"];
}) {
  const items = getChecklist(task);
  const [text, setText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const save = (next: ChecklistItem[]) => {
    if (!task) return;
    onUpdate({ id: task.id, patch: { checklist: next } });
  };

  const applyTemplate = (body: unknown) => {
    if (!task) return;
    const tplItems = (body as { items?: Array<{ text: string; required?: boolean }> })?.items ?? [];
    const additions: ChecklistItem[] = tplItems
      .filter((it) => !!it.text)
      .map((it) => ({ id: crypto.randomUUID(), text: it.text, done: false }));
    if (additions.length === 0) {
      toast.error("Modelo sem itens");
      return;
    }
    save([...items, ...additions]);
    toast.success(`${additions.length} itens adicionados ao checklist`);
  };

  const add = () => {
    const t = text.trim();
    if (!t) return;
    save([...items, { id: crypto.randomUUID(), text: t, done: false }]);
    setText("");
  };

  const toggle = (id: string) =>
    save(items.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  const remove = (id: string) => save(items.filter((it) => it.id !== id));

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPickerOpen(true)}>
          <Plus className="mr-1 h-3 w-3" /> Aplicar checklist do catálogo
        </Button>
      </div>
      <TemplatePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        kind="task_checklist"
        title="Aplicar checklist"
        onSelect={(body) => applyTemplate(body)}
      />
      {items.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {doneCount} de {items.length} concluídos
        </div>
      )}
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.id} className="group flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/40">
            <Checkbox checked={it.done} onCheckedChange={() => toggle(it.id)} />
            <span className={cn("flex-1 text-sm", it.done && "line-through text-muted-foreground")}>
              {it.text}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => remove(it.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Adicionar item…"
          className="h-9"
        />
        <Button onClick={add} size="sm" variant="secondary">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Subtasks ---------------- */
function SubtasksPanel({ task }: { task: NonNullable<ReturnType<typeof useTask>["data"]> }) {
  const { data, isLoading } = useSubtasks(task.id);
  const create = useCreateSubtask(task);
  const [title, setTitle] = useState("");
  const toggle = useToggleTaskDone();

  const add = () => {
    const t = title.trim();
    if (!t) return;
    create.mutate(t);
    setTitle("");
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <ul className="space-y-1">
          {(data ?? []).map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/40">
              <Checkbox
                checked={!!s.done_at}
                onCheckedChange={() =>
                  toggle.mutate({
                    id: s.id,
                    done_at: s.done_at,
                    status_id: s.status_id,
                  } as Parameters<typeof toggle.mutate>[0])
                }
              />
              {s.code && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  {s.code}
                </Badge>
              )}
              <span className={cn("flex-1 text-sm", s.done_at && "line-through text-muted-foreground")}>
                {s.title}
              </span>
            </li>
          ))}
          {(!data || data.length === 0) && (
            <p className="text-xs text-muted-foreground">
              Sem subtarefas. Quebre tarefas grandes em passos menores.
            </p>
          )}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Nova subtarefa…"
          className="h-9"
        />
        <Button onClick={add} size="sm" variant="secondary">
          <ListTodo className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Attachments ---------------- */
function AttachmentsPanel({ taskId }: { taskId: string }) {
  const { data, isLoading } = useAttachments(taskId);
  const upload = useUploadAttachment(taskId);
  const remove = useDeleteAttachment(taskId);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      await upload.mutateAsync(f).catch((err) => {
        toast.error(`Falha ao enviar ${f.name}: ${err?.message ?? "erro desconhecido"}`);
      });
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const openFile = async (path: string, bucket: string) => {
    try {
      const url = await getSignedUrl(bucket, path);
      window.open(url, "_blank");
    } catch (e) {
      toast.error("Erro ao abrir: " + (e as Error).message);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onPick(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-dashed border-muted-foreground/20 bg-muted/20 p-6 text-center text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5"
      >
        <Paperclip className="h-5 w-5" />
        <span>Clique ou arraste arquivos aqui (até 25 MB)</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
        />
      </div>

      {upload.isPending && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Enviando…
        </div>
      )}

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <ul className="space-y-1.5">
          {(data ?? []).map((a) => (
            <li key={a.id} className="group flex items-center gap-3 rounded-md border bg-card p-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-muted">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.filename}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatBytes(a.size_bytes)} · {format(new Date(a.created_at), "dd MMM HH:mm", { locale: ptBR })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => openFile(a.path, a.bucket)}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={() => remove.mutate(a)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
          {(!data || data.length === 0) && (
            <p className="text-xs text-muted-foreground">Nenhum anexo ainda.</p>
          )}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Comments ---------------- */
function CommentsPanel({ taskId, task }: { taskId: string; task: TaskRow }) {
  const { user } = useAuth();
  const { data, isLoading } = useComments(taskId);
  const add = useAddComment(taskId);
  const del = useDeleteComment(taskId);
  const [body, setBody] = useState("");

  const isEmpty = !body.replace(/<[^>]*>/g, "").trim();

  const submit = () => {
    if (isEmpty) return;
    add.mutate(body, { onSuccess: () => setBody("") });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <RichEditor
            value={body}
            onChange={setBody}
            placeholder="Escreva um comentário… ('/' para comandos, '@' para mencionar)"
            enableMentions
            className="min-h-[70px]"
            task={task}
          />
        </div>
        <Button onClick={submit} disabled={add.isPending || isEmpty} size="icon">
          {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      <Separator />

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((c) => (
            <li key={c.id} className="group flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={c.author?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {initials(c.author?.display_name, c.author?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {c.author?.display_name ?? c.author?.email ?? "Alguém"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                  {c.author_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => del.mutate(c.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div
                  className="prose prose-sm dark:prose-invert mt-0.5 max-w-none whitespace-pre-wrap text-sm"
                  dangerouslySetInnerHTML={{ __html: c.body }}
                />
              </div>
            </li>
          ))}
          {(!data || data.length === 0) && (
            <p className="text-xs text-muted-foreground">Nenhum comentário. Inicie a conversa.</p>
          )}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Strategy (Persona / Audience) ---------------- */
function StrategyPanel({
  taskId,
  personaId,
  audienceId,
  onUpdate,
}: {
  taskId: string;
  personaId: string | null;
  audienceId: string | null;
  onUpdate: ReturnType<typeof useUpdateTask>["mutate"];
}) {
  const personasQuery = usePersonas();
  const audiencesQuery = useAudiences();
  const personas = personasQuery.data ?? [];
  const audiences = audiencesQuery.data ?? [];

  const setPersona = (v: string) =>
    onUpdate({
      id: taskId,
      patch: { persona_id: v === "_" ? null : v },
    });
  const setAudience = (v: string) =>
    onUpdate({
      id: taskId,
      patch: { audience_id: v === "_" ? null : v },
    });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Vincule a tarefa a uma persona e/ou público para alinhar entrega e mensageria com a estratégia.
      </p>

      <div className="space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Persona
        </p>
        <Select value={personaId ?? "_"} onValueChange={setPersona}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Sem persona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_">Sem persona</SelectItem>
            {personas.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: p.color }}
                  />
                  {p.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Público
        </p>
        <Select value={audienceId ?? "_"} onValueChange={setAudience}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Sem público" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_">Sem público</SelectItem>
            {audiences.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}