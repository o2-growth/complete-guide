import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useApiTokens, useWebhooks, useChatIntegrations, usePushSubscription } from "@/hooks/useDeveloperHub";
import { Code2, Webhook, MessageSquare, Smartphone, Copy, Trash2, Send, RefreshCw, Plus, Bell } from "lucide-react";
import { toast } from "sonner";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const API_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1/api-public`;

const EVENT_OPTS = ["task.created", "task.completed", "anomaly.created", "task.overdue"];

function copy(s: string) {
  navigator.clipboard.writeText(s);
  toast.success("Copiado");
}

function ApiTokensTab() {
  const tokens = useApiTokens();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["read"]);
  const [generated, setGenerated] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Dê um nome ao token");
    const t = await tokens.create.mutateAsync({ name, scopes });
    setGenerated(t);
    setName("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tokens de API</h3>
          <p className="text-sm text-muted-foreground">Use para autenticar requisições à API pública do Oxy.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setGenerated(null); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo token</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar token de API</DialogTitle>
            </DialogHeader>
            {!generated ? (
              <div className="space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Integração Zapier" />
                </div>
                <div>
                  <Label>Escopos</Label>
                  <div className="flex gap-2 mt-2">
                    {["read", "write"].map((s) => (
                      <label key={s} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={scopes.includes(s)}
                          onChange={(e) => setScopes(e.target.checked ? [...scopes, s] : scopes.filter((x) => x !== s))}
                        /> {s}
                      </label>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={tokens.create.isPending}>Gerar</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Copie agora — o token não será exibido novamente.</p>
                <div className="flex gap-2">
                  <Input value={generated} readOnly className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => copy(generated)}><Copy className="h-4 w-4" /></Button>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setOpen(false); setGenerated(null); }}>Fechar</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Endpoint base</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={API_BASE} readOnly className="font-mono text-xs" />
            <Button size="icon" variant="outline" onClick={() => copy(API_BASE)}><Copy className="h-4 w-4" /></Button>
          </div>
          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            <p>Recursos: <code>/tasks</code>, <code>/projects</code>, <code>/anomalies</code>, <code>/ping</code></p>
            <p>Auth: header <code>X-API-Key: oxy_...</code></p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {tokens.data?.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.name}</span>
                  {t.revoked_at && <Badge variant="destructive">Revogado</Badge>}
                  {t.scopes.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{t.token_prefix}…</p>
                <p className="text-xs text-muted-foreground">
                  Último uso: {t.last_used_at ? new Date(t.last_used_at).toLocaleString("pt-BR") : "nunca"}
                </p>
              </div>
              {!t.revoked_at && (
                <Button size="sm" variant="ghost" onClick={() => tokens.revoke.mutate(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {tokens.data?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum token criado.</p>}
      </div>
    </div>
  );
}

function WebhooksTab() {
  const { list, deliveries, create, toggle, remove, dispatchNow } = useWebhooks();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", events: ["task.created", "task.completed"] });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhooks de saída</h3>
          <p className="text-sm text-muted-foreground">Receba eventos do Oxy em tempo real no seu sistema.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => dispatchNow.mutate()}>
            <RefreshCw className="h-4 w-4 mr-1" />Processar fila
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo webhook</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo webhook</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
                <div>
                  <Label>Eventos</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {EVENT_OPTS.map((ev) => (
                      <label key={ev} className="flex items-center gap-1.5 text-sm">
                        <input type="checkbox" checked={form.events.includes(ev)}
                          onChange={(e) => setForm({ ...form, events: e.target.checked ? [...form.events, ev] : form.events.filter((x) => x !== ev) })} />
                        <code className="text-xs">{ev}</code>
                      </label>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={async () => {
                    if (!form.url) return toast.error("URL obrigatória");
                    await create.mutateAsync(form);
                    setOpen(false); setForm({ name: "", url: "", events: ["task.created", "task.completed"] });
                  }}>Criar</Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-2">
        {list.data?.map((w) => (
          <Card key={w.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{w.name}</span>
                    {w.last_status && <Badge variant={w.last_status < 300 ? "default" : "destructive"}>{w.last_status}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono break-all">{w.url}</p>
                  <div className="flex flex-wrap gap-1">
                    {w.events.map((e) => <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={w.active} onCheckedChange={(c) => toggle.mutate({ id: w.id, active: c })} />
                  <Button size="icon" variant="ghost" onClick={() => copy(w.secret)} title="Copiar secret"><Copy className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(w.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {list.data?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum webhook configurado.</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Últimas entregas</CardTitle>
          <CardDescription>Histórico das 30 últimas chamadas. Assinatura em <code>X-Oxy-Signature: sha256=...</code></CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {deliveries.data?.map((d) => (
            <div key={d.id} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
              <code>{d.event}</code>
              <div className="flex items-center gap-2">
                <Badge variant={d.status === "sent" ? "default" : d.status === "failed" ? "destructive" : "secondary"}>{d.status}</Badge>
                {d.http_status && <span className="text-muted-foreground">{d.http_status}</span>}
                <span className="text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-BR")}</span>
              </div>
            </div>
          ))}
          {deliveries.data?.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma entrega ainda.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function ChatTab() {
  const { list, create, remove, testSend } = useChatIntegrations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ provider: "slack" | "teams" | "discord"; name: string; webhook_url: string; channel: string }>({
    provider: "slack", name: "", webhook_url: "", channel: "",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Slack · Teams · Discord</h3>
          <p className="text-sm text-muted-foreground">Receba notificações importantes no seu canal de chat.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Conectar canal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova integração de chat</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Plataforma</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v as typeof form.provider })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slack">Slack (Incoming Webhook)</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                    <SelectItem value="discord">Discord</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex: #growth-alerts" /></div>
              <div>
                <Label>Webhook URL</Label>
                <Input value={form.webhook_url} onChange={(e) => setForm({ ...form, webhook_url: e.target.value })} placeholder="https://hooks.slack.com/..." />
                <p className="text-xs text-muted-foreground mt-1">
                  Cole aqui a URL do webhook obtida no painel do {form.provider}.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={async () => {
                  if (!form.webhook_url) return toast.error("URL obrigatória");
                  await create.mutateAsync(form);
                  setOpen(false); setForm({ provider: "slack", name: "", webhook_url: "", channel: "" });
                }}>Conectar</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {list.data?.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{c.provider}</Badge>
                  <span className="font-medium">{c.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Eventos: {c.events.join(", ")}
                </p>
                {c.last_sent_at && <p className="text-xs text-muted-foreground">
                  Último envio: {new Date(c.last_sent_at).toLocaleString("pt-BR")}
                </p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => testSend.mutate(c.id)}>
                  <Send className="h-4 w-4 mr-1" />Testar
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {list.data?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum canal conectado.</p>}
      </div>
    </div>
  );
}

function MobileTab() {
  const { subscribe } = usePushSubscription();
  const [installable, setInstallable] = useState<{ prompt: () => void } | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallable(e as unknown as { prompt: () => void });
    };
    window.addEventListener("beforeinstallprompt", handler);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Smartphone className="h-5 w-5" />Instalar como app</CardTitle>
          <CardDescription>
            O Oxy funciona como app instalável no seu celular ou desktop, com cache offline básico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {installed ? (
            <Badge>App instalado neste dispositivo ✓</Badge>
          ) : installable ? (
            <Button onClick={() => installable.prompt()}>Instalar Oxy</Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              No iPhone: Compartilhar → "Adicionar à Tela Inicial". No Android/Chrome: menu → "Instalar app".
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-5 w-5" />Notificações push</CardTitle>
          <CardDescription>
            Receba notificações importantes mesmo quando o Oxy não estiver aberto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={async () => {
            const perm = await Notification.requestPermission();
            if (perm === "granted") subscribe.mutate();
            else toast.error("Permissão de notificação negada");
          }}>
            Ativar notificações neste dispositivo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DeveloperHubPage() {
  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Code2 className="h-6 w-6" />
          Developer Hub
        </h1>
        <p className="text-sm text-muted-foreground">
          API pública, webhooks, integrações de chat e app mobile.
        </p>
      </div>

      <Tabs defaultValue="api">
        <TabsList>
          <TabsTrigger value="api"><Code2 className="h-4 w-4 mr-1" />API</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="h-4 w-4 mr-1" />Webhooks</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="h-4 w-4 mr-1" />Chat</TabsTrigger>
          <TabsTrigger value="mobile"><Smartphone className="h-4 w-4 mr-1" />Mobile</TabsTrigger>
        </TabsList>
        <TabsContent value="api" className="mt-4"><ApiTokensTab /></TabsContent>
        <TabsContent value="webhooks" className="mt-4"><WebhooksTab /></TabsContent>
        <TabsContent value="chat" className="mt-4"><ChatTab /></TabsContent>
        <TabsContent value="mobile" className="mt-4"><MobileTab /></TabsContent>
      </Tabs>
    </div>
  );
}