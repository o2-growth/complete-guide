import { useMemo, useState } from "react";
import { Headphones, Plus, Search } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useTickets,
  type TicketPriority,
  type TicketStatus,
} from "@/hooks/useTickets";
import { TicketRow } from "@/components/atendimento/TicketRow";
import { TicketDialog } from "@/components/atendimento/TicketDialog";

const TABS: Array<{ value: TicketStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "open", label: "Abertos" },
  { value: "in_progress", label: "Em atendimento" },
  { value: "waiting", label: "Aguardando" },
  { value: "resolved", label: "Resolvidos" },
  { value: "closed", label: "Fechados" },
];

export default function AtendimentoPage() {
  const [statusTab, setStatusTab] = useState<TicketStatus | "all">("all");
  const [priority, setPriority] = useState<TicketPriority | "all">("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data, isLoading, error, refetch } = useTickets({
    status: statusTab,
    priority,
    search,
  });

  const grouped = useMemo(() => {
    const map: Record<TicketStatus, number> = {
      open: 0,
      in_progress: 0,
      waiting: 0,
      resolved: 0,
      closed: 0,
    };
    (data ?? []).forEach((t) => {
      map[t.status] = (map[t.status] ?? 0) + 1;
    });
    return map;
  }, [data]);

  return (
    <main className="container mx-auto flex max-w-5xl flex-col gap-4 px-3 py-4 md:px-4 md:py-6">
      <SEO
        title="Atendimento — Oxy Growth OS"
        description="Tickets de longo prazo com SLA próprio."
      />

      <PageHeader
        icon={Headphones}
        title="Atendimento"
        description="Tickets de longo prazo, com SLA de resposta e resolução."
        actions={
          <Button onClick={() => setOpen(true)} variant="hero">
            <Plus className="mr-1.5 h-4 w-4" />
            Novo ticket
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título…"
            className="pl-8"
            aria-label="Buscar tickets"
          />
        </div>
        <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority | "all")}>
          <SelectTrigger className="md:w-44" aria-label="Filtrar por prioridade">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as prioridades</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as TicketStatus | "all")}>
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-muted/50">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs md:text-sm">
              {t.label}
              {t.value !== "all" && grouped[t.value as TicketStatus] > 0 && (
                <span className="ml-1.5 rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] tabular-nums">
                  {grouped[t.value as TicketStatus]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading && <ListSkeleton rows={5} />}

      {error && (
        <ErrorState
          title="Não foi possível carregar tickets"
          description={(error as Error).message}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <EmptyState
          icon={Headphones}
          title="Sem tickets ainda"
          description="Crie um ticket pra abrir um chamado com SLA dedicado."
          action={{
            label: "Novo ticket",
            onClick: () => setOpen(true),
            icon: Plus,
          }}
        />
      )}

      {!isLoading && !error && (data?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-2">
          {(data ?? []).map((t) => (
            <TicketRow key={t.id} ticket={t} />
          ))}
        </div>
      )}

      <TicketDialog open={open} onOpenChange={setOpen} />
    </main>
  );
}
