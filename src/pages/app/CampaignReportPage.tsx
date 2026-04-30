import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Download, RefreshCw, TrendingUp, Users, Eye, Heart, MessageCircle, Share2, Bookmark, MousePointerClick, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCampaigns, useSocialPosts } from "@/hooks/useSocialMedia";
import { useCampaignReport, collectMetricsNow } from "@/hooks/useSocialOps";
import { useQueryClient } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CampaignReportPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: campaigns = [] } = useCampaigns();
  const campaign = campaigns.find((c) => c.id === id);
  const { data: posts = [] } = useSocialPosts({ campaignId: id ?? null });
  const { data: report, isLoading, refetch } = useCampaignReport(id ?? null);

  const totals = report?.totals ?? { posts: 0, reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, followers_gained: 0 };
  const engagement = totals.reach > 0 ? ((totals.likes + totals.comments + totals.shares + totals.saves) / totals.reach) * 100 : 0;

  // série temporal por dia (post.published_at -> métricas agregadas)
  const timeSeries = useMemo(() => {
    const map = new Map<string, { date: string; reach: number; engagement: number }>();
    for (const p of posts) {
      if (!p.published_at) continue;
      const k = format(new Date(p.published_at), "yyyy-MM-dd");
      const cur = map.get(k) ?? { date: k, reach: 0, engagement: 0 };
      // aproximação: distribuir totais por nº posts; dados reais virão das métricas por post
      cur.reach += Math.round(totals.reach / Math.max(1, totals.posts));
      cur.engagement += Math.round((totals.likes + totals.comments) / Math.max(1, totals.posts));
      map.set(k, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [posts, totals]);

  const handleRefresh = async () => {
    if (!id) return;
    try {
      const r = await collectMetricsNow({ campaignId: id });
      toast.success(`${r.updated} post(s) atualizado(s)`);
      qc.invalidateQueries({ queryKey: ["campaign_report", id] });
      refetch();
    } catch (e) { toast.error(e instanceof Error ? e.message : "falha"); }
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (!campaign) {
    return (
      <div className="p-6">
        <Button asChild variant="ghost" size="sm"><Link to="/app/campanhas"><ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar</Link></Button>
        <p className="mt-4 text-sm text-muted-foreground">Campanha não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 print:p-0">
      <header className="flex flex-wrap items-center gap-3 print:hidden">
        <Button asChild variant="ghost" size="icon"><Link to="/app/campanhas"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: (campaign.color ?? "#0EA5E9") + "22", color: campaign.color ?? "#0EA5E9" }}>
          <BarChart3 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">{campaign.objective ?? "Relatório de campanha"}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}><RefreshCw className="mr-1.5 h-4 w-4" /> Coletar métricas</Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF}><Download className="mr-1.5 h-4 w-4" /> Exportar PDF</Button>
      </header>

      <div className="hidden print:block">
        <h1 className="text-3xl font-bold">{campaign.name}</h1>
        <p className="text-sm text-muted-foreground">Relatório gerado em {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <KPI Icon={Eye} label="Alcance" value={totals.reach} />
            <KPI Icon={Users} label="Impressões" value={totals.impressions} />
            <KPI Icon={Heart} label="Curtidas" value={totals.likes} accent="rose" />
            <KPI Icon={MessageCircle} label="Comentários" value={totals.comments} />
            <KPI Icon={Share2} label="Compart." value={totals.shares} />
            <KPI Icon={Bookmark} label="Salvamentos" value={totals.saves} />
            <KPI Icon={MousePointerClick} label="Cliques" value={totals.clicks} />
            <KPI Icon={UserPlus} label="Seguidores+" value={totals.followers_gained} accent="emerald" />
            <KPI Icon={TrendingUp} label="Engajamento" value={`${engagement.toFixed(2)}%`} accent="primary" />
            <KPI Icon={BarChart3} label="Posts" value={totals.posts} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Por canal</h3>
              {(report?.by_channel ?? []).length === 0 ? (
                <p className="py-12 text-center text-xs text-muted-foreground">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={report?.by_channel ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="reach" fill="hsl(var(--primary))" name="Alcance" />
                    <Bar dataKey="likes" fill="#f43f5e" name="Curtidas" />
                    <Bar dataKey="comments" fill="#0ea5e9" name="Comentários" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Evolução temporal</h3>
              {timeSeries.length === 0 ? (
                <p className="py-12 text-center text-xs text-muted-foreground">Sem posts publicados</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="reach" stroke="hsl(var(--primary))" name="Alcance" />
                    <Line type="monotone" dataKey="engagement" stroke="#f43f5e" name="Engajamento" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Top posts</h3>
            {(report?.top_posts ?? []).length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Nenhum post com métricas ainda. Clique em "Coletar métricas".</p>
            ) : (
              <div className="space-y-1.5">
                {(report?.top_posts ?? []).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 border-b py-2 text-xs last:border-0">
                    <span className="w-6 text-muted-foreground">{i + 1}.</span>
                    <span className="flex-1 truncate font-medium">{p.title}</span>
                    <Badge variant="outline" className="capitalize">{p.channel}</Badge>
                    <span><Eye className="inline h-3 w-3" /> {p.reach}</span>
                    <span><Heart className="inline h-3 w-3" /> {p.likes}</span>
                    <span><MessageCircle className="inline h-3 w-3" /> {p.comments}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function KPI({ Icon, label, value, accent }: { Icon: typeof BarChart3; label: string; value: number | string; accent?: "primary" | "rose" | "emerald" }) {
  const tone = accent === "primary" ? "text-primary"
             : accent === "rose" ? "text-rose-600 dark:text-rose-400"
             : accent === "emerald" ? "text-emerald-600 dark:text-emerald-400"
             : "text-foreground";
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className={`mt-1 text-xl font-bold tabular-nums ${tone}`}>{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</p>
    </Card>
  );
}