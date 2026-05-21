import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskStatuses } from "@/hooks/useTasks";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import type { TaskRow } from "@/hooks/useTasks";

export interface TaskFilterState {
  q: string;
  status: string; // "all" | status_id | "open" | "done"
  assignee: string; // "all" | "none" | user_id
  priority: string; // "all" | priority value
}

const DEFAULT_FILTER: TaskFilterState = {
  q: "",
  status: "all",
  assignee: "all",
  priority: "all",
};

const STORAGE_PREFIX = "oxy:task-filter";

function load(scope: string): TaskFilterState {
  if (typeof window === "undefined") return DEFAULT_FILTER;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${scope}`);
    if (!raw) return DEFAULT_FILTER;
    return { ...DEFAULT_FILTER, ...(JSON.parse(raw) as Partial<TaskFilterState>) };
  } catch {
    return DEFAULT_FILTER;
  }
}

function save(scope: string, value: TaskFilterState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}:${scope}`, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const PRIORITIES: { value: TaskRow["priority"]; label: string }[] = [
  { value: "urgent", label: "Urgente" },
  { value: "high", label: "Alta" },
  { value: "medium", label: "Média" },
  { value: "low", label: "Baixa" },
  { value: "none", label: "Sem prioridade" },
];

export function useTaskFilter(scope: string) {
  const [state, setState] = useState<TaskFilterState>(() => load(scope));

  useEffect(() => {
    setState(load(scope));
  }, [scope]);

  useEffect(() => {
    save(scope, state);
  }, [scope, state]);

  const isActive =
    state.q.trim().length > 0 ||
    state.status !== "all" ||
    state.assignee !== "all" ||
    state.priority !== "all";

  const apply = useMemo(() => {
    return (tasks: TaskRow[]): TaskRow[] => {
      const q = state.q.trim().toLowerCase();
      return tasks.filter((t) => {
        if (q) {
          const hay = `${t.title ?? ""} ${t.code ?? ""} ${t.description ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (state.status === "open" && t.done_at) return false;
        if (state.status === "done" && !t.done_at) return false;
        if (
          state.status !== "all" &&
          state.status !== "open" &&
          state.status !== "done" &&
          t.status_id !== state.status
        )
          return false;
        if (state.assignee === "none" && t.assignee_id) return false;
        if (
          state.assignee !== "all" &&
          state.assignee !== "none" &&
          t.assignee_id !== state.assignee
        )
          return false;
        if (state.priority !== "all" && t.priority !== state.priority) return false;
        return true;
      });
    };
  }, [state]);

  return { state, setState, apply, isActive };
}

interface Props {
  state: TaskFilterState;
  onChange: (v: TaskFilterState) => void;
  total: number;
  filtered: number;
}

export function TaskFilterBar({ state, onChange, total, filtered }: Props) {
  const { data: statuses = [] } = useTaskStatuses();
  const { data: members = [] } = useTenantMembers();

  const set = <K extends keyof TaskFilterState>(key: K, value: TaskFilterState[K]) =>
    onChange({ ...state, [key]: value });

  const reset = () => onChange(DEFAULT_FILTER);
  const active =
    state.q.trim().length > 0 ||
    state.status !== "all" ||
    state.assignee !== "all" ||
    state.priority !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card/40 p-2">
      <div className="relative min-w-[180px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={state.q}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Buscar nesta vista…"
          className="h-8 pl-8 text-xs"
        />
      </div>

      <Select value={state.status} onValueChange={(v) => set("status", v)}>
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="open">Em aberto</SelectItem>
          <SelectItem value="done">Concluídas</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={state.assignee} onValueChange={(v) => set("assignee", v)}>
        <SelectTrigger className="h-8 w-[170px] text-xs">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos responsáveis</SelectItem>
          <SelectItem value="none">Sem responsável</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.display_name ?? m.full_name ?? m.email ?? "—"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={state.priority} onValueChange={(v) => set("priority", v)}>
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda prioridade</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {active && (
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={reset}>
          <X className="h-3.5 w-3.5" /> Limpar
        </Button>
      )}

      <span className="ml-auto text-[11px] text-muted-foreground">
        {active ? `${filtered} de ${total}` : `${total} ${total === 1 ? "tarefa" : "tarefas"}`}
      </span>
    </div>
  );
}
