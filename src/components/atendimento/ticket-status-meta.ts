import type { TicketStatus } from "@/hooks/useTickets";

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Aberto",
  in_progress: "Em atendimento",
  waiting: "Aguardando",
  resolved: "Resolvido",
  closed: "Fechado",
};

export const TICKET_STATUS_CLASS: Record<TicketStatus, string> = {
  open: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  in_progress: "border-primary/40 bg-primary/10 text-primary",
  waiting: "border-muted-foreground/40 bg-muted text-muted-foreground",
  resolved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  closed: "border-muted-foreground/30 bg-muted/60 text-muted-foreground",
};
