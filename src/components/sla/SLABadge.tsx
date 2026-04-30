import { AlertTriangle, CheckCircle2, Clock, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTaskSLA, type Priority } from "@/hooks/useSLA";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  task: {
    created_at?: string | null;
    done_at?: string | null;
    type_id?: string | null;
    priority?: Priority | null;
  };
  compact?: boolean;
}

export function SLABadge({ task, compact }: Props) {
  const sla = useTaskSLA(task);
  if (sla.status === "none" || !sla.policy) return null;

  const config = {
    ok: {
      Icon: Shield,
      label: "No prazo",
      cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    },
    warning: {
      Icon: AlertTriangle,
      label: "Atenção",
      cls: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    },
    breached: {
      Icon: AlertTriangle,
      label: "SLA estourado",
      cls: "bg-destructive/10 text-destructive border-destructive/30",
    },
    met: {
      Icon: CheckCircle2,
      label: "SLA cumprido",
      cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    },
  }[sla.status as "ok" | "warning" | "breached" | "met"];

  const Icon = config.Icon;

  const tooltipText = task.done_at
    ? `${sla.policy.name} · ${config.label}`
    : sla.status === "breached"
      ? `${sla.policy.name} · estourado há ${formatDistanceToNowStrict(sla.deadline!, { locale: ptBR })}`
      : `${sla.policy.name} · ${formatDistanceToNowStrict(sla.deadline!, { locale: ptBR })} restantes`;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn("gap-1 font-medium", config.cls)}>
            <Icon className="h-3 w-3" />
            {!compact && <span>{config.label}</span>}
            {!compact && sla.status !== "met" && !task.done_at && (
              <span className="opacity-70">· {Math.round(sla.pctConsumed)}%</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div className="font-medium">{tooltipText}</div>
            <div className="text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Resolução: {sla.policy.resolution_hours}h
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}