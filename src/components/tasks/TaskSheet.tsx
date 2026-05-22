import { useEffect, useState } from "react";
import { Task, Priority, useUpdateTask, useListStatuses, useTaskAssignees, useToggleAssignee } from "@/hooks/useTasks";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function TaskSheet({ task, onOpenChange }: { task: Task | null; onOpenChange: (v: boolean) => void }) {
  const update = useUpdateTask();
  const { data: statuses = [] } = useListStatuses(task?.list_id ?? null);
  const { data: members = [] } = useTenantMembers();
  const { data: currentAssignees = [] } = useTaskAssignees(task?.id ?? null);
  const toggleA = useToggleAssignee();

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!task) return null;

  const saveTitle = () => { if (title !== task.title) update.mutate({ id: task.id, patch: { title } }); };
  const saveDesc = () => { if (description !== (task.description ?? "")) update.mutate({ id: task.id, patch: { description } }); };

  return (
    <Sheet open={!!task} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-xs font-mono text-muted-foreground">#{task.number}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle} className="h-auto border-0 px-0 text-2xl font-bold focus-visible:ring-0" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={task.status_id ?? ""} onValueChange={(v) => update.mutate({ id: task.id, patch: { status_id: v || null } })}>
                <SelectTrigger><SelectValue placeholder="Sem status" /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Prioridade</Label>
              <Select value={task.priority} onValueChange={(v) => update.mutate({ id: task.id, patch: { priority: v as Priority } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["none", "low", "medium", "high", "urgent"] as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Início</Label>
              <Input type="date" defaultValue={task.start_at?.slice(0, 10) ?? ""} onBlur={(e) => update.mutate({ id: task.id, patch: { start_at: e.target.value ? new Date(e.target.value).toISOString() : null } })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Prazo</Label>
              <Input type="date" defaultValue={task.due_at?.slice(0, 10) ?? ""} onBlur={(e) => update.mutate({ id: task.id, patch: { due_at: e.target.value ? new Date(e.target.value).toISOString() : null } })} />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Responsáveis</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {members.map((m) => {
                const present = currentAssignees.includes(m.id);
                return (
                  <Button
                    key={m.id}
                    size="sm"
                    variant={present ? "default" : "outline"}
                    className="h-7 gap-1.5"
                    onClick={() => toggleA.mutate({ task_id: task.id, user_id: m.id, present })}
                  >
                    <Avatar className="h-4 w-4">
                      {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                      <AvatarFallback className="text-[8px]">{(m.full_name ?? m.email ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{m.display_name ?? m.full_name ?? m.email}</span>
                    {present && <Check className="h-3 w-3" />}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} onBlur={saveDesc} rows={6} placeholder="Adicione mais contexto…" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}