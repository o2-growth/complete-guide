import { useMemo, useState } from "react";
import { Workflow, Instagram, Linkedin, Mail, Music2, Youtube, Twitter, Facebook } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCampaigns, useSocialPosts, type PublishState, type SocialChannel, type SocialPost } from "@/hooks/useSocialMedia";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const STATES: Array<{ value: PublishState; label: string; tone: string }> = [
  { value: "idea", label: "💡 Ideia", tone: "bg-slate-100 dark:bg-slate-900/40" },
  { value: "drafting", label: "✍️ Rascunho", tone: "bg-amber-50 dark:bg-amber-950/20" },
  { value: "review", label: "👀 Revisão", tone: "bg-orange-50 dark:bg-orange-950/20" },
  { value: "approved", label: "✅ Aprovado", tone: "bg-emerald-50 dark:bg-emerald-950/20" },
  { value: "scheduled", label: "📅 Agendado", tone: "bg-sky-50 dark:bg-sky-950/20" },
  { value: "published", label: "🚀 Publicado", tone: "bg-violet-50 dark:bg-violet-950/20" },
  { value: "archived", label: "📦 Arquivado", tone: "bg-zinc-50 dark:bg-zinc-900/40" },
];

const CHANNEL_ICON: Record<SocialChannel, typeof Instagram> = {
  instagram: Instagram, linkedin: Linkedin, tiktok: Music2, facebook: Facebook,
  youtube: Youtube, twitter: Twitter, email: Mail, other: Mail,
};

export default function SocialPipelinePage() {
  const { data: campaigns = [] } = useCampaigns();
  const [campaignId, setCampaignId] = useState<string | "all">("all");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: posts = [] } = useSocialPosts({
    campaignId: campaignId === "all" ? null : campaignId,
  });

  const byState = useMemo(() => {
    const map = new Map<PublishState, SocialPost[]>();
    for (const s of STATES) map.set(s.value, []);
    for (const p of posts) {
      const st = (p.publish_state ?? "drafting") as PublishState;
      const arr = map.get(st) ?? [];
      arr.push(p);
      map.set(st, arr);
    }
    return map;
  }, [posts]);

  const move = async (taskId: string, next: PublishState) => {
    const patch: { publish_state: PublishState; published_at?: string } = { publish_state: next };
    if (next === "published") patch.published_at = new Date().toISOString();
    const { error } = await supabase.from("tasks").update(patch).eq("id", taskId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["social_posts"] });
    toast.success(`Movido para ${STATES.find((s) => s.value === next)?.label}`);
  };

  return (
    <div className="space-y-4 p-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 text-white">
          <Workflow className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Pipeline de produção</h1>
          <p className="text-sm text-muted-foreground">Briefing → arte → revisão → aprovação → agendado → publicado.</p>
        </div>
        <Select value={campaignId} onValueChange={setCampaignId}>
          <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas campanhas</SelectItem>
            {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </header>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATES.map((s) => {
          const items = byState.get(s.value) ?? [];
          return (
            <div key={s.value} className={cn("flex w-[260px] shrink-0 flex-col rounded-lg border", s.tone)}>
              <div className="flex items-center justify-between border-b p-2 text-xs font-semibold">
                <span>{s.label}</span>
                <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
              </div>
              <div className="flex-1 space-y-1.5 p-2">
                {items.length === 0 && <p className="text-[11px] text-muted-foreground">—</p>}
                {items.map((p) => {
                  const ch = (p.social_channel ?? "other") as SocialChannel;
                  const Icon = CHANNEL_ICON[ch];
                  return (
                    <Card key={p.id} className="p-2 text-[11px]">
                      <button onClick={() => setOpenTaskId(p.id)} className="block w-full text-left">
                        <div className="flex items-center gap-1">
                          <Icon className="h-3 w-3 text-muted-foreground" />
                          <span className="line-clamp-2 font-medium">{p.title}</span>
                        </div>
                        {p.scheduled_at && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {new Date(p.scheduled_at).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </button>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {STATES.filter((x) => x.value !== s.value).slice(0, 3).map((x) => (
                          <Button
                            key={x.value}
                            size="sm"
                            variant="ghost"
                            className="h-5 px-1.5 text-[9px]"
                            onClick={() => move(p.id, x.value)}
                            title={`Mover para ${x.label}`}
                          >
                            → {x.label.split(" ")[0]}
                          </Button>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <TaskDetailSheet taskId={openTaskId} onOpenChange={(o) => !o && setOpenTaskId(null)} />
    </div>
  );
}
