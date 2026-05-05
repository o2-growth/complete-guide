import { useEffect, useState } from "react";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePreferences } from "@/hooks/usePreferences";
import { cn } from "@/lib/utils";

interface DueDateLabelProps {
  due: Date | string | null | undefined;
  className?: string;
  /** Quando true, marca em vermelho se a data já passou e a task não está concluída. */
  done?: boolean;
  /** Formato absoluto custom: padrão "dd 'de' MMM". */
  absoluteFormat?: string;
  /** Inclui hora no formato absoluto se a data tem hora != 00:00. */
  withTime?: boolean;
}

/**
 * Renderiza data de vencimento conforme preferência do usuário.
 * - "absolute": "23 de mai" (ou "23 de mai às 14h00" se withTime)
 * - "countdown": "em 3 dias" / "há 2 horas"
 *
 * Atualiza a cada 60s sem refetch para manter contagem regressiva fresca.
 */
export function DueDateLabel({
  due,
  className,
  done,
  absoluteFormat = "dd 'de' MMM",
  withTime = true,
}: DueDateLabelProps) {
  const { due_at_format } = usePreferences();
  const [, setTick] = useState(0);

  // Re-render a cada 60s só quando estamos em modo countdown.
  useEffect(() => {
    if (due_at_format !== "countdown") return;
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, [due_at_format]);

  if (!due) return null;
  const date = due instanceof Date ? due : new Date(due);
  if (Number.isNaN(date.getTime())) return null;

  const overdue = !done && isPast(date) && !isToday(date);
  const today = isToday(date);

  let label: string;
  if (due_at_format === "countdown") {
    label = formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } else {
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
    label = format(date, absoluteFormat, { locale: ptBR });
    if (withTime && hasTime) {
      label += ` às ${format(date, "HH'h'mm")}`;
    }
  }

  return (
    <span
      className={cn(
        overdue && "text-destructive font-medium",
        today && !overdue && "text-primary font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}
