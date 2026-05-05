import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Flag,
  Loader2,
  Send,
  ShieldCheck,
  Tag as TagIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichEditor } from "@/components/tasks/RichEditor";
import { TicketStatusBadge } from "@/components/atendimento/TicketStatusBadge";
import { TICKET_STATUS_LABELS } from "@/components/atendimento/ticket-status-meta";
import { TicketSlaBadge } from "@/components/atendimento/TicketSlaBadge";
import {
  useTicket,
  useTicketEvents,
  useTicketMessages,
  useAddTicketMessage,
  useUpdateTicket,
  type TicketPriority,
  type TicketStatus,
} from "@/hooks/useTickets";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRIO_LABEL: Record<TicketPriority, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const PRIO_CLASS: Record<TicketPriority, string> = {
  urgent: "text-[hsl(var(--prio-urgent))]",
  high: "text-[hsl(var(--prio-high))]",
  medium: "text-[hsl(var(--prio-medium))]",
  low: "text-[hsl(var(--prio-low))]",
};

const EVENT_LABELS: Record<string, string> = {
  created: "criou o ticket",
  status_changed: "mudou o status",
  assigned: "atribuiu o ticket",
  priority_changed: "mudou a prioridade",
  commented: "comentou",
  sla_breached: "SLA estourou",
  task_created: "criou tarefa relacionada",
};

function fmtDate(iso: string) {
  return format(new Date(iso), "dd 'de' MMM 'às' HH'h'mm", { locale: ptBR });
}

function authorName(authorId: string | null, members: Array<{ id: string; display_name: string | null; full_name: string | null; email: string | null }>) {
  if (!authorId) return "Sistema";
  const m = members.find((x) => x.id === authorId);
  return m?.display_name || m?.full_name || m?.email || "Usuário";
}

