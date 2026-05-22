import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, useListStatuses, useUpdateTask, Priority } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "none", label: "Sem prioridade", color: "#94a3b8" },
  { value: "low", label: "Baixa", color: "#3b82f6" },
  { value: "medium", label: "Média", color: "#eab308" },
  { value: "high", label: "Alta", color: "#f97316" },
  { value: "urgent", label: "Urgente", color: "#ef4444" },
];

export function TaskSheet({ task, onOpenChange }: { task: Task | null; onOpenChange: (v: boolean) => void }) {
  const open = !!task;
  const { data: statuses = [] } = useListStatuses(task?.list_id ?? null);
  const update = useUpdateTask();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDesc(task.description ?? "");
    }
  }, [task]);

  if (!task) return null;

  const save = () => {
    if (title !== task.title || desc !== (task.description ?? "")) {
      update.mutate({ id: task.id, patch: { title, description: desc } });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader className="border-b pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() =>
                update.mutate({ id: task.id, patch: { completed_at: task.completed_at ? null : new Date().toISOString() } })
              }
            >
              {task.completed_at ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5" />}
            </Button>
            <span className="text-xs text-muted-foreground">#{task.number}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            className="border-0 px-0 text-xl font-semibold focus-visible:ring-0"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select
                value={task.status_id ?? ""}
                onValueChange={(v) => update.mutate({ id: task.id, patch: { status_id: v } })}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Prioridade</Label>
              <Select
                value={task.priority}
                onValueChange={(v) => update.mutate({ id: task.id, patch: { priority: v as Priority } })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Início</Label>
              <Input
                type="datetime-local"
                defaultValue={task.start_at ? task.start_at.slice(0, 16) : ""}
                onBlur={(e) =>
                  update.mutate({ id: task.id, patch: { start_at: e.target.value ? new Date(e.target.value).toISOString() : null } })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Vencimento</Label>
              <Input
                type="datetime-local"
                defaultValue={task.due_at ? task.due_at.slice(0, 16) : ""}
                onBlur={(e) =>
                  update.mutate({ id: task.id, patch: { due_at: e.target.value ? new Date(e.target.value).toISOString() : null } })
                }
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onBlur={save}
              rows={6}
              placeholder="Adicione detalhes…"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}