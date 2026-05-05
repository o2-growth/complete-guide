import { useMemo, useState } from "react";
import { Headphones, Loader2, Plus, Search } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

  const { data, isLoading, error } = useTickets({
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

      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-brand">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Atendimento</h1>
            <p className="text-sm text-muted-foreground">
              Tickets de longo prazo, com SLA de resposta e resolução.
            </p>
          </div>
        </div>
        <Button onClick={() => setOpen(true)} variant="hero">
          <Plus className="mr-1.5 h-4 w-4" />
          Novo ticket
        </Button>
      </header>

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

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-label="Carregando tickets" />
        </div>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar tickets: {(error as Error).message}
        </Card>
      )}

      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <Card className="flex flex-col items-center gap-2 border-dashed p-10 text-center">
          <Headphones className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm font-medium">Nenhum ticket por aqui ainda</p>
          <p className="text-xs text-muted-foreground">
            Crie um ticket pra abrir um chamado com SLA dedicado.
          </p>
          <Button onClick={() => setOpen(true)} size="sm" variant="outline" className="mt-2">
            <Plus className="mr-1.5 h-4 w-4" />
            Novo ticket
          </Button>
        </Card>
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
