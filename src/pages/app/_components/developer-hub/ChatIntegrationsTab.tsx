import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useChatIntegrations } from "@/hooks/useDeveloperHub";
import { Trash2, Send, Plus } from "lucide-react";
import { toast } from "sonner";

export function ChatIntegrationsTab() {
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
