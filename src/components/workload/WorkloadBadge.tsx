import { Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUserWorkload, type WorkloadStatus } from "@/hooks/useWorkload";

interface WorkloadBadgeProps {
  userId: string | null | undefined;
  tenantId?: string | null;
  size?: "sm" | "md";
  className?: string;
}

const STATUS_STYLES: Record<WorkloadStatus, string> = {
  low: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  mid: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  high: "bg-amber-500/15 text-amber-700 ring-amber-500/40 dark:text-amber-300",
  overload: "bg-red-500/15 text-red-700 ring-red-500/40 dark:text-red-300",
};

const STATUS_LABEL: Record<WorkloadStatus, string> = {
  low: "Carga baixa",
  mid: "Carga moderada",
  high: "Carga alta",
  overload: "Sobrecarregado",
};

function formatHours(minutes: number) {
  if (minutes <= 0) return "0h";
  const h = Math.round((minutes / 60) * 10) / 10;
  return `${h}h`;
}

/**
 * Chip compacto com a carga semanal de um usuário.
 * Cor verde/amarelo/vermelho baseada em mv_workload_by_user vs user_capacity.
 */
export function WorkloadBadge({ userId, tenantId, size = "sm", className }: WorkloadBadgeProps) {
  const { data, isLoading } = useUserWorkload(userId, tenantId);

  if (!userId) return null;

  if (isLoading || !data) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ring-muted-foreground/20 bg-muted/40 text-muted-foreground",
          size === "md" && "px-2 py-0.5 text-xs",
          className,
        )}
        aria-label="Carregando carga"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
    );
  }

  const { percentage, status, allocated_minutes, capacity_minutes } = data;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
            STATUS_STYLES[status],
            size === "md" && "px-2 py-0.5 text-xs",
            className,
          )}
          aria-label={`${STATUS_LABEL[status]} (${percentage}%)`}
        >
          {percentage}%
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <p className="font-medium">{STATUS_LABEL[status]}</p>
          <p className="text-muted-foreground">
            {formatHours(allocated_minutes)}/{formatHours(capacity_minutes)} alocadas ({percentage}%)
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
