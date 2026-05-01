import { useState } from "react";
import { Plug, RefreshCw, Trash2, Power, Plus, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExternalIntegrations, useCreateIntegration, useToggleIntegration, useDeleteIntegration, useTriggerSync, PROVIDER_META, ExternalProvider } from "@/hooks/useExternalIntegrations";
import SEO from "@/components/SEO";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ExternalIntegrationsPage() {
  const { data: items = [], isLoading } = useExternalIntegrations();
  const create = useCreateIntegration();
  const toggle = useToggleIntegration();
  const del = useDeleteIntegration();
  const sync = useTriggerSync();
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<ExternalProvider>("google_drive");
  const [name, setName] = useState("");
  const [webhook, setWebhook] = useState("");

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <SEO title="Integrações nativas — Oxy" description="Conecte Google Drive, Slack, Notion, Jira, Linear e mais." />
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Plug className="h-7 w-7" /> Integrações nativas</h1>
          <p className="mt-1 text-muted-foreground">Conecte ferramentas externas ao seu workspace.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nova conexão</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Conectar integração</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Provider</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as ExternalProvider)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROVIDER_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">{PROVIDER_META[provider].description}</p>
              </div>
              <div>
                <Label>Nome de exibição</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Drive da equipe" />
              </div>
              {(provider === "zapier" || provider === "make") && (
                <div>
                  <Label>Webhook URL</Label>
                  <Input value={webhook} onChange={(e) => setWebhook(e.target.value)} placeholder="https://hooks.zapier.com/..." />
                </div>
              )}
              {PROVIDER_META[provider].oauth && (
                <Card className="border-warning/40 bg-warning/5 p-3 text-xs">
                  <strong>OAuth real:</strong> a conexão fica em modo demo até as credenciais OAuth serem configuradas. As ações de sync/import já funcionam de forma simulada.
                </Card>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                disabled={!name || create.isPending}
                onClick={async () => {
                  await create.mutateAsync({ provider, display_name: name, webhook_url: webhook || undefined });
                  setOpen(false); setName(""); setWebhook("");
                }}
              >Conectar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {!isLoading && items.length === 0 && (
        <Card className="p-12 text-center">
          <Plug className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-semibold">Nenhuma integração conectada ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">Comece com Google Drive, Slack ou Notion.</p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it) => (
          <Card key={it.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{it.display_name}</h3>
                  {it.status === "connected" && <Badge variant="outline" className="text-success border-success/30"><CheckCircle2 className="mr-1 h-3 w-3" />Ativo</Badge>}
                  {it.status === "error" && <Badge variant="outline" className="text-destructive border-destructive/30"><AlertTriangle className="mr-1 h-3 w-3" />Erro</Badge>}
                  {it.status === "disconnected" && <Badge variant="outline">Desconectado</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{PROVIDER_META[it.provider]?.label} · sync {it.sync_schedule}</p>
                {it.last_sync_at && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Última sync: {formatDistanceToNow(new Date(it.last_sync_at), { addSuffix: true, locale: ptBR })}
                  </p>
                )}
                {it.webhook_url && (
                  <a href={it.webhook_url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs text-primary">
                    <ExternalLink className="h-3 w-3" /> webhook
                  </a>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => sync.mutate(it.id)} disabled={sync.isPending} title="Sincronizar agora">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggle.mutate({ id: it.id, status: it.status === "connected" ? "disconnected" : "connected" })} title="Ligar/desligar">
                  <Power className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => del.mutate(it.id)} title="Remover">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}