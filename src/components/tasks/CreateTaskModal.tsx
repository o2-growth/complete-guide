import { useEffect, useState } from "react";
import { Loader2, Plus, Bell, ListTodo, Calendar as CalendarIcon, Flag, Tag } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectPicker } from "./ProjectPicker";
import { AssigneePicker } from "./AssigneePicker";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { useTaskStatuses } from "@/hooks/useTasks";
import { useNavigate } from "react-router-dom";
import { taskDetailPath } from "@/lib/task-routes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseQuickAdd } from "@/lib/quick-add-parser";
import { cn } from "@/lib/utils";

const PRIORITIES = [
  { value: "none", label: "Nenhuma prioridade", color: "text-muted-foreground" },
  { value: "low", label: "Prioridade baixa", color: "text-blue-500" },
  { value: "medium", label: "Prioridade média", color: "text-amber-500" },
  { value: "high", label: "Prioridade alta", color: "text-orange-500" },
  { value: "urgent", label: "Prioridade urgente", color: "text-red-500" },
] as const;

const DATE_PRESETS = [
  { value: "today", label: "Hoje", get: () => new Date() },
  { value: "tomorrow", label: "Amanhã", get: () => addDays(new Date(), 1) },
  { value: "next-week", label: "Próxima semana", get: () => addDays(new Date(), 7) },
];

interface CreateTaskModalProps {
  trigger: React.ReactNode;
  defaultProjectId?: string;
}

export function CreateTaskModal({ trigger, defaultProjectId }: CreateTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"task" | "reminder">("task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId ?? null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [priority, setPriority] = useState<string>("none");
  const [statusId, setStatusId] = useState<string>("");
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [pending, setPending] = useState(false);

  const { user } = useAuth();
  const { tenantId, inboxProjectId } = useWorkspace();
  const { data: statuses = [] } = useTaskStatuses();
  const navigate = useNavigate();

  const currentStatus = statuses.find((s) => s.id === statusId);
  const currentPriority = PRIORITIES.find((p) => p.value === priority);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setProjectId(defaultProjectId ?? inboxProjectId ?? null);
    setAssigneeId(user?.id ?? null);
    setPriority("none");
    setDueAt(null);
    setStatusId(statuses.find((s) => s.slug === "todo")?.id ?? "");
  }, [open, defaultProjectId, inboxProjectId, user?.id, statuses]);

  const submit = async () => {
    const t = title.trim();
    if (!t || !tenantId) return;
    const pid = projectId ?? inboxProjectId;
    if (!pid) {
      toast.error("Selecione uma lista");
      return;
    }
    setPending(true);
    try {
      const parsed = parseQuickAdd(t);
      const todo = statuses.find((s) => s.slug === "todo");
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          tenant_id: tenantId,
          project_id: pid,
          title: parsed.title || t,
          description: description.trim() || null,
          priority: (priority as typeof PRIORITIES[number]["value"]) || parsed.priority,
          status_id: statusId || todo?.id || null,
          assignee_id: assigneeId ?? user?.id ?? null,
          reporter_id: user?.id ?? null,
          created_by: user?.id ?? null,
          due_at: (dueAt ?? parsed.dueAt)?.toISOString() ?? null,
          estimate_minutes: parsed.estimateMinutes,
          number: 0,
        })
        .select("id")
        .single();
      if (error) throw error;
      setOpen(false);
      toast.success("Tarefa criada");
      navigate(taskDetailPath(data.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl p-0">
        {/* Tabs Tarefa / Lembrete */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="w-full">
          <div className="border-b px-4 pt-2">
            <TabsList className="h-9 bg-transparent p-0">
              <TabsTrigger
                value="task"
                className="rounded-none border-b-2 border-transparent px-3 py-2 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <ListTodo className="mr-1.5 h-3.5 w-3.5" /> Tarefa
              </TabsTrigger>
              <TabsTrigger
                value="reminder"
                className="rounded-none border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Bell className="mr-1.5 h-3.5 w-3.5" /> Lembrete
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="space-y-3 px-4 py-4">
            {/* Linha chips topo: dropdown lista + dropdown tipo */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-[200px] max-w-[260px] flex-1">
                <ProjectPicker
                  value={projectId}
                  onChange={setProjectId}
                  placeholder="Selecionar lista…"
                  compact
                />
              </div>
              <Select defaultValue="task">
                <SelectTrigger className="h-8 w-auto gap-1.5 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task" className="text-xs">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full border-2 border-muted-foreground/50" />
                      Tarefa
                    </span>
                  </SelectItem>
                  <SelectItem value="subtask" className="text-xs">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full border border-muted-foreground/30" />
                      Subtarefa
                    </span>
                  </SelectItem>
                  <SelectItem value="milestone" className="text-xs">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rotate-45 bg-amber-500" />
                      Marco
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Título grande */}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da tarefa"
              autoFocus
              className="border-0 bg-transparent px-0 text-lg font-medium shadow-none focus-visible:ring-0"
            />

            {/* Descrição */}
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição"
              className="resize-none border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            />

            {/* Footer chips: status, assignee, data, prioridade, etiqueta */}
            <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
              {/* Status — default "OPEN" */}
              <Select value={statusId} onValueChange={setStatusId}>
                <SelectTrigger className="h-7 w-auto gap-1 px-2 text-[10px] font-semibold uppercase tracking-wide">
                  {currentStatus ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: currentStatus.color ?? "#94a3b8" }}
                      />
                      {currentStatus.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">OPEN</span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      <span className="inline-flex items-center gap-1.5">
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

              {/* Assignee */}
              <span className="inline-block max-w-[180px]">
                <AssigneePicker value={assigneeId} onChange={setAssigneeId} />
              </span>

              {/* Data */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 gap-1 border-dashed px-2 text-xs",
                      !dueAt && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="h-3 w-3" />
                    {dueAt ? format(dueAt, "dd 'de' MMM", { locale: ptBR }) : "Data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="border-b p-2">
                    {DATE_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-accent"
                        onClick={() => setDueAt(p.get())}
                      >
                        {p.label}
                      </button>
                    ))}
                    {dueAt && (
                      <button
                        type="button"
                        className="block w-full rounded px-2 py-1 text-left text-xs text-muted-foreground hover:bg-accent"
                        onClick={() => setDueAt(null)}
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  <Calendar
                    mode="single"
                    selected={dueAt ?? undefined}
                    onSelect={(d) => d && setDueAt(d)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              {/* Prioridade */}
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger
                  className={cn(
                    "h-7 w-auto gap-1 border-dashed px-2 text-xs",
                    currentPriority?.color,
                  )}
                >
                  <Flag className="h-3 w-3" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-xs">
                      <span className={cn("inline-flex items-center gap-1.5", p.color)}>
                        <Flag className="h-3 w-3" /> {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Etiqueta placeholder */}
              <Button
                variant="outline"
                size="sm"
                disabled
                className="h-7 gap-1 border-dashed px-2 text-xs text-muted-foreground"
              >
                <Tag className="h-3 w-3" /> Etiqueta
              </Button>
            </div>
          </div>

          {/* Action footer */}
          <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2">
            <span className="text-[10px] text-muted-foreground">
              {mode === "reminder" ? "Lembrete vira tarefa simples com data" : ""}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={submit} disabled={!title.trim() || pending}>
                {pending ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-3.5 w-3.5" />
                )}
                Criar tarefa
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
