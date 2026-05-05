import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAutomationRuns } from "@/hooks/useAutomations";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  ruleId: string | null;
}

const STATUS_VARIANT: Record<string, { label: string; cls: string }> = {
  ok: { label: "Executou", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  failed: { label: "Falhou", cls: "bg-red-500/15 text-red-700 dark:text-red-300" },
  skipped: { label: "Ignorada", cls: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
};

export function AutomationRunsList({ ruleId }: Props) {
  const { data: runs = [], isLoading } = useAutomationRuns(ruleId);

  if (!ruleId) {
    return <p className="text-xs text-muted-foreground">Selecione uma regra para ver execuções.</p>;
  }
  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Carregando execuções…</p>;
  }
  if (runs.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma execução registrada ainda.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Quando a fila processar, o histórico aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {runs.map((run) => {
        const variant = STATUS_VARIANT[run.status] ?? STATUS_VARIANT.skipped;
        return (
          <Card key={run.id} className="border bg-card/50">
            <CardContent className="space-y-1 p-3 text-xs">
              <div className="flex items-center gap-2">
                <Badge className={variant.cls} variant="outline">
                  {variant.label}
                </Badge>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {run.trigger_event}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(run.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              <p className="text-muted-foreground">
                {run.actions_executed} ação(ões) executada(s)
                {run.error && ` — erro: ${run.error}`}
              </p>
              <details className="text-[11px]">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Ver payload
                </summary>
                <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted/50 p-2 font-mono text-[10px]">
                  {JSON.stringify(run.payload, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
