import { useMemo, useState } from "react";
import { BarChart3, Eye, Heart, MessageCircle, Bookmark, Share2, MousePointerClick, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";
import { useCampaigns, type SocialChannel } from "@/hooks/useSocialMedia";
import { usePostMetrics } from "@/hooks/useSocialContent";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const CHANNEL_COLOR: Record<SocialChannel, string> = {
  instagram: "#ec4899", linkedin: "#0ea5e9", tiktok: "#a3a3a3", facebook: "#3b82f6",
  youtube: "#ef4444", twitter: "#38bdf8", email: "#8b5cf6", other: "#94a3b8",
};

export default function SocialAnalyticsPage() {
  const { data: campaigns = [] } = useCampaigns();
  const [period, setPeriod] = useState("30");
  const [campaignId, setCampaignId] = useState<string | "all">("all");
  const [channel, setChannel] = useState<SocialChannel | "all">("all");

  const from = useMemo(() => subDays(new Date(), parseInt(period)).toISOString(), [period]);

  const { data: metrics = [] } = usePostMetrics({
    from,
    campaignId: campaignId === "all" ? null : campaignId,
    channel: channel === "all" ? null : channel,
  });

  const totals = useMemo(() => {
    return metrics.reduce(
      (acc, m) => ({
        reach: acc.reach + (m.reach ?? 0),
        impressions: acc.impressions + (m.impressions ?? 0),
        likes: acc.likes + (m.likes ?? 0),
        comments: acc.comments + (m.comments ?? 0),
        saves: acc.saves + (m.saves ?? 0),
        shares: acc.shares + (m.shares ?? 0),
        clicks: acc.clicks + (m.clicks ?? 0),
        followers_gained: acc.followers_gained + (m.followers_gained ?? 0),
      }),
      { reach: 0, impressions: 0, likes: 0, comments: 0, saves: 0, shares: 0, clicks: 0, followers_gained: 0 },
    );
  }, [metrics]);

  const byChannel = useMemo(() => {
    const map = new Map<string, { channel: string; reach: number; engagement: number }>();
    for (const m of metrics) {
      const ch = m.task?.social_channel ?? "other";
      const cur = map.get(ch) ?? { channel: ch, reach: 0, engagement: 0 };
      cur.reach += m.reach ?? 0;
      cur.engagement += (m.likes ?? 0) + (m.comments ?? 0) + (m.saves ?? 0) + (m.shares ?? 0);
      map.set(ch, cur);
    }
    return Array.from(map.values());
  }, [metrics]);

  const byDay = useMemo(() => {
    const map = new Map<string, { day: string; reach: number; engagement: number }>();
    for (const m of metrics) {
      const key = format(new Date(m.collected_at), "dd/MM", { locale: ptBR });
      const cur = map.get(key) ?? { day: key, reach: 0, engagement: 0 };
      cur.reach += m.reach ?? 0;
      cur.engagement += (m.likes ?? 0) + (m.comments ?? 0) + (m.saves ?? 0) + (m.shares ?? 0);
      map.set(key, cur);
    }
    return Array.from(map.values()).slice(-30);
  }, [metrics]);

  const KPI = ({ icon: Icon, label, value, color }: { icon: typeof Eye; label: string; value: number; color: string }) => (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value.toLocaleString("pt-BR")}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Analytics de mídias</h1>
          <p className="text-sm text-muted-foreground">{metrics.length} coletas no período.</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="h-9 w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
            <SelectItem value="365">1 ano</SelectItem>
          </SelectContent>
        </Select>
        <Select value={campaignId} onValueChange={setCampaignId}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas campanhas</SelectItem>
            {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={channel} onValueChange={(v) => setChannel(v as SocialChannel | "all")}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos canais</SelectItem>
            {(Object.keys(CHANNEL_COLOR) as SocialChannel[]).map((c) => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPI icon={Eye} label="Alcance" value={totals.reach} color="bg-pink-500" />
        <KPI icon={Eye} label="Impressões" value={totals.impressions} color="bg-rose-500" />
        <KPI icon={Heart} label="Curtidas" value={totals.likes} color="bg-red-500" />
        <KPI icon={MessageCircle} label="Comentários" value={totals.comments} color="bg-amber-500" />
        <KPI icon={Bookmark} label="Salvos" value={totals.saves} color="bg-violet-500" />
        <KPI icon={Share2} label="Compart." value={totals.shares} color="bg-sky-500" />
        <KPI icon={MousePointerClick} label="Cliques" value={totals.clicks} color="bg-emerald-500" />
        <KPI icon={UserPlus} label="+Seguidores" value={totals.followers_gained} color="bg-indigo-500" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Evolução diária</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="reach" fill="hsl(var(--primary))" name="Alcance" />
              <Bar dataKey="engagement" fill="#ec4899" name="Engajamento" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Distribuição por canal</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byChannel} dataKey="reach" nameKey="channel" cx="50%" cy="50%" outerRadius={90} label>
                {byChannel.map((entry) => (
                  <Cell key={entry.channel} fill={CHANNEL_COLOR[entry.channel as SocialChannel] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Posts coletados</h3>
        {metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma métrica registrada no período. Abra um post publicado e use o painel "Métricas".</p>
        ) : (
          <div className="space-y-1.5">
            {metrics.slice(0, 50).map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b py-1.5 text-xs last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{m.task?.title ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(m.collected_at), "dd MMM yyyy", { locale: ptBR })}
                    {m.task?.social_channel && ` · ${m.task.social_channel}`}
                  </p>
                </div>
                <div className="flex gap-3 text-[11px]">
                  <span>👁️ {(m.reach ?? 0).toLocaleString("pt-BR")}</span>
                  <span>❤️ {(m.likes ?? 0).toLocaleString("pt-BR")}</span>
                  <span>💬 {(m.comments ?? 0).toLocaleString("pt-BR")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
