import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Check, X, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAiSuggestions, useGenerateSuggestions, useApplySuggestion, useDismissSuggestion } from "@/hooks/useAiSuggestions";

/**
 * Painel compacto de sugestões IA (renderizado em /app e em /app/comecar).
 * Gera 1x ao montar se não houver sugestões pendentes.
 */
export default function ProactiveSuggestions({ compact = false }: { compact?: boolean }) {
  const { data: items = [] } = useAiSuggestions("pending");
  const gen = useGenerateSuggestions();
  const apply = useApplySuggestion();
  const dismiss = useDismissSuggestion();

  useEffect(() => {
    // gera na primeira montagem se vazio
    if (items.length === 0 && !gen.isPending && !gen.isSuccess) {
      gen.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Sugestões da IA</h3>
          <Badge variant="secondary" className="text-xs">{items.length}</Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={() => gen.mutate()} disabled={gen.isPending}>Atualizar</Button>
      </div>
      <div className={compact ? "space-y-2" : "grid gap-2 md:grid-cols-2"}>
        {items.slice(0, compact ? 3 : 6).map((s) => (
          <div key={s.id} className="rounded-lg border border-border/50 bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{s.title}</p>
                {s.body && <p className="mt-1 text-xs text-muted-foreground">{s.body}</p>}
              </div>
              <div className="flex gap-1">
                {s.context_url && (
                  <Link to={s.context_url}>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Abrir">
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7" title="Aplicar" onClick={() => apply.mutate(s.id)}>
                  <Check className="h-3 w-3 text-success" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" title="Dispensar" onClick={() => dismiss.mutate(s.id)}>
                  <X className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}