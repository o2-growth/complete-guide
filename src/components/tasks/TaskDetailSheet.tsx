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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useTaskStatuses, useToggleTaskDone } from "@/hooks/useTasks";
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
  const update = useUpdateTask();
  const toggleDone = useToggleTaskDone();

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
          <span className="text-xs text-muted-foreground">
            criada {formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: ptBR })}
          </span>
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
                {due ? format(due, "dd 'de' MMM, yyyy", { locale: ptBR }) : "Sem data"}
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

      <div className="flex-1 px-6 py-4">
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Descrição</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="subtasks">Subtarefas</TabsTrigger>
            <TabsTrigger value="attachments">Anexos</TabsTrigger>
            <TabsTrigger value="comments">Comentários</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <RichEditor
              value={description}
              onChange={setDescription}
              onBlur={saveDescription}
              placeholder="Detalhe a tarefa, objetivos, links de referência…"
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

          <TabsContent value="attachments" className="mt-4">
            <AttachmentsPanel taskId={task.id} />
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentsPanel taskId={task.id} />
          </TabsContent>
        </Tabs>
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

  const save = (next: ChecklistItem[]) => {
    if (!task) return;
    onUpdate({ id: task.id, patch: { checklist: next } as never });
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
                  } as never)
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
    for (const f of Array.from(files)) await upload.mutateAsync(f).catch(() => {});
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
function CommentsPanel({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const { data, isLoading } = useComments(taskId);
  const add = useAddComment(taskId);
  const del = useDeleteComment(taskId);
  const [body, setBody] = useState("");

  const submit = () => {
    const t = body.trim();
    if (!t) return;
    add.mutate(t, { onSuccess: () => setBody("") });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          placeholder="Escreva um comentário… (⌘/Ctrl+Enter)"
          className="min-h-[70px] flex-1"
        />
        <Button onClick={submit} disabled={add.isPending || !body.trim()} size="icon">
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
                <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.body}</p>
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