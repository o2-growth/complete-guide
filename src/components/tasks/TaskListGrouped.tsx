import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskRow as TaskRowItem } from "@/components/tasks/TaskRow";
import { useTaskStatuses } from "@/hooks/useTasks";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import type { TaskRow } from "@/hooks/useTasks";

type GroupBy = "none" | "status" | "priority" | "assignee" | "due" | "type";
type SortBy = "created" | "due_asc" | "priority_desc" | "title";

const STORE_KEY = "oxy:tasklist-grouping";

function loadPrefs(scope: string): { group: GroupBy; sort: SortBy } {
  if (typeof window === "undefined") return { group: "none", sort: "created" };
  try {
    const raw = window.localStorage.getItem(`${STORE_KEY}:${scope}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { group: "none", sort: "created" };
}
function savePrefs(scope: string, prefs: { group: GroupBy; sort: SortBy }) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORE_KEY}:${scope}`, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

const PRIORITY_ORDER: Record<TaskRow["priority"], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};
const PRIORITY_LABEL: Record<TaskRow["priority"], string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  none: "Sem prioridade",
};

function dueBucket(t: TaskRow): { key: string; label: string; order: number } {
  if (!t.due_at) return { key: "none", label: "Sem prazo", order: 99 };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(t.due_at);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return { key: "overdue", label: "Atrasadas", order: 0 };
  if (diffDays === 0) return { key: "today", label: "Hoje", order: 1 };
  if (diffDays === 1) return { key: "tomorrow", label: "Amanhã", order: 2 };
  if (diffDays <= 7) return { key: "week", label: "Próximos 7 dias", order: 3 };
  if (diffDays <= 30) return { key: "month", label: "Próximos 30 dias", order: 4 };
  return { key: "later", label: "Mais tarde", order: 5 };
}

export interface TaskListGroupedProps {
  tasks: TaskRow[];
  onOpen: (id: string) => void;
  scope?: string;
}

export function TaskListGrouped({ tasks, onOpen, scope = "default" }: TaskListGroupedProps) {
  const [prefs, setPrefs] = useState(() => loadPrefs(scope));
  useEffect(() => savePrefs(scope, prefs), [scope, prefs]);

  const { data: statuses = [] } = useTaskStatuses();
  const { data: members = [] } = useTenantMembers();

  const statusMap = useMemo(() => new Map(statuses.map((s) => [s.id, s])), [statuses]);
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m.display_name || m.full_name || m.email || "Sem nome"])),
    [members],
  );

  const sorted = useMemo(() => {
    const arr = [...tasks];
    switch (prefs.sort) {
      case "due_asc":
        arr.sort((a, b) => {
          if (!a.due_at && !b.due_at) return 0;
          if (!a.due_at) return 1;
          if (!b.due_at) return -1;
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        });
        break;
      case "priority_desc":
        arr.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
        break;
      case "title":
        arr.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
        break;
      case "created":
      default:
        arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return arr;
  }, [tasks, prefs.sort]);

  const groups = useMemo(() => {
    if (prefs.group === "none") {
      return [{ key: "all", label: "Tarefas", order: 0, items: sorted }];
    }
    const map = new Map<string, { key: string; label: string; order: number; items: TaskRow[] }>();
    const push = (key: string, label: string, order: number, t: TaskRow) => {
      const g = map.get(key) ?? { key, label, order, items: [] };
      g.items.push(t);
      map.set(key, g);
    };
    for (const t of sorted) {
      if (prefs.group === "status") {
        const s = t.status_id ? statusMap.get(t.status_id) : null;
        push(t.status_id ?? "_none", s?.name ?? "Sem status", s?.position ?? 99, t);
      } else if (prefs.group === "priority") {
        push(t.priority, PRIORITY_LABEL[t.priority], PRIORITY_ORDER[t.priority], t);
      } else if (prefs.group === "assignee") {
        const id = t.assignee_id ?? "_none";
        const label = t.assignee_id ? memberMap.get(t.assignee_id) ?? "Membro" : "Sem responsável";
        push(id, label, t.assignee_id ? 0 : 99, t);
      } else if (prefs.group === "due") {
        const b = dueBucket(t);
        push(b.key, b.label, b.order, t);
      } else if (prefs.group === "type") {
        const id = t.type_id ?? "_none";
        push(id, t.type_id ? "Tipo" : "Sem tipo", t.type_id ? 0 : 99, t);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "pt-BR"));
  }, [sorted, prefs.group, statusMap, memberMap]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (k: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Agrupar</span>
        <Select value={prefs.group} onValueChange={(v) => setPrefs((p) => ({ ...p, group: v as GroupBy }))}>
          <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="priority">Prioridade</SelectItem>
            <SelectItem value="assignee">Responsável</SelectItem>
            <SelectItem value="due">Vencimento</SelectItem>
            <SelectItem value="type">Tipo</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-2 text-xs text-muted-foreground">Ordenar</span>
        <Select value={prefs.sort} onValueChange={(v) => setPrefs((p) => ({ ...p, sort: v as SortBy }))}>
          <SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Mais recentes</SelectItem>
            <SelectItem value="due_asc">Vencimento (próximo)</SelectItem>
            <SelectItem value="priority_desc">Prioridade (alta)</SelectItem>
            <SelectItem value="title">Título (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {groups.map((g) => {
        const isCollapsed = collapsed.has(g.key);
        return (
          <div key={g.key} className="space-y-1.5">
            {prefs.group !== "none" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs font-semibold"
                onClick={() => toggle(g.key)}
              >
                {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                <span>{g.label}</span>
                <span className="text-muted-foreground">· {g.items.length}</span>
              </Button>
            )}
            {!isCollapsed && (
              <Card className="divide-y">
                {g.items.map((t) => (
                  <TaskRowItem key={t.id} task={t} onOpen={onOpen} bulkMode />
                ))}
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}