import { useState } from "react";
import { FileText, Hash, Plus, Trash2, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCaptionSnippets, useSaveSnippet, useDeleteSnippet, useHashtagGroups, useSaveHashtagGroup, useDeleteHashtagGroup } from "@/hooks/useSocialContent";
import type { SocialChannel } from "@/hooks/useSocialMedia";
import { toast } from "sonner";

const CHANNELS: Array<{ value: SocialChannel | "any"; label: string }> = [
  { value: "any", label: "Qualquer canal" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter" },
  { value: "email", label: "E-mail" },
  { value: "other", label: "Outro" },
];

export default function SnippetsPage() {
  const { data: snippets = [] } = useCaptionSnippets();
  const { data: groups = [] } = useHashtagGroups();
  const saveSnippet = useSaveSnippet();
  const delSnippet = useDeleteSnippet();
  const saveGroup = useSaveHashtagGroup();
  const delGroup = useDeleteHashtagGroup();

  const [snippetForm, setSnippetForm] = useState<{ open: boolean; id?: string; name: string; body: string; channel: SocialChannel | "any" }>({ open: false, name: "", body: "", channel: "any" });
  const [groupForm, setGroupForm] = useState<{ open: boolean; id?: string; name: string; tags: string; channel: SocialChannel | "any" }>({ open: false, name: "", tags: "", channel: "any" });

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conteúdo reutilizável</h1>
          <p className="text-sm text-muted-foreground">Legendas e grupos de hashtags para reaproveitar nos posts.</p>
        </div>
      </header>

      <Tabs defaultValue="snippets">
        <TabsList>
          <TabsTrigger value="snippets"><FileText className="mr-2 h-4 w-4" />Legendas ({snippets.length})</TabsTrigger>
          <TabsTrigger value="hashtags"><Hash className="mr-2 h-4 w-4" />Hashtags ({groups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="snippets" className="mt-4 space-y-3">
          <Button onClick={() => setSnippetForm({ open: true, name: "", body: "", channel: "any" })}>
            <Plus className="mr-2 h-4 w-4" /> Nova legenda
          </Button>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {snippets.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    <div className="mt-1 flex gap-1">
                      {s.channel && <Badge variant="outline" className="text-[10px]">{s.channel}</Badge>}
                      <Badge variant="secondary" className="text-[10px]">{s.usage_count} usos</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSnippetForm({ open: true, id: s.id, name: s.name, body: s.body, channel: (s.channel ?? "any") as SocialChannel | "any" })}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => delSnippet.mutate(s.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">{s.body}</p>
              </Card>
            ))}
            {snippets.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nenhuma legenda salva.</p>}
          </div>
        </TabsContent>

        <TabsContent value="hashtags" className="mt-4 space-y-3">
          <Button onClick={() => setGroupForm({ open: true, name: "", tags: "", channel: "any" })}>
            <Plus className="mr-2 h-4 w-4" /> Novo grupo
          </Button>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <Card key={g.id} className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{g.name}</h3>
                    <div className="mt-1 flex gap-1">
                      {g.channel && <Badge variant="outline" className="text-[10px]">{g.channel}</Badge>}
                      <Badge variant="secondary" className="text-[10px]">{g.hashtags.length} tags</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setGroupForm({ open: true, id: g.id, name: g.name, tags: g.hashtags.join(" "), channel: (g.channel ?? "any") as SocialChannel | "any" })}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => delGroup.mutate(g.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{g.hashtags.map((t) => `#${t}`).join(" ")}</p>
              </Card>
            ))}
            {groups.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nenhum grupo de hashtags.</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal snippet */}
      <Dialog open={snippetForm.open} onOpenChange={(o) => setSnippetForm({ ...snippetForm, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{snippetForm.id ? "Editar" : "Nova"} legenda</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" value={snippetForm.name} onChange={(e) => setSnippetForm({ ...snippetForm, name: e.target.value })} />
            <Select value={snippetForm.channel} onValueChange={(v) => setSnippetForm({ ...snippetForm, channel: v as SocialChannel | "any" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CHANNELS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea rows={6} placeholder="Conteúdo da legenda..." value={snippetForm.body} onChange={(e) => setSnippetForm({ ...snippetForm, body: e.target.value })} />
            <Button onClick={async () => {
              if (!snippetForm.name || !snippetForm.body) return toast.error("Preencha nome e conteúdo");
              await saveSnippet.mutateAsync({
                id: snippetForm.id,
                name: snippetForm.name,
                body: snippetForm.body,
                channel: snippetForm.channel === "any" ? null : snippetForm.channel,
              });
              setSnippetForm({ ...snippetForm, open: false });
            }} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal grupo hashtags */}
      <Dialog open={groupForm.open} onOpenChange={(o) => setGroupForm({ ...groupForm, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{groupForm.id ? "Editar" : "Novo"} grupo de hashtags</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} />
            <Select value={groupForm.channel} onValueChange={(v) => setGroupForm({ ...groupForm, channel: v as SocialChannel | "any" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CHANNELS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea rows={4} placeholder="Hashtags separadas por espaço ou vírgula" value={groupForm.tags} onChange={(e) => setGroupForm({ ...groupForm, tags: e.target.value })} />
            <Button onClick={async () => {
              const list = groupForm.tags.split(/[\s,]+/).map((t) => t.replace(/^#+/, "")).filter(Boolean);
              if (!groupForm.name || list.length === 0) return toast.error("Nome e hashtags obrigatórios");
              await saveGroup.mutateAsync({
                id: groupForm.id,
                name: groupForm.name,
                hashtags: list,
                channel: groupForm.channel === "any" ? null : groupForm.channel,
              });
              setGroupForm({ ...groupForm, open: false });
            }} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
