import { useState } from "react";
import { Plug, RefreshCw, Trash2, Power, Plus, ExternalLink, AlertTriangle, CheckCircle2, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useExternalIntegrations, useCreateIntegration, useToggleIntegration, useDeleteIntegration, useTriggerSync, PROVIDER_META, ExternalProvider } from "@/hooks/useExternalIntegrations";
import {
  useGcalSyncConfig,
  useGcalCalendars,
  useGcalGoogleConnection,
  useGcalSyncEnable,
  useGcalSyncDisable,
  useGcalToggle,
  useGcalSyncNow,
  useOAuthConnectGoogle,
} from "@/hooks/useGcalSync";
import SEO from "@/components/SEO";
import { DemoBadge } from "@/components/feedback/DemoBadge";
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
      <DemoBadge
        variant="banner"
        feature="Integrações externas"
        description="Conexões com Google Drive, Slack, Notion, Jira e Linear estão em modo mock."
        lovableHint="Defina os secrets de OAuth de cada provider em Lovable Cloud para ativar sync real."
      />
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <DemoBadge feature={PROVIDER_META[provider].label} />
                  <span>Sync/import já funcionam de forma simulada até as credenciais OAuth serem configuradas.</span>
                </div>
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

      <GcalSection />

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

function GcalSection() {
  const config = useGcalSyncConfig();
  const connection = useGcalGoogleConnection();
  const calendars = useGcalCalendars();
  const enable = useGcalSyncEnable();
  const disable = useGcalSyncDisable();
  const toggle = useGcalToggle();
  const syncNow = useGcalSyncNow();
  const connectGoogle = useOAuthConnectGoogle();
  const [calendarId, setCalendarId] = useState<string>("primary");

  const isLoading = config.isLoading || connection.isLoading;
  const hasConnection = !!connection.data;
  const hasSync = !!config.data;

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Google Calendar</h2>
            {hasSync && (
              <Badge variant="outline" className="text-success border-success/30">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Sincronizando
              </Badge>
            )}
            {hasConnection && !hasSync && <Badge variant="outline">Conectado</Badge>}
            {!hasConnection && !isLoading && <Badge variant="outline">Não conectado</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Sincronize tarefas com prazos do Oxy nos seus calendários do Google em duas vias.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando status...
        </div>
      ) : !hasConnection ? (
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-sm text-muted-foreground">
            Conecte sua conta Google para começar. Vamos pedir permissão de leitura e escrita no seu calendário.
          </p>
          <Button
            className="mt-3"
            onClick={() => connectGoogle.mutate()}
            disabled={connectGoogle.isPending}
            aria-label="Conectar conta Google"
          >
            {connectGoogle.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plug className="mr-2 h-4 w-4" />
            )}
            Conectar Google
          </Button>
        </div>
      ) : !hasSync ? (
        <div className="rounded-lg border p-4">
          <p className="text-sm">
            Conta conectada
            {connection.data?.account_email ? (
              <span className="text-muted-foreground"> ({connection.data.account_email})</span>
            ) : null}
            . Escolha o calendário de destino e ative a sincronização:
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="gcal-target" className="text-xs">
                Calendário de destino
              </Label>
              <Select value={calendarId} onValueChange={setCalendarId}>
                <SelectTrigger id="gcal-target" aria-label="Selecionar calendário de destino">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(calendars.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.summary}
                      {c.primary ? " (principal)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() =>
                enable.mutate({
                  oauth_connection_id: connection.data!.id,
                  target_calendar_id: calendarId,
                })
              }
              disabled={enable.isPending}
              aria-label="Ativar sincronização com Google Calendar"
            >
              {enable.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Ativar sincronização
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Calendário: <span className="font-mono">{config.data?.target_calendar_id}</span>
            </span>
            {config.data?.last_sync_at ? (
              <span>
                Última sync{" "}
                {formatDistanceToNow(new Date(config.data.last_sync_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            ) : (
              <span>Aguardando primeira sincronização</span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Importar do GCal pro Oxy</p>
                <p className="text-xs text-muted-foreground">Eventos viram tarefas no Oxy</p>
              </div>
              <Switch
                checked={!!config.data?.sync_pull_enabled}
                disabled={toggle.isPending}
                onCheckedChange={(v) => toggle.mutate({ pull: v })}
                aria-label="Importar eventos do Google Calendar para o Oxy"
              />
            </label>
            <label className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Enviar do Oxy pro GCal</p>
                <p className="text-xs text-muted-foreground">Tarefas com prazo viram eventos</p>
              </div>
              <Switch
                checked={!!config.data?.sync_push_enabled}
                disabled={toggle.isPending}
                onCheckedChange={(v) => toggle.mutate({ push: v })}
                aria-label="Enviar tarefas do Oxy para o Google Calendar"
              />
            </label>
          </div>

          {config.data?.last_error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{config.data.last_error}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => syncNow.mutate()}
              disabled={syncNow.isPending}
              aria-label="Sincronizar agora"
            >
              {syncNow.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sincronizar agora
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => disable.mutate()}
              disabled={disable.isPending}
              aria-label="Desconectar sincronização"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}