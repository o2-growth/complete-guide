import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number | null | undefined;
  onChange?: (next: number) => void;
  className?: string;
  /** Esconde label numérico ao lado da barra. */
  hideLabel?: boolean;
  /** Versão fina (kanban / linha). Quando true, ignora hover/edit. */
  thin?: boolean;
}

/**
 * Barra de progresso 0-100. Quando `onChange` é passado, vira slider editável
 * com debounce 300ms para não saturar a mutation.
 */
export function ProgressBar({
  value,
  onChange,
  className,
  hideLabel,
  thin,
}: ProgressBarProps) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  const [local, setLocal] = useState(v);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setLocal(v);
  }, [v]);

  if (!onChange) {
    if (thin) {
      return (
        <div
          className={cn("h-1 w-full overflow-hidden rounded-full bg-muted", className)}
          role="progressbar"
          aria-valuenow={v}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso"
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${v}%` }}
          />
        </div>
      );
    }
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Progress value={v} className="h-2 flex-1" aria-label="Progresso" />
        {!hideLabel && (
          <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
            {v}%
          </span>
        )}
      </div>
    );
  }

  const handleChange = ([next]: number[]) => {
    setLocal(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      onChange(next);
    }, 300);
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Slider
        min={0}
        max={100}
        step={5}
        value={[local]}
        onValueChange={handleChange}
        className="flex-1"
        aria-label="Progresso da tarefa"
      />
      {!hideLabel && (
        <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
          {local}%
        </span>
      )}
    </div>
  );
}
