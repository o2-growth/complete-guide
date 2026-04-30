import { useState } from "react";
import { useCreators, useUpsertCreator, useUgcAssets, useUpsertUgc, useRepostUgc, type Creator, type UgcAsset } from "@/hooks/useGrowthOps";
import { useProjects } from "@/hooks/useProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Users, Plus, Repeat, ShieldCheck, ShieldAlert } from "lucide-react";

export default function CreatorsPage() {
  const creators = useCreators();
  const ugc = useUgcAssets();
  const projects = useProjects();
  const upsertCreator = useUpsertCreator();
  const upsertUgc = useUpsertUgc();
  const repost = useRepostUgc();

  const [editing, setEditing] = useState<Partial<Creator> | null>(null);
  const [editingUgc, setEditingUgc] = useState<Partial<UgcAsset> | null>(null);
  const [openCreator, setOpenCreator] = useState(false);
  const [openUgc, setOpenUgc] = useState(false);

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="h-7 w-7" /> Creators & UGC</h1>
          <p className="text-muted-foreground mt-1">Cadastro de influenciadores, contratos com direitos de uso e biblioteca de conteúdo gerado por usuários.</p>
        </div>
      </header>

      <Tabs defaultValue="creators" className="space-y-4">
        <TabsList>
          <TabsTrigger value="creators">Creators ({creators.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="ugc">Biblioteca UGC ({ugc.data?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="creators" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openCreator} onOpenChange={setOpenCreator}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditing({})}><Plus className="h-4 w-4 mr-2" /> Novo creator</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Novo"} creator</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nome</Label><Input value={editing?.full_name ?? ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Handle</Label><Input value={editing?.handle ?? ""} onChange={(e) => setEditing({ ...editing, handle: e.target.value })} placeholder="@usuario" /></div>
                    <div><Label>Nicho</Label><Input value={editing?.niche ?? ""} onChange={(e) => setEditing({ ...editing, niche: e.target.value })} placeholder="moda, lifestyle…" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>E-mail</Label><Input type="email" value={editing?.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
                    <div><Label>Telefone</Label><Input value={editing?.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Seguidores</Label><Input type="number" value={editing?.followers_count ?? 0} onChange={(e) => setEditing({ ...editing, followers_count: Number(e.target.value) })} /></div>
                    <div><Label>Engajamento (%)</Label><Input type="number" step="0.01" value={editing?.engagement_rate ?? 0} onChange={(e) => setEditing({ ...editing, engagement_rate: Number(e.target.value) })} /></div>
                  </div>
                  <div><Label>Notas</Label><Textarea value={editing?.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={3} /></div>
                  <Button className="w-full" onClick={async () => {
                    if (!editing) return;
                    await upsertCreator.mutateAsync(editing);
                    setOpenCreator(false); setEditing(null);
                  }}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creators.data?.map((c) => (
              <Card key={c.id} className="cursor-pointer hover:bg-accent/30" onClick={() => { setEditing(c); setOpenCreator(true); }}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {c.full_name}
                    <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge>
                  </CardTitle>
                  {c.handle && <p className="text-xs text-muted-foreground">{c.handle}</p>}
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  {c.niche && <p className="text-muted-foreground">{c.niche}</p>}
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{(c.followers_count ?? 0).toLocaleString()} seguidores</span>
                    <span>{c.engagement_rate}% engajamento</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {creators.data?.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-8">Nenhum creator cadastrado ainda.</p>}
          </div>
        </TabsContent>

        <TabsContent value="ugc" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openUgc} onOpenChange={setOpenUgc}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingUgc({})}><Plus className="h-4 w-4 mr-2" /> Novo UGC</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingUgc?.id ? "Editar" : "Adicionar"} UGC</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Creator</Label>
                    <Select value={editingUgc?.creator_id ?? "none"} onValueChange={(v) => setEditingUgc({ ...editingUgc, creator_id: v === "none" ? null : v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Sem creator —</SelectItem>
                        {creators.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>URL de origem</Label><Input value={editingUgc?.source_url ?? ""} onChange={(e) => setEditingUgc({ ...editingUgc, source_url: e.target.value })} placeholder="https://instagram.com/p/…" /></div>
                  <div><Label>Legenda original</Label><Textarea value={editingUgc?.caption ?? ""} onChange={(e) => setEditingUgc({ ...editingUgc, caption: e.target.value })} rows={3} /></div>
                  <div className="flex items-center justify-between rounded border p-3">
                    <div>
                      <Label>Direitos de uso confirmados</Label>
                      <p className="text-xs text-muted-foreground">Marque apenas se houver autorização escrita do creator.</p>
                    </div>
                    <Switch checked={editingUgc?.rights_ok ?? false} onCheckedChange={(v) => setEditingUgc({ ...editingUgc, rights_ok: v })} />
                  </div>
                  {editingUgc?.rights_ok && (
                    <div><Label>Direitos válidos até</Label><Input type="date" value={editingUgc?.rights_until ?? ""} onChange={(e) => setEditingUgc({ ...editingUgc, rights_until: e.target.value })} /></div>
                  )}
                  <Button className="w-full" onClick={async () => {
                    if (!editingUgc) return;
                    await upsertUgc.mutateAsync(editingUgc);
                    setOpenUgc(false); setEditingUgc(null);
                  }}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ugc.data?.map((u) => (
              <Card key={u.id}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {u.rights_ok ? <ShieldCheck className="h-4 w-4 text-green-500" /> : <ShieldAlert className="h-4 w-4 text-yellow-500" />}
                    <Badge variant={u.status === "approved" ? "default" : u.status === "reposted" ? "secondary" : "outline"}>{u.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {u.caption && <p className="line-clamp-3 text-muted-foreground">{u.caption}</p>}
                  {u.source_url && <a href={u.source_url} target="_blank" rel="noreferrer" className="text-primary underline truncate block">{u.source_url}</a>}
                  <div className="flex gap-2 pt-2">
                    {u.status !== "reposted" && u.rights_ok && projects.data?.[0] && (
                      <Button size="sm" variant="outline" onClick={() => repost.mutate({ ugc_id: u.id, project_id: projects.data![0].id, channel: "instagram" })}>
                        <Repeat className="h-3 w-3 mr-1" /> Repostar
                      </Button>
                    )}
                    {u.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => upsertUgc.mutate({ id: u.id, status: "approved" })}>Aprovar</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {ugc.data?.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-8">Nenhum UGC capturado ainda.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}