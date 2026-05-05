import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/hooks/useTickets";
import { TICKET_STATUS_LABELS, TICKET_STATUS_CLASS } from "./ticket-status-meta";

export function TicketStatusBadge({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 px-2 py-0 text-[11px] font-medium",
        TICKET_STATUS_CLASS[status],
        className,
      )}
      aria-label={`Status: ${TICKET_STATUS_LABELS[status]}`}
    >
      {TICKET_STATUS_LABELS[status]}
    </Badge>
  );
}
