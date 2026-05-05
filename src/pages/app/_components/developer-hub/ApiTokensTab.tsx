import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useApiTokens } from "@/hooks/useDeveloperHub";
import { Copy, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const API_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1/api-public`;

function copy(s: string) {
  navigator.clipboard.writeText(s);
  toast.success("Copiado");
}

export function ApiTokensTab() {
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
