import { useState } from "react";
import { useBoosts, useUpsertBoost, useBoostRecommendations, type AdBoost } from "@/hooks/useGrowthOps";
import { useCampaigns } from "@/hooks/useSocialMedia";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, Plus, Sparkles, TrendingUp } from "lucide-react";

const fmtBRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function BoostsPage() {
  const boosts = useBoosts();
  const upsert = useUpsertBoost();
  const recommendations = useBoostRecommendations();
  const campaigns = useCampaigns();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AdBoost> | null>(null);

  const totalSpent = boosts.data?.reduce((s, b) => s + (b.spent_cents ?? 0), 0) ?? 0;
  const totalRevenue = boosts.data?.reduce((s, b) => s + (b.revenue_cents ?? 0), 0) ?? 0;
  const totalBudget = boosts.data?.reduce((s, b) => s + (b.budget_cents ?? 0), 0) ?? 0;
  const roas = totalSpent > 0 ? (totalRevenue / totalSpent).toFixed(2) : "—";

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Rocket className="h-7 w-7" /> Boost Manager</h1>
          <p className="text-muted-foreground mt-1">Gerencie impulsionamentos de posts, controle budget e acompanhe ROAS por campanha.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({})}><Plus className="h-4 w-4 mr-2" /> Novo boost</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Novo"} boost</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Campanha</Label>
                <Select value={editing?.campaign_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, campaign_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Avulso —</SelectItem>
                    {campaigns.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Canal</Label>
                  <Select value={editing?.channel ?? "instagram"} onValueChange={(v) => setEditing({ ...editing, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Objetivo</Label>
                  <Select value={editing?.objective ?? "reach"} onValueChange={(v) => setEditing({ ...editing, objective: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reach">Alcance</SelectItem>
                      <SelectItem value="engagement">Engajamento</SelectItem>
                      <SelectItem value="traffic">Tráfego</SelectItem>
                      <SelectItem value="conversions">Conversões</SelectItem>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="video_views">Views de vídeo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Budget (R$)</Label><Input type="number" step="0.01" value={(editing?.budget_cents ?? 0) / 100} onChange={(e) => setEditing({ ...editing, budget_cents: Math.round(Number(e.target.value) * 100) })} /></div>
                <div><Label>Gasto (R$)</Label><Input type="number" step="0.01" value={(editing?.spent_cents ?? 0) / 100} onChange={(e) => setEditing({ ...editing, spent_cents: Math.round(Number(e.target.value) * 100) })} /></div>
                <div><Label>Receita (R$)</Label><Input type="number" step="0.01" value={(editing?.revenue_cents ?? 0) / 100} onChange={(e) => setEditing({ ...editing, revenue_cents: Math.round(Number(e.target.value) * 100) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Início</Label><Input type="date" value={editing?.starts_at?.slice(0, 10) ?? ""} onChange={(e) => setEditing({ ...editing, starts_at: new Date(e.target.value).toISOString() })} /></div>
                <div><Label>Fim</Label><Input type="date" value={editing?.ends_at?.slice(0, 10) ?? ""} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
              </div>
              <div><Label>Status</Label>
                <Select value={editing?.status ?? "planned"} onValueChange={(v) => setEditing({ ...editing, status: v as AdBoost["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planejado</SelectItem>
                    <SelectItem value="running">Rodando</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={async () => {
                if (!editing) return;
                await upsert.mutateAsync(editing);
                setOpen(false); setEditing(null);
              }}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-xs text-muted-foreground">Budget total</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{fmtBRL(totalBudget)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-xs text-muted-foreground">Gasto</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{fmtBRL(totalSpent)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-xs text-muted-foreground">Receita atribuída</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{fmtBRL(totalRevenue)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-xs text-muted-foreground">ROAS</CardTitle></CardHeader><CardContent className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" />{roas}</CardContent></Card>
      </div>

      {recommendations.data && recommendations.data.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Sugestões de boost</CardTitle>
            <p className="text-xs text-muted-foreground">Posts orgânicos com alto engajamento e ainda sem boost ativo.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.data.map((r) => (
              <div key={r.task_id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.channel} · {r.reach.toLocaleString()} reach · {r.engagement.toLocaleString()} engajamentos</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setEditing({ task_id: r.task_id, channel: r.channel }); setOpen(true); }}>Boostar</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Boosts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {boosts.data?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum boost criado ainda.</p>}
          {boosts.data?.map((b) => {
            const r = b.spent_cents > 0 ? (b.revenue_cents / b.spent_cents).toFixed(2) : "—";
            const pct = b.budget_cents > 0 ? Math.min(100, Math.round((b.spent_cents / b.budget_cents) * 100)) : 0;
            return (
              <div key={b.id} className="rounded border p-3 cursor-pointer hover:bg-accent/30" onClick={() => { setEditing(b); setOpen(true); }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge>{b.channel}</Badge>
                    <Badge variant="outline">{b.objective}</Badge>
                    <Badge variant={b.status === "running" ? "default" : "secondary"}>{b.status}</Badge>
                  </div>
                  <div className="text-sm font-semibold">ROAS {r}</div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{fmtBRL(b.spent_cents)} de {fmtBRL(b.budget_cents)}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span>Receita: {fmtBRL(b.revenue_cents)}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}