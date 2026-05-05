import { Clock } from "lucide-react";
import { useTaskMinutesSum } from "@/hooks/useTimeTracking";

function fmt(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (mm === 0) return `${h}h`;
  return `${h}h${mm}m`;
}

/**
 * Chip compacto exibindo o total de horas registradas na task.
 * Não renderiza se total == 0. Use em TaskRow / KanbanCard.
 */
export function TaskHoursChip({ taskId }: { taskId: string }) {
  const { data } = useTaskMinutesSum(taskId);
  if (!data || data <= 0) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground"
      aria-label={`Tempo registrado: ${fmt(data)}`}
    >
      <Clock className="h-3 w-3" />
      {fmt(data)}
    </span>
  );
}
