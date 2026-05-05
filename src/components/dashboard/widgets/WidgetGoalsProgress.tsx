import { Loader2 } from "lucide-react";
import { useGoals } from "@/hooks/useOKRs";
import { Progress } from "@/components/ui/progress";

interface Config {
  limit?: number;
}

export function WidgetGoalsProgress({ config }: { config: Config }) {
  const limit = config.limit ?? 5;
  const { data, isLoading } = useGoals();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  const goals = (data ?? []).filter((g) => g.status === "active").slice(0, limit);

  if (!goals.length) {
    return <p className="text-xs text-muted-foreground text-center py-6">Sem goals ativos.</p>;
  }

  return (
    <ul className="space-y-3">
      {goals.map((g) => {
        // Progress placeholder: como não temos o agregado de KRs no useGoals,
        // usar 0% até o patch correlato hidratar — UI fica neutra.
        const pct = 0;
        return (
          <li key={g.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{g.title}</span>
              <span className="text-xs text-muted-foreground">{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </li>
        );
      })}
    </ul>
  );
}
