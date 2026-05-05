import { useState } from "react";
import { Inbox as InboxIcon, RefreshCw, MessageSquare, AlertCircle, HelpCircle, Smile, Meh, Frown, Send, ListPlus, Archive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInbox, useInboxSummary, useUpdateInboxItem, useConvertInboxToTask, pollInboxNow, type InboxStatus, type InboxSentiment, type InboxItem } from "@/hooks/useSocialOps";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SocialChannel } from "@/hooks/useSocialMedia";
import { DemoBadge } from "@/components/feedback/DemoBadge";

const SENT_META: Record<InboxSentiment, { label: string; cls: string; Icon: typeof Smile }> = {
  positive: { label: "Positivo",  cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", Icon: Smile },
  neutral:  { label: "Neutro",    cls: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",         Icon: Meh },
  negative: { label: "Negativo",  cls: "bg-red-500/10 text-red-700 dark:text-red-400",            Icon: Frown },
  question: { label: "Pergunta",  cls: "bg-sky-500/10 text-sky-700 dark:text-sky-400",            Icon: HelpCircle },
};

const STATUS_LABEL: Record<InboxStatus, string> = {
  new: "Nova", reading: "Lendo", replied: "Respondida", ignored: "Ignorada", task_created: "Virou tarefa", archived: "Arquivada",
};

export default function SocialInboxPage() {
  const { tenantId } = useWorkspace();
  const [status, setStatus] = useState<InboxStatus | "all">("new");
  const [channel, setChannel] = useState<SocialChannel | "all">("all");
  const [sentiment, setSentiment] = useState<InboxSentiment | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [reply, setReply] = useState("");
  const [polling, setPolling] = useState(false);

  const { data: items = [], isLoading } = useInbox({ status, channel, sentiment, search });
  const { data: summary } = useInboxSummary();
  const update = useUpdateInboxItem();
  const toTask = useConvertInboxToTask();

  const handlePoll = async () => {
    if (!tenantId) return;
    setPolling(true);
    try {
      const r = await pollInboxNow(tenantId, 6);
      toast.success(`${r.inserted} mensagem(ns) adicionada(s)`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "falha"); }
    finally { setPolling(false); }
  };

  return (
    <div className="space-y-4 p-6">
      <DemoBadge
        variant="banner"
        feature="Inbox social"
        description="Comentários e DMs estão em modo mock."
        lovableHint="Conecte OAuth de Meta/LinkedIn em Configurações → Integrações para receber dados reais."
      />
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <InboxIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-bold tracking-tight">Inbox social</h1>
          <p className="text-sm text-muted-foreground">DMs, comentários e menções de todos os canais.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePoll} disabled={polling}>
          {polling ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
          Buscar novas (mock)
        </Button>
      </header>

      {summary && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          <KPI label="Total" value={summary.total ?? 0} />
          <KPI label="Novas" value={summary.new ?? 0} accent="primary" />
          <KPI label="Respondidas" value={summary.replied ?? 0} accent="success" />
          <KPI label="Viraram tarefa" value={summary.task ?? 0} />
          <KPI label="Negativas" value={summary.negative ?? 0} accent="destructive" />
          <KPI label="Perguntas" value={summary.question ?? 0} accent="info" />
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[360px_1fr]">
        {/* Lista */}
        <Card className="p-3">
          <div className="space-y-2">
            <Input placeholder="Buscar mensagem..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8" />
            <div className="grid grid-cols-3 gap-1.5">
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  {(Object.keys(STATUS_LABEL) as InboxStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Canais</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sentiment} onValueChange={(v) => setSentiment(v as typeof sentiment)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sentimento</SelectItem>
                  {(Object.keys(SENT_META) as InboxSentiment[]).map((s) => (
                    <SelectItem key={s} value={s}>{SENT_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 max-h-[60vh] space-y-1.5 overflow-y-auto">
            {isLoading && <p className="py-8 text-center text-xs text-muted-foreground">Carregando…</p>}
            {!isLoading && items.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Nenhuma mensagem. Clique em "Buscar novas" para gerar mocks.
              </p>
            )}
            {items.map((item) => {
              const sm = item.sentiment ? SENT_META[item.sentiment] : null;
              const SmIcon = sm?.Icon ?? MessageSquare;
              return (
                <button
                  key={item.id}
                  onClick={() => { setSelected(item); setReply(item.reply_text ?? item.ai_suggested_reply ?? ""); if (item.status === "new") update.mutate({ id: item.id, status: "reading" }); }}
                  className={cn(
                    "w-full rounded-md border p-2 text-left transition hover:bg-accent",
                    selected?.id === item.id && "border-primary bg-primary/5",
                    item.status === "new" && "border-l-2 border-l-primary",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn("mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px]", sm?.cls ?? "bg-muted")}>
                      <SmIcon className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-xs font-medium">
                        <span className="truncate">{item.author_handle ?? item.author_name ?? "anônimo"}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">· {item.channel}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(item.received_at), { addSuffix: true, locale: ptBR })}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Detalhe */}
        <Card className="p-4">
          {!selected ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-sm text-muted-foreground">
              <MessageSquare className="mb-2 h-8 w-8 opacity-40" />
              Selecione uma mensagem
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold uppercase">
                  {(selected.author_name ?? selected.author_handle ?? "?").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{selected.author_name ?? selected.author_handle}</p>
                  <p className="text-xs text-muted-foreground capitalize">{selected.author_handle} · {selected.channel} · {selected.kind}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selected.sentiment && (
                    <Badge variant="secondary" className={SENT_META[selected.sentiment].cls}>
                      {SENT_META[selected.sentiment].label}
                    </Badge>
                  )}
                  <Badge variant="outline">{STATUS_LABEL[selected.status]}</Badge>
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                {selected.message}
              </div>

              {selected.ai_summary && (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-2 text-xs">
                  <span className="font-semibold text-primary">IA:</span> {selected.ai_summary}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Sua resposta</label>
                <Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)}
                  placeholder={selected.ai_suggested_reply ?? "Escreva uma resposta..."} />
                {selected.ai_suggested_reply && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setReply(selected.ai_suggested_reply!)}>
                    Usar sugestão da IA
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={async () => {
                  await update.mutateAsync({ id: selected.id, reply_text: reply, status: "replied" });
                  setSelected(null); toast.success("Marcada como respondida");
                }}>
                  <Send className="mr-1.5 h-3.5 w-3.5" /> Marcar como respondida
                </Button>
                <Button variant="outline" size="sm" onClick={async () => {
                  await toTask.mutateAsync({ id: selected.id });
                  setSelected(null);
                }}>
                  <ListPlus className="mr-1.5 h-3.5 w-3.5" /> Virar tarefa
                </Button>
                <Button variant="ghost" size="sm" onClick={async () => {
                  await update.mutateAsync({ id: selected.id, status: "ignored" });
                  setSelected(null);
                }}>
                  <AlertCircle className="mr-1.5 h-3.5 w-3.5" /> Ignorar
                </Button>
                <Button variant="ghost" size="sm" onClick={async () => {
                  await update.mutateAsync({ id: selected.id, status: "archived" });
                  setSelected(null);
                }}>
                  <Archive className="mr-1.5 h-3.5 w-3.5" /> Arquivar
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: number; accent?: "primary" | "success" | "destructive" | "info" }) {
  const tone = accent === "primary" ? "text-primary"
             : accent === "success" ? "text-emerald-600 dark:text-emerald-400"
             : accent === "destructive" ? "text-destructive"
             : accent === "info" ? "text-sky-600 dark:text-sky-400"
             : "text-foreground";
  return (
    <Card className="p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums", tone)}>{value}</p>
    </Card>
  );
}