import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTasks, useCreateTask, useListStatuses, useUpdateTask, Task } from "@/hooks/useTasks";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskSheet } from "@/components/tasks/TaskSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function ListPage() {
  const { listId } = useParams<{ listId: string }>();
  const { data: list } = useQuery({
    queryKey: ["list", listId],
    enabled: !!listId,
    queryFn: async () => {
      const { data } = await supabase.from("lists").select("id,name,color").eq("id", listId!).maybeSingle();
      return data;
    },
  });
  const { data: tasks = [], isLoading } = useTasks(listId ?? null);
  const { data: statuses = [] } = useListStatuses(listId ?? null);
  const create = useCreateTask();
  const update = useUpdateTask();
  const [newTitle, setNewTitle] = useState("");
  const [active, setActive] = useState<Task | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    statuses.forEach((s) => map.set(s.id, []));
    const noStatus: Task[] = [];
    tasks.forEach((t) => {
      if (t.status_id && map.has(t.status_id)) map.get(t.status_id)!.push(t);
      else noStatus.push(t);
    });
    return { map, noStatus };
  }, [tasks, statuses]);

  if (!listId) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">{list?.name ?? "Lista"}</h1>
        <p className="text-xs text-muted-foreground">{tasks.length} tarefa(s)</p>
      </div>

      <Tabs defaultValue="list" className="flex-1 overflow-hidden">
        <div className="border-b px-6">
          <TabsList className="bg-transparent">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="board">Quadro</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="m-0 h-[calc(100%-2.5rem)] overflow-auto p-0">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <>
              {statuses.map((s) => {
                const rows = grouped.map.get(s.id) ?? [];
                return (
                  <div key={s.id} className="border-b">
                    <div
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                      style={{ background: s.color }}
                    >
                      <span>{s.name}</span>
                      <span className="rounded-full bg-white/30 px-2 py-0.5">{rows.length}</span>
                    </div>
                    {rows.map((t) => <TaskRow key={t.id} task={t} onOpen={setActive} status={s} />)}
                  </div>
                );
              })}
              {grouped.noStatus.length > 0 && (
                <div className="border-b">
                  <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sem status</div>
                  {grouped.noStatus.map((t) => <TaskRow key={t.id} task={t} onOpen={setActive} />)}
                </div>
              )}
              <form
                className="flex items-center gap-2 border-b px-4 py-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTitle.trim()) return;
                  create.mutate({ list_id: listId, title: newTitle.trim(), status_id: statuses[0]?.id ?? null });
                  setNewTitle("");
                }}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nova tarefa…"
                  className="border-0 px-0 focus-visible:ring-0"
                />
                <Button size="sm" type="submit" disabled={!newTitle.trim()}>Adicionar</Button>
              </form>
            </>
          )}
        </TabsContent>

        <TabsContent value="board" className="m-0 h-[calc(100%-2.5rem)] overflow-auto p-4">
          <div className="flex gap-3">
            {statuses.map((s) => {
              const rows = grouped.map.get(s.id) ?? [];
              return (
                <div
                  key={s.id}
                  className="flex w-72 shrink-0 flex-col rounded-lg border bg-card"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("text/plain");
                    if (id) update.mutate({ id, patch: { status_id: s.id } });
                  }}
                >
                  <div
                    className="flex items-center justify-between rounded-t-lg px-3 py-2 text-xs font-bold uppercase text-white"
                    style={{ background: s.color }}
                  >
                    <span>{s.name}</span>
                    <span className="rounded-full bg-white/30 px-2 py-0.5">{rows.length}</span>
                  </div>
                  <div className="flex-1 space-y-2 p-2">
                    {rows.map((t) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                        onClick={() => setActive(t)}
                        className="cursor-pointer rounded-md border bg-background p-2 text-sm shadow-sm hover:shadow"
                      >
                        <div className="text-xs text-muted-foreground">#{t.number}</div>
                        <div className="font-medium">{t.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <TaskSheet task={active} onOpenChange={(v) => { if (!v) setActive(null); }} />
    </div>
  );
}