import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { queryProfile } from "@/lib/query-config";
import { toast } from "sonner";

export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketChannel = "internal" | "email" | "form" | "chat";

export interface TicketRow {
  id: string;
  tenant_id: string;
  number: number;
  title: string;
  description: string | null;
  requester_user_id: string | null;
  requester_email: string | null;
  requester_name: string | null;
  owner_user_id: string | null;
  squad_id: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  channel: TicketChannel;
  sla_response_minutes: number | null;
  sla_resolution_minutes: number | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_user_id: string | null;
  body: string;
  internal: boolean;
  attachments: unknown;
  created_at: string;
}

export interface TicketEvent {
  id: string;
  ticket_id: string;
  actor_user_id: string | null;
  kind: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface TicketFilters {
  status?: TicketStatus | "all";
  priority?: TicketPriority | "all";
  ownerId?: string | null;
  search?: string;
}

export function useTickets(filters: TicketFilters = {}) {
  const { tenantId, loading: wsLoading } = useWorkspace();

  return useQuery({
    ...queryProfile("workload"),
    queryKey: [
      "tickets",
      tenantId,
      filters.status ?? "all",
      filters.priority ?? "all",
      filters.ownerId ?? "all",
      filters.search ?? "",
    ],
    enabled: !wsLoading && !!tenantId,
    queryFn: async (): Promise<TicketRow[]> => {
      let q = supabase
        .from("tickets")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters.status && filters.status !== "all") {
        q = q.eq("status", filters.status);
      }
      if (filters.priority && filters.priority !== "all") {
        q = q.eq("priority", filters.priority);
      }
      if (filters.ownerId) {
        q = q.eq("owner_user_id", filters.ownerId);
      }
      if (filters.search && filters.search.trim()) {
        q = q.ilike("title", `%${filters.search.trim()}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TicketRow[];
    },
  });
}

export function useTicket(id: string | undefined) {
  return useQuery({
    ...queryProfile("workload"),
    queryKey: ["ticket", id],
    enabled: !!id,
    queryFn: async (): Promise<TicketRow | null> => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as TicketRow | null;
    },
  });
}

export interface CreateTicketInput {
  title: string;
  description?: string;
  priority?: TicketPriority;
  channel?: TicketChannel;
  owner_user_id?: string | null;
  squad_id?: string | null;
  requester_email?: string | null;
  requester_name?: string | null;
  sla_response_minutes?: number | null;
  sla_resolution_minutes?: number | null;
  tags?: string[];
}

export function useCreateTicket() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { tenantId } = useWorkspace();

  return useMutation({
    mutationFn: async (input: CreateTicketInput): Promise<TicketRow> => {
      if (!user || !tenantId) throw new Error("Workspace ainda não está pronto");

      const payload = {
        tenant_id: tenantId,
        number: 0, // setado pelo trigger tg_set_ticket_number
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? "medium",
        channel: input.channel ?? "internal",
        owner_user_id: input.owner_user_id ?? null,
        squad_id: input.squad_id ?? null,
        requester_user_id: user.id,
        requester_email: input.requester_email ?? null,
        requester_name: input.requester_name ?? null,
        sla_response_minutes: input.sla_response_minutes ?? null,
        sla_resolution_minutes: input.sla_resolution_minutes ?? null,
        tags: input.tags ?? [],
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from("tickets")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as TicketRow;
    },
    onSuccess: (ticket) => {
      toast.success(`Ticket criado: ATD-${ticket.number}`);
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (e: Error) => toast.error("Erro ao criar ticket: " + e.message),
  });
}

export interface UpdateTicketInput {
  id: string;
  patch: Partial<
    Pick<
      TicketRow,
      | "title"
      | "description"
      | "priority"
      | "status"
      | "owner_user_id"
      | "squad_id"
      | "tags"
      | "sla_response_minutes"
      | "sla_resolution_minutes"
    >
  >;
}

export function useUpdateTicket() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: UpdateTicketInput) => {
      // Marca timestamps quando muda pra resolved/closed.
      const enriched: Record<string, unknown> = { ...patch };
      if (patch.status === "resolved") enriched.resolved_at = new Date().toISOString();
      if (patch.status === "closed") enriched.closed_at = new Date().toISOString();

      const { error } = await supabase
        .from("tickets")
        .update(enriched)
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["ticket", id] });
      qc.invalidateQueries({ queryKey: ["ticket-events", id] });
    },
    onError: (e: Error) => toast.error("Erro ao atualizar ticket: " + e.message),
  });
}

export function useTicketMessages(ticketId: string | undefined) {
  return useQuery({
    ...queryProfile("workload"),
    queryKey: ["ticket-messages", ticketId],
    enabled: !!ticketId,
    queryFn: async (): Promise<TicketMessage[]> => {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId!)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as TicketMessage[];
    },
  });
}

export interface AddTicketMessageInput {
  ticket_id: string;
  body: string;
  internal?: boolean;
  attachments?: unknown;
}

export function useAddTicketMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: AddTicketMessageInput) => {
      if (!user) throw new Error("Não autenticado");
      const payload = {
        ticket_id: input.ticket_id,
        author_user_id: user.id,
        body: input.body,
        internal: input.internal ?? false,
        attachments: input.attachments ?? [],
      };
      const { data, error } = await supabase
        .from("ticket_messages")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as TicketMessage;
    },
    onSuccess: (msg) => {
      qc.invalidateQueries({ queryKey: ["ticket-messages", msg.ticket_id] });
      qc.invalidateQueries({ queryKey: ["ticket-events", msg.ticket_id] });
      qc.invalidateQueries({ queryKey: ["ticket", msg.ticket_id] });
    },
    onError: (e: Error) => toast.error("Erro ao enviar mensagem: " + e.message),
  });
}

export function useTicketEvents(ticketId: string | undefined) {
  return useQuery({
    ...queryProfile("workload"),
    queryKey: ["ticket-events", ticketId],
    enabled: !!ticketId,
    queryFn: async (): Promise<TicketEvent[]> => {
      const { data, error } = await supabase
        .from("ticket_events")
        .select("*")
        .eq("ticket_id", ticketId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as TicketEvent[];
    },
  });
}

export interface AssignTicketInput {
  ticket_id: string;
  user_id: string;
}

export function useAssignTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticket_id, user_id }: AssignTicketInput) => {
      const { error } = await supabase.rpc("assign_ticket_owner", {
        _ticket_id: ticket_id,
        _user_id: user_id,
      });
      if (error) throw error;
      return ticket_id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["ticket", id] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["ticket-events", id] });
      toast.success("Ticket atribuído");
    },
    onError: (e: Error) => toast.error("Erro ao atribuir: " + e.message),
  });
}

// =============================================================================
// SLA helpers — baseados em created_at + sla_*_minutes
// =============================================================================

export type SlaState = "ok" | "warning" | "breached" | "na";

/**
 * Calcula estado do SLA. "warning" se faltam ≤ 25% do tempo; "breached"
 * se já passou. "na" quando não há SLA configurado.
 */
export function computeSlaState(
  ticket: Pick<
    TicketRow,
    "status" | "created_at" | "first_response_at" | "resolved_at"
    | "sla_response_minutes" | "sla_resolution_minutes"
  >,
  now: Date = new Date(),
): SlaState {
  if (ticket.status === "closed" || ticket.status === "resolved") return "ok";

  // primeiro avalia SLA de resolução; depois de resposta (se ainda sem first_response_at)
  const startMs = new Date(ticket.created_at).getTime();
  const nowMs = now.getTime();

  if (ticket.sla_resolution_minutes && !ticket.resolved_at) {
    const deadline = startMs + ticket.sla_resolution_minutes * 60_000;
    const window = ticket.sla_resolution_minutes * 60_000;
    if (nowMs > deadline) return "breached";
    if (deadline - nowMs <= window * 0.25) return "warning";
    return "ok";
  }

  if (ticket.sla_response_minutes && !ticket.first_response_at) {
    const deadline = startMs + ticket.sla_response_minutes * 60_000;
    const window = ticket.sla_response_minutes * 60_000;
    if (nowMs > deadline) return "breached";
    if (deadline - nowMs <= window * 0.25) return "warning";
    return "ok";
  }

  return "na";
}
