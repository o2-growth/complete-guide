import { useMemo, useState } from "react";
import { Megaphone, Plus, Trash2, Calendar as CalendarIcon, Loader2, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCampaigns, useCreateCampaign, useDeleteCampaign, useSocialPosts, type SocialChannel, type SocialCampaign } from "@/hooks/useSocialMedia";

const CHANNEL_OPTIONS: SocialChannel[] = ["instagram", "linkedin", "tiktok", "facebook", "youtube", "twitter", "email"];

export default function CampaignsPage() {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { data: allPosts = [] } = useSocialPosts();
  const create = useCreateCampaign();
  const del = useDeleteCampaign();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; description: string; objective: string; channels: SocialChannel[]; start: string; end: string; color: string }>({
    name: "", description: "", objective: "", channels: ["instagram"], start: "", end: "", color: "#0EA5E9",
  });

  const kpiByCampaign = useMemo(() => {
    const map = new Map<string, { total: number; published: number; scheduled: number }>();
    for (const p of allPosts) {
      if (!p.campaign_id) continue;
      const k = map.get(p.campaign_id) ?? { total: 0, published: 0, scheduled: 0 };
      k.total++;
      if (p.publish_state === "published") k.published++;
      if (p.publish_state === "scheduled") k.scheduled++;
      map.set(p.campaign_id, k);
    }
    return map;
  }, [allPosts]);

  const submit = async () => {
    if (!form.name.trim()) return;
    await create.mutateAsync({
      name: form.name.trim(),
      description: form.description || null,
      objective: form.objective || null,
      channels: form.channels,
      color: form.color,
      start_date: form.start || null,
      end_date: form.end || null,
    });
    setOpen(false);
    setForm({ name: "", description: "", objective: "", channels: ["instagram"], start: "", end: "", color: "#0EA5E9" });
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Campanhas</h1>
          <p className="text-sm text-muted-foreground">Agrupe posts sob um briefing comum e acompanhe a entrega.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova campanha</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova campanha</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Black Friday 2026" />
              </div>
              <div>
                <Label>Objetivo</Label>
                <Input value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="Ex: gerar 200 leads qualificados" />
              </div>
              <div>
                <Label>Descrição / briefing</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Início</Label>
                  <Input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
                </div>
                <div>
                  <Label>Fim</Label>
                  <Input type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Canais</Label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {CHANNEL_OPTIONS.map((c) => {
                    const active = form.channels.includes(c);
                    return (
                      <Badge
                        key={c}
                        variant={active ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() =>
                          setForm({
                            ...form,
                            channels: active ? form.channels.filter((x) => x !== c) : [...form.channels, c],
                          })
                        }
                      >
                        {c}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Cor</Label>
                <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-20 p-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : campaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-20 text-sm text-muted-foreground">
          <Megaphone className="h-8 w-8" />
          Nenhuma campanha ainda — crie a primeira para agrupar seus posts.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((c) => <CampaignCard key={c.id} c={c} kpi={kpiByCampaign.get(c.id)} onDelete={() => del.mutate(c.id)} />)}
        </div>
      )}
    </div>
  );
}

function CampaignCard({ c, kpi, onDelete }: { c: SocialCampaign; kpi?: { total: number; published: number; scheduled: number }; onDelete: () => void }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ background: c.color ?? "#0EA5E9" }} />
          <h3 className="font-semibold leading-tight">{c.name}</h3>
        </div>
        <div className="flex gap-1">
          <Button asChild variant="ghost" size="icon" className="h-7 w-7" title="Relatório">
            <Link to={`/app/campanhas/${c.id}`}>
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
      {c.objective && <p className="text-xs text-muted-foreground">🎯 {c.objective}</p>}
      {c.description && <p className="line-clamp-2 text-xs text-muted-foreground">{c.description}</p>}
      <div className="flex flex-wrap gap-1">
        {(c.channels ?? []).map((ch) => (
          <Badge key={ch} variant="secondary" className="text-[10px] capitalize">{ch}</Badge>
        ))}
      </div>
      {(c.start_date || c.end_date) && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CalendarIcon className="h-3 w-3" />
          {c.start_date ? format(new Date(c.start_date), "dd/MM/yy", { locale: ptBR }) : "?"}
          {" → "}
          {c.end_date ? format(new Date(c.end_date), "dd/MM/yy", { locale: ptBR }) : "?"}
        </div>
      )}
      <div className="mt-auto flex gap-3 border-t pt-2 text-[11px]">
        <div><span className="font-bold">{kpi?.total ?? 0}</span> <span className="text-muted-foreground">posts</span></div>
        <div><span className="font-bold text-sky-600">{kpi?.scheduled ?? 0}</span> <span className="text-muted-foreground">agendados</span></div>
        <div><span className="font-bold text-violet-600">{kpi?.published ?? 0}</span> <span className="text-muted-foreground">publicados</span></div>
      </div>
    </Card>
  );
}