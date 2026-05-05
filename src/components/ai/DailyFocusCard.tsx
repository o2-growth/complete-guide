import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCw, TrendingUp, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailySuggestions } from "@/hooks/useDailySuggestions";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";

export default function DailyFocusCard() {
  const { data, isPending, isError, refetch, isFetching } = useDailySuggestions();
  const qc = useQueryClient();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const onRefresh = () => {
    qc.invalidateQueries({ queryKey: ["ai-suggest-daily"] });
    refetch();
  };

  return (
    <>
      <Card
        className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6"
        role="region"
        aria-label="Foque hoje em"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/15 p-2">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold leading-tight">Foque hoje em</h2>
              <p className="text-xs text-muted-foreground">
                Recomendado pela IA com base no seu padrão de trabalho.
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onRefresh}
            disabled={isFetching}
            aria-label="Atualizar sugestões"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="mt-4">
          {isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">
              Não conseguimos gerar sua sugestão agora. Tente em alguns minutos.
            </p>
          ) : !data || data.recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma recomendação no momento. Conclua algumas tarefas para a IA aprender seu padrão.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.recommendations.slice(0, 3).map((rec, idx) => (
                <li key={rec.task_id}>
                  <button
                    type="button"
                    onClick={() => setOpenTaskId(rec.task_id)}
                    className="group flex w-full items-start gap-3 rounded-lg border border-transparent bg-background/60 p-3 text-left transition hover:border-primary/40 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Abrir tarefa ${rec.title}`}
                  >
                    <span
                      className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
                      aria-hidden="true"
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{rec.title}</div>
                      <div className="line-clamp-1 text-xs text-muted-foreground">
                        {rec.reason}
                      </div>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 flex-none text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {data?.pattern && !isPending && !isError && (
          <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 flex-none text-primary" aria-hidden="true" />
            <span className="line-clamp-2">{data.pattern}</span>
          </div>
        )}
      </Card>

      <TaskDetailSheet
        taskId={openTaskId}
        onOpenChange={(o) => !o && setOpenTaskId(null)}
      />
    </>
  );
}
