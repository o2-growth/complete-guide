import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useWebhooks } from "@/hooks/useDeveloperHub";
import { Copy, Trash2, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";

const EVENT_OPTS = ["task.created", "task.completed", "anomaly.created", "task.overdue"];

function copy(s: string) {
  navigator.clipboard.writeText(s);
  toast.success("Copiado");
}

export function WebhooksTab() {
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