export default function AtendimentoTicketPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { tenantId, inboxProjectId } = useWorkspace();

  const ticketQ = useTicket(id);
  const messagesQ = useTicketMessages(id);
  const eventsQ = useTicketEvents(id);
  const update = useUpdateTicket();
  const addMsg = useAddTicketMessage();
  const { data: members = [] } = useTenantMembers();

  const ticket = ticketQ.data ?? null;

  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);

  const submitMessage = () => {
    if (!ticket) return;
    const cleaned = body.replace(/<[^>]*>/g, "").trim();
    if (!cleaned) return;
    addMsg.mutate(
      { ticket_id: ticket.id, body, internal },
      { onSuccess: () => setBody("") },
    );
  };

  const handleStatusChange = (next: TicketStatus) => {
    if (!ticket || ticket.status === next) return;
    update.mutate({ id: ticket.id, patch: { status: next } });
  };

  const handlePriorityChange = (next: TicketPriority) => {
    if (!ticket || ticket.priority === next) return;
    update.mutate({ id: ticket.id, patch: { priority: next } });
  };

  const handleOwnerChange = (next: string) => {
    if (!ticket) return;
    const value = next === "__none" ? null : next;
    update.mutate({ id: ticket.id, patch: { owner_user_id: value } });
  };

  const createTaskFromTicket = async () => {
    if (!ticket || !user || !tenantId || !inboxProjectId) {
      toast.error("Workspace ainda não está pronto");
      return;
    }
    const desc = `Originado do ticket ATD-${ticket.number}.\n\n${ticket.description ?? ""}`.trim();
    const payload = {
      tenant_id: tenantId,
      project_id: inboxProjectId,
      title: ticket.title,
      description: desc,
      priority: ticket.priority === "urgent" ? "urgent" : ticket.priority,
      assignee_id: ticket.owner_user_id ?? user.id,
      reporter_id: user.id,
      created_by: user.id,
      number: 0,
    };
    const { data, error } = await supabase.from("tasks").insert(payload).select("id, code, number").single();
    if (error) {
      toast.error("Erro ao criar tarefa: " + error.message);
      return;
    }
    // Loga evento no ticket (não-bloqueante).
    try {
      await supabase.from("ticket_events").insert({
        ticket_id: ticket.id,
        actor_user_id: user.id,
        kind: "task_created",
        payload: { task_id: data.id, task_code: data.code ?? `#${data.number}` },
      });
    } catch (e) {
      // best-effort: o evento via trigger não cobre task_created porque task vive em outra tabela
      console.warn("Falha ao registrar ticket_event task_created", e);
    }
    eventsQ.refetch();
    toast.success(`Tarefa ${data.code ?? "#" + data.number} criada a partir do ticket`);
  };

  const timeline = useMemo(() => {
    return (eventsQ.data ?? []).slice();
  }, [eventsQ.data]);

  if (ticketQ.isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Card className="border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">Ticket não encontrado.</p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/app/atendimento">Voltar pra Atendimento</Link>
          </Button>
        </Card>
      </main>
    );
  }

  const empty = !body.replace(/<[^>]*>/g, "").trim();

  return (
    <main className="container mx-auto flex max-w-6xl flex-col gap-4 px-3 py-4 md:px-4 md:py-6">
      <SEO
        title={`ATD-${ticket.number} ${ticket.title} — Atendimento`}
        description="Detalhe do ticket de atendimento."
      />

      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/app/atendimento" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Atendimento
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">ATD-{ticket.number}</span>
      </nav>

      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-[11px]">
              ATD-{ticket.number}
            </Badge>
            <TicketStatusBadge status={ticket.status} />
            <TicketSlaBadge ticket={ticket} />
            <Flag className={cn("h-3.5 w-3.5", PRIO_CLASS[ticket.priority])} />
            <span className="text-xs text-muted-foreground">{PRIO_LABEL[ticket.priority]}</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{ticket.title}</h1>
          {ticket.description && (
            <p className="max-w-2xl text-sm text-muted-foreground">{ticket.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={createTaskFromTicket}>
            <ClipboardList className="mr-1.5 h-4 w-4" />
            Criar tarefa a partir deste ticket
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        {/* Coluna principal: thread + timeline */}
        <Card className="flex flex-col gap-3 p-3 md:p-4">
          <Tabs defaultValue="thread">
            <TabsList>
              <TabsTrigger value="thread">Conversa</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
            </TabsList>

            <TabsContent value="thread" className="space-y-4 pt-3">
              <div className="flex flex-col gap-2">
                <RichEditor
                  value={body}
                  onChange={setBody}
                  placeholder={
                    internal
                      ? "Nota interna (não visível pro requester)…"
                      : "Responder ao ticket… ('/' comandos, '@' mencionar)"
                  }
                  enableMentions
                  className="min-h-[80px]"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="ticket-msg-internal"
                      checked={internal}
                      onCheckedChange={setInternal}
                    />
                    <Label htmlFor="ticket-msg-internal" className="text-xs text-muted-foreground">
                      Nota interna
                    </Label>
                  </div>
                  <Button onClick={submitMessage} disabled={empty || addMsg.isPending} size="sm">
                    {addMsg.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-1.5 h-4 w-4" />
                    )}
                    Enviar
                  </Button>
                </div>
              </div>

              <Separator />

              {messagesQ.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (messagesQ.data?.length ?? 0) === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Nenhuma mensagem ainda. Comece a conversa.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {(messagesQ.data ?? []).map((m) => (
                    <li
                      key={m.id}
                      className={cn(
                        "rounded-md border p-3 text-sm",
                        m.internal
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "bg-card",
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {authorName(m.author_user_id, members)}
                        </span>
                        <span>
                          {m.internal && (
                            <Badge variant="outline" className="mr-2 h-4 border-amber-500/40 px-1.5 py-0 text-[10px] text-amber-700 dark:text-amber-300">
                              Interno
                            </Badge>
                          )}
                          {fmtDate(m.created_at)}
                        </span>
                      </div>
                      <div
                        className="prose prose-sm max-w-none text-sm dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: m.body }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="activity" className="pt-3">
              {eventsQ.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : timeline.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Sem eventos registrados ainda.
                </p>
              ) : (
                <ol className="space-y-2">
                  {timeline.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex items-start gap-2 rounded-md border bg-muted/20 p-2 text-xs"
                    >
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p>
                          <span className="font-medium">
                            {authorName(ev.actor_user_id, members)}
                          </span>{" "}
                          {EVENT_LABELS[ev.kind] ?? ev.kind}
                        </p>
                        {ev.payload && Object.keys(ev.payload).length > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            {JSON.stringify(ev.payload)}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {fmtDate(ev.created_at)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Sidebar direita */}
        <aside className="flex flex-col gap-3">
          <Card className="space-y-3 p-3 text-sm">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={ticket.status} onValueChange={(v) => handleStatusChange(v as TicketStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TICKET_STATUS_LABELS) as TicketStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{TICKET_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Prioridade</Label>
              <Select value={ticket.priority} onValueChange={(v) => handlePriorityChange(v as TicketPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Atribuído a</Label>
              <Select
                value={ticket.owner_user_id ?? "__none"}
                onValueChange={handleOwnerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ninguém" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Ninguém</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.display_name || m.full_name || m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>SLA resposta</span>
                <span className="text-foreground">
                  {ticket.sla_response_minutes ? `${ticket.sla_response_minutes}min` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>SLA resolução</span>
                <span className="text-foreground">
                  {ticket.sla_resolution_minutes ? `${ticket.sla_resolution_minutes}min` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Canal</span>
                <span className="text-foreground capitalize">{ticket.channel}</span>
              </div>
              <div className="flex justify-between">
                <span>Criado</span>
                <span className="text-foreground">{fmtDate(ticket.created_at)}</span>
              </div>
              {ticket.first_response_at && (
                <div className="flex justify-between">
                  <span>1ª resposta</span>
                  <span className="text-foreground">{fmtDate(ticket.first_response_at)}</span>
                </div>
              )}
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span>Resolvido</span>
                  <span className="text-foreground">{fmtDate(ticket.resolved_at)}</span>
                </div>
              )}
            </div>
          </Card>

          {ticket.tags.length > 0 && (
            <Card className="space-y-2 p-3 text-sm">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                <TagIcon className="h-3 w-3" /> Tags
              </Label>
              <div className="flex flex-wrap gap-1">
                {ticket.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[11px]">
                    {t}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </main>
  );
}
