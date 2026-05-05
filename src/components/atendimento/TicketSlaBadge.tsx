import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { computeSlaState, type TicketRow } from "@/hooks/useTickets";

const TONE = {
  ok: {
    cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    label: "SLA ok",
    Icon: CheckCircle2,
  },
  warning: {
    cls: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    label: "SLA em risco",
    Icon: AlertTriangle,
  },
  breached: {
    cls: "border-destructive/60 bg-destructive/10 text-destructive",
    label: "SLA estourado",
    Icon: ShieldAlert,
  },
  na: {
    cls: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
    label: "Sem SLA",
    Icon: Clock,
  },
} as const;

export function TicketSlaBadge({
  ticket,
  className,
}: {
  ticket: Pick<
    TicketRow,
    "status" | "created_at" | "first_response_at" | "resolved_at"
    | "sla_response_minutes" | "sla_resolution_minutes"
  >;
  className?: string;
}) {
  const state = computeSlaState(ticket);
  if (state === "na") return null;
  const tone = TONE[state];
  const Icon = tone.Icon;
  return (
    <Badge
      variant="outline"
      className={cn("inline-flex h-5 items-center gap-1 px-2 py-0 text-[11px]", tone.cls, className)}
      aria-label={tone.label}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {tone.label}
    </Badge>
  );
}
