import { Link } from "react-router-dom";
import { Flag, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TicketRow as TTicket } from "@/hooks/useTickets";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketSlaBadge } from "./TicketSlaBadge";

const PRIO_LABEL: Record<TTicket["priority"], string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const PRIO_CLASS: Record<TTicket["priority"], string> = {
  urgent: "text-[hsl(var(--prio-urgent))]",
  high: "text-[hsl(var(--prio-high))]",
  medium: "text-[hsl(var(--prio-medium))]",
  low: "text-[hsl(var(--prio-low))]",
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

export function TicketRow({ ticket }: { ticket: TTicket }) {
  return (
    <Link
      to={`/app/atendimento/${ticket.id}`}
      aria-label={`Ticket ATD-${ticket.number}: ${ticket.title}`}
      className={cn(
        "group flex flex-col gap-2 rounded-lg border bg-card p-3 transition-colors",
        "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      )}
    >
      <div className="flex items-start gap-2">
        <Badge variant="outline" className="h-5 shrink-0 px-1.5 font-mono text-[10px]">
          ATD-{ticket.number}
        </Badge>
        <p className="flex-1 truncate text-sm font-medium leading-tight">{ticket.title}</p>
        <Flag
          className={cn("h-3.5 w-3.5 shrink-0", PRIO_CLASS[ticket.priority])}
          aria-label={`Prioridade ${PRIO_LABEL[ticket.priority]}`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <TicketStatusBadge status={ticket.status} />
        <TicketSlaBadge ticket={ticket} />
        {ticket.tags?.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {ticket.tags.slice(0, 2).join(", ")}
            {ticket.tags.length > 2 && ` +${ticket.tags.length - 2}`}
          </span>
        )}
        <span className="ml-auto">{relTime(ticket.created_at)}</span>
      </div>
    </Link>
  );
}
