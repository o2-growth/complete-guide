import { useState } from "react";
import { Copy, Link2, Loader2, Megaphone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  buildApprovalUrl, useCampaigns, useCreateApprovalRequest, useTaskApprovalRequests,
  type SocialChannel, type PublishState,
} from "@/hooks/useSocialMedia";

const CHANNELS: SocialChannel[] = ["instagram","linkedin","tiktok","facebook","youtube","twitter","email","other"];
const STATES: PublishState[] = ["idea","drafting","review","approved","scheduled","published","archived"];

interface Props {
  taskId: string;
  channel: SocialChannel | null;
  state: PublishState | null;
  caption: string | null;
  campaignId: string | null;
  scheduledAt: string | null;
  onUpdated?: () => void;
}

export function SocialMediaPanel({ taskId, channel, state, caption, campaignId, scheduledAt, onUpdated }: Props) {
  const { data: campaigns = [] } = useCampaigns();
  const { data: requests = [] } = useTaskApprovalRequests(taskId);
  const createReq = useCreateApprovalRequest();
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState({
    channel: channel ?? "instagram" as SocialChannel,
    state: state ?? "drafting" as PublishState,
    caption: caption ?? "",
    campaignId: campaignId ?? "none",
    scheduledAt: scheduledAt ? scheduledAt.slice(0, 16) : "",
  });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("tasks").update({
      social_channel: local.channel,
      publish_state: local.state,
      social_caption: local.caption || null,
      campaign_id: local.campaignId === "none" ? null : local.campaignId,
      scheduled_at: local.scheduledAt ? new Date(local.scheduledAt).toISOString() : null,
    }).eq("id", taskId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Post atualizado");
    onUpdated?.();
  };

  const generateLink = async () => {
    const req = await createReq.mutateAsync({ taskId, expiresInDays: 14 });
    const url = buildApprovalUrl(req.token);
    await navigator.clipboard.writeText(url).catch(() => {
      toast.error("Não foi possível copiar — copie manualmente.");
    });
    toast.success("Link copiado!");
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Megaphone className="h-4 w-4 text-primary" />
        Mídia social
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Canal</Label>
          <Select value={local.channel} onValueChange={(v) => setLocal({ ...local, channel: v as SocialChannel })}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Estado</Label>
          <Select value={local.state} onValueChange={(v) => setLocal({ ...local, state: v as PublishState })}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{STATES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs">Campanha</Label>
        <Select value={local.campaignId} onValueChange={(v) => setLocal({ ...local, campaignId: v })}>
          <SelectTrigger className="h-8"><SelectValue placeholder="Sem campanha" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— sem campanha —</SelectItem>
            {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Agendado para</Label>
        <Input type="datetime-local" className="h-8" value={local.scheduledAt} onChange={(e) => setLocal({ ...local, scheduledAt: e.target.value })} />
      </div>

      <div>
        <Label className="text-xs">Legenda</Label>
        <Textarea rows={3} value={local.caption} onChange={(e) => setLocal({ ...local, caption: e.target.value })} placeholder="Texto do post..." />
      </div>

      <Button size="sm" onClick={save} disabled={saving} className="w-full">
        {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Salvar
      </Button>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Aprovação por link público</span>
          <Button size="sm" variant="outline" onClick={generateLink} disabled={createReq.isPending}>
            {createReq.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
            <span className="ml-1.5">Gerar link</span>
          </Button>
        </div>
        {requests.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Nenhum link gerado.</p>
        ) : (
          <div className="space-y-1.5">
            {requests.slice(0, 5).map((r) => {
              const url = buildApprovalUrl(r.token);
              return (
                <div key={r.id} className="flex items-center gap-1.5 text-[11px]">
                  <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "outline"} className="capitalize">{r.status}</Badge>
                  <code className="flex-1 truncate rounded bg-muted px-1.5 py-0.5">{url}</code>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(url); toast.success("Copiado"); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}