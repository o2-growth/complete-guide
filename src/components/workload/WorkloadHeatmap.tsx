import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  WorkloadTask,
  MemberLite,
  useReassignTask,
} from "@/hooks/useWorkload";
import { dayKey, dayLabel, fmtMin, isWeekend, loadColor } from "./workload-utils";

interface Props {
  days: Date[];
  members: MemberLite[];
  tasks: WorkloadTask[];
  onOpenTask?: (id: string) => void;
}

function initials(m: MemberLite) {
  const s = (m.display_name || m.full_name || m.email || "?").trim();
  return s
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/**
 * Heatmap semanal: linhas = pessoas, colunas = dias.
 * Cada célula mostra carga (min) e tarefas. Drag de tarefa entre células
 * reatribui (assignee + dia).
 */
export function WorkloadHeatmap({ days, members, tasks, onOpenTask }: Props) {
  const reassign = useReassignTask();
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Index: tasks por (assignee_id|day)
  const grid = useMemo(() => {
    const map = new Map<string, WorkloadTask[]>();
    for (const t of tasks) {
      if (!t.due_at) continue;
      const k = `${t.assignee_id ?? "_"}|${dayKey(new Date(t.due_at))}`;
      const arr = map.get(k) ?? [];
      arr.push(t);
      map.set(k, arr);
    }
    return map;
  }, [tasks]);

  const cellKey = (uid: string, d: Date) => `${uid}|${dayKey(d)}`;

  const onDrop = (e: React.DragEvent, uid: string, d: Date) => {
    e.preventDefault();
    setDragOver(null);
    const taskId = e.dataTransfer.getData("text/task-id");
    const currentDueAt = e.dataTransfer.getData("text/current-due") || null;
    if (!taskId) return;
    reassign.mutate({ taskId, assigneeId: uid, newDate: d, currentDueAt });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur">
            <tr>
              <th className="w-44 border-b border-r px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pessoa
              </th>
              {days.map((d) => (
                <th
                  key={dayKey(d)}
                  className={cn(
                    "border-b border-r px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground last:border-r-0",
                    isWeekend(d) && "bg-muted/30",
                  )}
                >
                  {dayLabel(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td
                  colSpan={days.length + 1}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum membro encontrado neste workspace.
                </td>
              </tr>
            )}
            {members.map((m) => (
              <tr key={m.user_id} className="align-top">
                <th
                  scope="row"
                  className="border-b border-r bg-card px-3 py-3 text-left align-top"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                      <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                        {initials(m)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {m.display_name || m.full_name || m.email}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {m.role}
                      </p>
                    </div>
                  </div>
                </th>
                {days.map((d) => {
                  const items = grid.get(`${m.user_id}|${dayKey(d)}`) ?? [];
                  const load = items.reduce(
                    (s, t) => s + (t.estimate_minutes ?? 30),
                    0,
                  );
                  const cap = m.capacity_minutes_day;
                  const ratio = cap > 0 ? load / cap : 0;
                  const key = cellKey(m.user_id, d);
                  return (
                    <td
                      key={key}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(key);
                      }}
                      onDragLeave={() => setDragOver((cur) => (cur === key ? null : cur))}
                      onDrop={(e) => onDrop(e, m.user_id, d)}
                      className={cn(
                        "min-w-[140px] border-b border-r p-1.5 align-top transition-colors last:border-r-0",
                        loadColor(load, cap),
                        dragOver === key && "outline outline-2 outline-primary",
                        isWeekend(d) && "bg-muted/10",
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold">
                        <span
                          className={cn(
                            "tabular-nums",
                            ratio > 1 ? "text-destructive" : "text-foreground/70",
                          )}
                        >
                          {fmtMin(load)}
                        </span>
                        {cap > 0 && (
                          <span className="text-foreground/50 tabular-nums">
                            / {fmtMin(cap)}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {items.slice(0, 4).map((t) => (
                          <Tooltip key={t.id}>
                            <TooltipTrigger asChild>
                              <li
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("text/task-id", t.id);
                                  e.dataTransfer.setData(
                                    "text/current-due",
                                    t.due_at ?? "",
                                  );
                                  e.dataTransfer.effectAllowed = "move";
                                }}
                                onClick={() => onOpenTask?.(t.id)}
                                className={cn(
                                  "group cursor-grab rounded-md border bg-background/90 px-1.5 py-1 text-[11px] leading-tight shadow-sm hover:border-primary/40 active:cursor-grabbing",
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  <span
                                    className={cn(
                                      "h-1.5 w-1.5 shrink-0 rounded-full",
                                      t.priority === "urgent" && "bg-[hsl(var(--prio-urgent))]",
                                      t.priority === "high" && "bg-[hsl(var(--prio-high))]",
                                      t.priority === "medium" && "bg-[hsl(var(--prio-medium))]",
                                      t.priority === "low" && "bg-[hsl(var(--prio-low))]",
                                      t.priority === "none" && "bg-muted-foreground/40",
                                    )}
                                  />
                                  <span className="truncate font-medium">{t.title}</span>
                                </div>
                                {t.code && (
                                  <span className="mt-0.5 block font-mono text-[9px] text-muted-foreground">
                                    {t.code} · {fmtMin(t.estimate_minutes ?? 30)}
                                  </span>
                                )}
                              </li>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs font-medium">{t.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {fmtMin(t.estimate_minutes ?? 30)} estimados · arraste para realocar
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {items.length > 4 && (
                          <li className="px-1 text-[10px] text-muted-foreground">
                            +{items.length - 4} mais
                          </li>
                        )}
                      </ul>
                      {ratio > 1 && (
                        <Badge
                          variant="destructive"
                          className="mt-1 h-4 px-1 text-[9px] font-bold"
                        >
                          OVERLOAD
                        </Badge>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}