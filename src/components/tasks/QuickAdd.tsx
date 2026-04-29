import { useState, KeyboardEvent } from "react";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuickAdd } from "@/hooks/useTasks";
import { parseQuickAdd } from "@/lib/quick-add-parser";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PRIO_LABEL: Record<string, string> = {
  urgent: "urgente",
  high: "alta",
  medium: "média",
  low: "baixa",
  none: "",
};

export function QuickAdd() {
  const [value, setValue] = useState("");
  const mutation = useQuickAdd();
  const preview = value.trim() ? parseQuickAdd(value) : null;

  const submit = () => {
    if (!value.trim()) return;
    mutation.mutate(value, {
      onSuccess: () => setValue(""),
    });
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border bg-card p-1.5 shadow-soft transition-shadow focus-within:shadow-elevated">
        <Plus className="ml-2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          placeholder="Nova tarefa… ex: Postar reels amanhã 14h !2 #conteudo ~30m"
          className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button
          variant="hero"
          size="sm"
          onClick={submit}
          disabled={!value.trim() || mutation.isPending}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
        </Button>
      </div>

      {preview && (preview.dueAt || preview.priority !== "none" || preview.tags.length > 0 || preview.estimateMinutes) && (
        <div className="flex flex-wrap items-center gap-1.5 px-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Detectado:</span>
          {preview.dueAt && (
            <Badge variant="outline" className="border-primary/30 text-primary">
              {format(preview.dueAt, "dd 'de' MMM 'às' HH'h'mm", { locale: ptBR })}
            </Badge>
          )}
          {preview.priority !== "none" && (
            <Badge variant="outline" className="border-warning/40 text-warning">
              prioridade {PRIO_LABEL[preview.priority]}
            </Badge>
          )}
          {preview.tags.map((t) => (
            <Badge key={t} variant="secondary">#{t}</Badge>
          ))}
          {preview.estimateMinutes && (
            <Badge variant="outline">~{preview.estimateMinutes}min</Badge>
          )}
        </div>
      )}

      <p className="px-2 text-[11px] text-muted-foreground/70">
        Atalhos: <kbd className="rounded border bg-muted px-1">!1</kbd> urgente ·{" "}
        <kbd className="rounded border bg-muted px-1">#tag</kbd> ·{" "}
        <kbd className="rounded border bg-muted px-1">~30m</kbd> estimativa · datas em pt-BR
      </p>
    </div>
  );
}