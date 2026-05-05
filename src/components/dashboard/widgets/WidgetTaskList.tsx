import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useDashboardData, type DateRange } from "@/hooks/useDashboard";

interface Config {
  range?: DateRange;
  filter?: "all" | "open" | "overdue" | "done";
  limit?: number;
}

export function WidgetTaskList({ config }: { config: Config }) {
  const range = config.range ?? "30d";
  const filter = config.filter ?? "open";
  const limit = config.limit ?? 8;
  const { data, isLoading } = useDashboardData(range);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  const tasks = (data?.tasks ?? []).filter((t) => {
    if (filter === "done") return !!t.done_at;
    if (filter === "open") return !t.done_at;
    if (filter === "overdue")
      return !t.done_at && t.due_at && new Date(t.due_at).getTime() < Date.now();
    return true;
  });

  const sorted = tasks
    .slice()
    .sort((a, b) => {
      const ad = a.due_at ? new Date(a.due_at).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.due_at ? new Date(b.due_at).getTime() : Number.POSITIVE_INFINITY;
      return ad - bd;
    })
    .slice(0, limit);

  if (!sorted.length) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">Nenhuma tarefa encontrada.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {sorted.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between gap-2 text-sm border-b pb-2 last:border-b-0 last:pb-0"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate">{t.title}</p>
            <p className="text-xs text-muted-foreground">
              {t.code ?? "—"}
              {t.due_at &&
                ` • vence ${format(parseISO(t.due_at), "dd MMM", { locale: ptBR })}`}
            </p>
          </div>
          {t.priority !== "none" && (
            <Badge
              variant={t.priority === "urgent" || t.priority === "high" ? "destructive" : "secondary"}
              className="text-[10px] uppercase"
            >
              {t.priority}
            </Badge>
          )}
        </li>
      ))}
    </ul>
  );
}
