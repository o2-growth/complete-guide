import { useEffect, useState } from "react";
import { useBioPages, useBioLinks, useUpsertBioPage, useUpsertBioLink, useDeleteBioLink, buildUtmUrl, type BioPage, type BioLink } from "@/hooks/useGrowthOps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, Plus, Trash2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function BioEditorPage() {
  const pages = useBioPages();
  const upsertPage = useUpsertBioPage();
  const upsertLink = useUpsertBioLink();
  const removeLink = useDeleteBioLink();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const links = useBioLinks(selectedId);

  const [openPage, setOpenPage] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<BioPage> | null>(null);

  const [openLink, setOpenLink] = useState(false);
  const [editingLink, setEditingLink] = useState<Partial<BioLink> | null>(null);

  const [utmBase, setUtmBase] = useState("https://exemplo.com/promo");
  const [utm, setUtm] = useState({ source: "instagram", medium: "social", campaign: "lancamento", content: "" });

  useEffect(() => {
    if (!selectedId && pages.data?.[0]) setSelectedId(pages.data[0].id);
  }, [pages.data, selectedId]);

  const selectedPage = pages.data?.find((p) => p.id === selectedId);
  const publicUrl = selectedPage ? `${window.location.origin}/bio/${selectedPage.slug}` : "";

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Link2 className="h-7 w-7" /> Link-in-bio & UTMs</h1>
          <p className="text-muted-foreground mt-1">Mini-site de bio com tracking de cliques e gerador padronizado de UTMs.</p>
        </div>
        <Dialog open={openPage} onOpenChange={setOpenPage}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPage({ theme: { bg: "#0F172A", fg: "#FFFFFF", accent: "#0EA5E9", button_style: "rounded" } })}>
              <Plus className="h-4 w-4 mr-2" /> Nova página
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingPage?.id ? "Editar" : "Nova"} página de bio</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Slug (URL)</Label><Input value={editingPage?.slug ?? ""} onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="minha-marca" /></div>
              <div><Label>Título</Label><Input value={editingPage?.title ?? ""} onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={editingPage?.bio ?? ""} onChange={(e) => setEditingPage({ ...editingPage, bio: e.target.value })} rows={2} /></div>
              <div><Label>Avatar URL</Label><Input value={editingPage?.avatar_url ?? ""} onChange={(e) => setEditingPage({ ...editingPage, avatar_url: e.target.value })} placeholder="https://…" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>BG</Label><Input type="color" value={editingPage?.theme?.bg ?? "#0F172A"} onChange={(e) => setEditingPage({ ...editingPage, theme: { ...(editingPage?.theme ?? {} as BioPage["theme"]), bg: e.target.value } })} /></div>
                <div><Label>FG</Label><Input type="color" value={editingPage?.theme?.fg ?? "#FFFFFF"} onChange={(e) => setEditingPage({ ...editingPage, theme: { ...(editingPage?.theme ?? {} as BioPage["theme"]), fg: e.target.value } })} /></div>
                <div><Label>Accent</Label><Input type="color" value={editingPage?.theme?.accent ?? "#0EA5E9"} onChange={(e) => setEditingPage({ ...editingPage, theme: { ...(editingPage?.theme ?? {} as BioPage["theme"]), accent: e.target.value } })} /></div>
              </div>
              <Button className="w-full" onClick={async () => {
                if (!editingPage) return;
                const id = await upsertPage.mutateAsync(editingPage);
                if (id) setSelectedId(id);
                setOpenPage(false); setEditingPage(null);
              }}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">Páginas</TabsTrigger>
          <TabsTrigger value="utm">Gerador de UTM</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="space-y-2">
            {pages.data?.map((p) => (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className={`w-full text-left rounded border p-3 hover:bg-accent/30 ${selectedId === p.id ? "border-primary bg-accent/30" : ""}`}>
                <div className="font-medium text-sm">{p.title}</div>
                <div className="text-xs text-muted-foreground">/bio/{p.slug}</div>
                <div className="flex gap-1 mt-1">
                  <Badge variant={p.active ? "default" : "secondary"} className="text-[10px]">{p.active ? "ativa" : "inativa"}</Badge>
                  <Badge variant="outline" className="text-[10px]">{p.views} views</Badge>
                </div>
              </button>
            ))}
            {pages.data?.length === 0 && <p className="text-sm text-muted-foreground">Crie sua primeira página de bio.</p>}
          </div>

          {selectedPage ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span>{selectedPage.title}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("URL copiada"); }}>
                        <Copy className="h-3 w-3 mr-1" /> Copiar URL
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> Abrir</a>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingPage(selectedPage); setOpenPage(true); }}>Editar</Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">{publicUrl}</CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Links ({links.data?.length ?? 0})</CardTitle>
                  <Dialog open={openLink} onOpenChange={setOpenLink}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => setEditingLink({ position: (links.data?.length ?? 0) })}><Plus className="h-3 w-3 mr-1" /> Link</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{editingLink?.id ? "Editar" : "Novo"} link</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div><Label>Rótulo</Label><Input value={editingLink?.label ?? ""} onChange={(e) => setEditingLink({ ...editingLink, label: e.target.value })} /></div>
                        <div><Label>URL de destino</Label><Input value={editingLink?.url ?? ""} onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })} placeholder="https://…" /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>UTM source</Label><Input value={editingLink?.utm_source ?? ""} onChange={(e) => setEditingLink({ ...editingLink, utm_source: e.target.value })} placeholder="instagram" /></div>
                          <div><Label>UTM medium</Label><Input value={editingLink?.utm_medium ?? ""} onChange={(e) => setEditingLink({ ...editingLink, utm_medium: e.target.value })} placeholder="bio" /></div>
                          <div><Label>UTM campaign</Label><Input value={editingLink?.utm_campaign ?? ""} onChange={(e) => setEditingLink({ ...editingLink, utm_campaign: e.target.value })} /></div>
                          <div><Label>UTM content</Label><Input value={editingLink?.utm_content ?? ""} onChange={(e) => setEditingLink({ ...editingLink, utm_content: e.target.value })} /></div>
                        </div>
                        <Button className="w-full" onClick={async () => {
                          if (!editingLink || !selectedId) return;
                          await upsertLink.mutateAsync({ ...editingLink, page_id: selectedId });
                          setOpenLink(false); setEditingLink(null);
                        }}>Salvar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-2">
                  {links.data?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum link nesta página.</p>}
                  {links.data?.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 rounded border p-3 hover:bg-accent/30">
                      <div className="flex-1 cursor-pointer" onClick={() => { setEditingLink(l); setOpenLink(true); }}>
                        <div className="font-medium text-sm">{l.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{l.url}</div>
                        {(l.utm_source || l.utm_campaign) && (
                          <div className="text-[10px] text-muted-foreground mt-1">utm: {[l.utm_source, l.utm_medium, l.utm_campaign].filter(Boolean).join(" / ")}</div>
                        )}
                      </div>
                      <Badge variant="outline">{l.clicks} clicks</Badge>
                      <Button size="icon" variant="ghost" onClick={() => removeLink.mutate(l.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="rounded border border-dashed p-12 text-center text-muted-foreground">Selecione ou crie uma página.</div>
          )}
        </TabsContent>

        <TabsContent value="utm">
          <Card>
            <CardHeader><CardTitle className="text-base">Gerador de UTM</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>URL base</Label><Input value={utmBase} onChange={(e) => setUtmBase(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Source</Label><Input value={utm.source} onChange={(e) => setUtm({ ...utm, source: e.target.value })} /></div>
                <div><Label>Medium</Label><Input value={utm.medium} onChange={(e) => setUtm({ ...utm, medium: e.target.value })} /></div>
                <div><Label>Campaign</Label><Input value={utm.campaign} onChange={(e) => setUtm({ ...utm, campaign: e.target.value })} /></div>
                <div><Label>Content</Label><Input value={utm.content} onChange={(e) => setUtm({ ...utm, content: e.target.value })} /></div>
              </div>
              <div className="rounded border bg-muted p-3 text-xs break-all font-mono">{buildUtmUrl(utmBase, utm)}</div>
              <Button onClick={() => { navigator.clipboard.writeText(buildUtmUrl(utmBase, utm)); toast.success("URL copiada"); }}><Copy className="h-3 w-3 mr-2" /> Copiar URL</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}