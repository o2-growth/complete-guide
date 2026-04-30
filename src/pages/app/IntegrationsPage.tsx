import { useState } from "react";
import { Plug, Plus, Trash2, RefreshCw, ExternalLink, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useIntegrations, useUpsertIntegration, useDeleteIntegration,
  useScheduledPublishes, runPublishTick, publishNow,
} from "@/hooks/useSocialIntel";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const PROVIDERS = [
  { id: "meta", label: "Meta (Instagram + Facebook)", scopes: ["instagram_basic", "instagram_content_publish", "pages_show_list"] },
  { id: "linkedin", label: "LinkedIn", scopes: ["w_member_social", "r_liteprofile"] },
  { id: "tiktok", label: "TikTok", scopes: ["video.publish"] },
] as const;

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  mock:    { label: "Mock",        cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400", icon: AlertCircle },
  active:  { label: "Ativa",       cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
  expired: { label: "Expirada",    cls: "bg-orange-500/10 text-orange-700", icon: Clock },
  revoked: { label: "Revogada",    cls: "bg-red-500/10 text-red-700", icon: AlertCircle },
  error:   { label: "Erro",        cls: "bg-red-500/10 text-red-700", icon: AlertCircle },
};

export default function IntegrationsPage() {
  const { data: integrations = [] } = useIntegrations();
  const { data: queue = [] } = useScheduledPublishes("all");
  const upsert = useUpsertIntegration();
  const del = useDeleteIntegration();

  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<typeof PROVIDERS[number]["id"]>("meta");
  const [name, setName] = useState("");
  const [accountId, setAccountId] = useState("");

  const handleConnect = async () => {
    if (!name) return toast.error("Informe o nome da conta");
    const scopes = [...(PROVIDERS.find((p) => p.id === provider)?.scopes ?? [])];
    await upsert.mutateAsync({ provider, account_name: name, account_id: accountId || undefined, scopes, status: "mock" });
    setOpen(false); setName(""); setAccountId("");
  };

  const handleTick = async () => {
    try {
      const r = await runPublishTick();
      toast.success(`${r.processed} item(ns) processado(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Plug className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Integrações sociais</h1>
          <p className="text-sm text-muted-foreground">Conecte contas e gerencie a fila de publicação automática.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleTick}>
          <RefreshCw className="mr-1.5 h-4 w-4" /> Processar fila agora
        </Button>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Conectar conta
        </Button>
      </header>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Contas conectadas</h3>
          <span className="text-xs text-muted-foreground">{integrations.length} conta(s)</span>
        </div>
        {integrations.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma conta conectada. Use o botão acima para criar uma integração mock — fica funcional sem credenciais reais.
          </p>
        ) : (
          <div className="space-y-2">
            {integrations.map((i) => {
              const s = STATUS_BADGE[i.status] ?? STATUS_BADGE.mock;
              const Icon = s.icon;
              return (
                <div key={i.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold uppercase">
                    {i.provider.slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{i.account_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.provider} · {(i.scopes ?? []).join(", ") || "sem escopos"}
                    </p>
                  </div>
                  <Badge variant="secondary" className={s.cls}>
                    <Icon className="mr-1 h-3 w-3" /> {s.label}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(i.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-3 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          💡 Para ativar publicação real, peça ao admin para adicionar os secrets <code>META_APP_ID/SECRET</code> e/ou <code>LINKEDIN_CLIENT_ID/SECRET</code>. Sem eles, a fila roda em modo mock — agenda, marca como publicado e registra no audit log.
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Fila de publicação ({queue.length})</h3>
        {queue.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum agendamento. Marque uma tarefa como <b>scheduled</b> com data/hora.</p>
        ) : (
          <div className="space-y-1.5">
            {queue.slice(0, 50).map((p) => (
              <div key={p.id} className="flex items-center gap-3 border-b py-1.5 text-xs last:border-0">
                <span className="w-20 capitalize">{p.channel}</span>
                <span className="flex-1">{format(new Date(p.scheduled_at), "dd MMM yyyy HH:mm", { locale: ptBR })}</span>
                <Badge variant="outline" className="capitalize">{p.status}</Badge>
                {p.attempts > 0 && <span className="text-muted-foreground">{p.attempts}x</span>}
                {p.external_url && (
                  <a href={p.external_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {p.status === "pending" && (
                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={async () => {
                    try { await publishNow(p.id); toast.success("Publicado"); } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); }
                  }}>Publicar agora</Button>
                )}
                {p.error && <span className="text-destructive">{p.error.slice(0, 40)}</span>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Conectar nova conta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Plataforma</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as typeof provider)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da conta (ex: @suamarca)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="@suamarca" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ID externo (opcional, deixe vazio para mock)</Label>
              <Input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="auto-gerado" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleConnect}>Conectar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}