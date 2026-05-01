import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Building2, Mail, Trash2, Check } from "lucide-react";
import { useMyWorkspaces, useCreateWorkspace, useSwitchWorkspace, useInvitations, useSendInvite, useRevokeInvite } from "@/hooks/useWorkspaces";
import { useWorkspace } from "@/hooks/useWorkspace";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";

export default function WorkspacesPage() {
  const { tenantId } = useWorkspace();
  const { data: ws = [] } = useMyWorkspaces();
  const createWs = useCreateWorkspace();
  const switchWs = useSwitchWorkspace();
  const { data: invites = [] } = useInvitations(tenantId);
  const sendInvite = useSendInvite();
  const revoke = useRevokeInvite();

  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("specialist");

  return (
    <div className="space-y-6">
      <SEO title="Workspaces e convites" description="Gerencie seus workspaces, membros e convites." />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Workspaces
          </h1>
          <p className="text-sm text-muted-foreground">Crie novos workspaces, troque entre eles e convide pessoas.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Novo workspace</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Meus workspaces</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {ws.map((w) => (
            <div key={w.tenant_id} className="flex items-center gap-3 rounded-md border p-3">
              <div className="h-9 w-9 rounded-md flex items-center justify-center text-white font-semibold" style={{ background: w.tenant.primary_color || "#0ea5e9" }}>
                {w.tenant.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {w.tenant.name}
                  {w.tenant_id === tenantId && <Badge variant="secondary"><Check className="h-3 w-3 mr-1" /> ativo</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{w.tenant.slug} · {w.role}</div>
              </div>
              {w.tenant_id !== tenantId && (
                <Button variant="outline" size="sm" onClick={() => switchWs.mutate(w.tenant_id)}>Entrar</Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Convites pendentes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Input placeholder="email@exemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="flex-1 min-w-[200px]" />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="specialist">Specialist</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={async () => {
              if (!inviteEmail || !tenantId) return;
              await sendInvite.mutateAsync({ tenantId, email: inviteEmail, role: inviteRole });
              setInviteEmail("");
            }}>Convidar</Button>
          </div>
          <div className="space-y-1.5">
            {invites.map((i) => (
              <div key={i.id} className="flex items-center gap-2 text-sm border rounded p-2">
                <span className="flex-1 truncate">{i.email}</span>
                <Badge variant="outline" className="text-[10px]">{i.role}</Badge>
                <Badge variant={i.status === "pending" ? "default" : i.status === "accepted" ? "secondary" : "outline"} className="text-[10px]">{i.status}</Badge>
                <Button variant="ghost" size="sm" onClick={() => {
                  const url = `${window.location.origin}/aceitar-convite/${i.token}`;
                  navigator.clipboard.writeText(url);
                  toast.success("Link copiado");
                }}>Copiar link</Button>
                {i.status === "pending" && (
                  <Button variant="ghost" size="icon" onClick={() => revoke.mutate(i.id)}><Trash2 className="h-3 w-3" /></Button>
                )}
              </div>
            ))}
            {invites.length === 0 && <p className="text-xs text-muted-foreground">Nenhum convite.</p>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo workspace</DialogTitle></DialogHeader>
          <Input placeholder="Nome do workspace" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={async () => { if (!newName) return; await createWs.mutateAsync(newName); setShowCreate(false); }}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
