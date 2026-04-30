import { useMemo, useState } from "react";
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarRange, ChevronLeft, ChevronRight, Filter, Instagram, Linkedin, Mail, Music2, Youtube, Twitter, Facebook, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCampaigns, useSocialPosts, type SocialChannel, type PublishState, type SocialPost } from "@/hooks/useSocialMedia";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { cn } from "@/lib/utils";

const CHANNEL_META: Record<SocialChannel, { label: string; icon: typeof Instagram; color: string }> = {
  instagram: { label: "Instagram", icon: Instagram, color: "from-pink-500 to-orange-400" },
  linkedin:  { label: "LinkedIn",  icon: Linkedin,  color: "from-sky-700 to-sky-500" },
  tiktok:    { label: "TikTok",    icon: Music2,    color: "from-zinc-900 to-zinc-700" },
  facebook:  { label: "Facebook",  icon: Facebook,  color: "from-blue-700 to-blue-500" },
  youtube:   { label: "YouTube",   icon: Youtube,   color: "from-red-700 to-red-500" },
  twitter:   { label: "Twitter",   icon: Twitter,   color: "from-sky-500 to-sky-300" },
  email:     { label: "Email",     icon: Mail,      color: "from-indigo-600 to-indigo-400" },
  other:     { label: "Outro",     icon: Mail,      color: "from-slate-500 to-slate-300" },
};

const STATE_META: Record<PublishState, { label: string; tone: string }> = {
  idea:       { label: "Ideia",      tone: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  drafting:   { label: "Rascunho",   tone: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
  review:     { label: "Em revisão", tone: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200" },
  approved:   { label: "Aprovado",   tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" },
  scheduled:  { label: "Agendado",   tone: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200" },
  published:  { label: "Publicado",  tone: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200" },
  archived:   { label: "Arquivado",  tone: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
};

export default function SocialCalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [channel, setChannel] = useState<SocialChannel | "all">("all");
  const [campaignId, setCampaignId] = useState<string | "all">("all");
  const [state, setState] = useState<PublishState | "all">("all");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const { data: campaigns = [] } = useCampaigns();

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const { data: posts = [] } = useSocialPosts({
    channel,
    campaignId: campaignId === "all" ? null : campaignId,
    state,
    from: gridStart.toISOString(),
    to: gridEnd.toISOString(),
  });

  const days: Date[] = useMemo(() => {
    const out: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }, [gridStart, gridEnd]);

  const byDay = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    for (const p of posts) {
      const when = p.scheduled_at ?? p.due_at;
      if (!when) continue;
      const key = format(new Date(when), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [posts]);

  const counters = useMemo(() => {
    const stats: Record<PublishState | "total", number> = {
      total: posts.length, idea: 0, drafting: 0, review: 0, approved: 0, scheduled: 0, published: 0, archived: 0,
    };
    for (const p of posts) if (p.publish_state) stats[p.publish_state]++;
    return stats;
  }, [posts]);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-orange-400 text-white">
          <CalendarRange className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-bold tracking-tight">Calendário editorial</h1>
          <p className="text-sm text-muted-foreground">
            Posts agendados de todos os canais. Arraste filtros para navegar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[180px] text-center text-sm font-semibold capitalize">
            {format(cursor, "MMMM yyyy", { locale: ptBR })}
          </div>
          <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Hoje</Button>
        </div>
      </header>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={channel} onValueChange={(v) => setChannel(v as SocialChannel | "all")}>
            <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos canais</SelectItem>
              {(Object.keys(CHANNEL_META) as SocialChannel[]).map((c) => (
                <SelectItem key={c} value={c}>{CHANNEL_META[c].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={campaignId} onValueChange={(v) => setCampaignId(v)}>
            <SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas campanhas</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={state} onValueChange={(v) => setState(v as PublishState | "all")}>
            <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos estados</SelectItem>
              {(Object.keys(STATE_META) as PublishState[]).map((s) => (
                <SelectItem key={s} value={s}>{STATE_META[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex flex-wrap gap-1.5 text-xs">
            <Badge variant="outline">Total {counters.total}</Badge>
            <Badge className={STATE_META.scheduled.tone}>Agendados {counters.scheduled}</Badge>
            <Badge className={STATE_META.review.tone}>Revisão {counters.review}</Badge>
            <Badge className={STATE_META.published.tone}>Publicados {counters.published}</Badge>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/30 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="px-2 py-1.5 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const items = byDay.get(key) ?? [];
            const isOther = !isSameMonth(day, cursor);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={key}
                className={cn(
                  "min-h-[120px] border-b border-r p-1.5 text-xs",
                  isOther && "bg-muted/20 text-muted-foreground/60",
                )}
              >
                <div className={cn("mb-1 flex items-center justify-between", isToday && "font-bold text-primary")}>
                  <span>{format(day, "d")}</span>
                  {items.length > 0 && <span className="text-[10px] text-muted-foreground">{items.length}</span>}
                </div>
                <div className="space-y-1">
                  {items.slice(0, 3).map((p) => {
                    const ch = (p.social_channel ?? "other") as SocialChannel;
                    const meta = CHANNEL_META[ch];
                    const Icon = meta.icon;
                    const st = p.publish_state ?? "drafting";
                    return (
                      <button
                        key={p.id}
                        onClick={() => setOpenTaskId(p.id)}
                        className={cn(
                          "flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[11px] hover:opacity-90 bg-gradient-to-r text-white",
                          meta.color,
                        )}
                        title={`${p.title} — ${STATE_META[st].label}`}
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{p.title}</span>
                      </button>
                    );
                  })}
                  {items.length > 3 && (
                    <div className="text-[10px] text-muted-foreground">+{items.length - 3} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <TaskDetailSheet taskId={openTaskId} onOpenChange={(o) => !o && setOpenTaskId(null)} />
    </div>
  );
}