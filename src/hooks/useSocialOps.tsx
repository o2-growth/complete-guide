import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { SocialChannel } from "@/hooks/useSocialMedia";

/* ===== Inbox ===== */
export type InboxKind = "dm" | "comment" | "mention" | "review" | "reply";
export type InboxStatus = "new" | "reading" | "replied" | "ignored" | "task_created" | "archived";
export type InboxSentiment = "positive" | "neutral" | "negative" | "question";

export interface InboxItem {
  id: string;
  tenant_id: string;
  integration_id: string | null;
  channel: SocialChannel;
  kind: InboxKind;
  external_id: string | null;
  external_url: string | null;
  author_name: string | null;
  author_handle: string | null;
  author_avatar: string | null;
  message: string;
  parent_post_external_id: string | null;
  task_id: string | null;
  status: InboxStatus;
  sentiment: InboxSentiment | null;
  ai_summary: string | null;
  ai_suggested_reply: string | null;
  reply_text: string | null;
  received_at: string;
  handled_at: string | null;
  created_at: string;
}

export interface InboxFilters {
  status?: InboxStatus | "all";
  channel?: SocialChannel | "all";
  sentiment?: InboxSentiment | "all";
  search?: string;
}

export function useInbox(filters: InboxFilters = {}) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["social_inbox", tenantId, filters],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase.from("social_inbox_items").select("*")
        .eq("tenant_id", tenantId!)
        .order("received_at", { ascending: false })
        .limit(200);
      if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
      if (filters.channel && filters.channel !== "all") q = q.eq("channel", filters.channel);
      if (filters.sentiment && filters.sentiment !== "all") q = q.eq("sentiment", filters.sentiment);
      if (filters.search) q = q.ilike("message", `%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as InboxItem[];
    },
  });
}

export function useInboxSummary() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["inbox_summary", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("inbox_summary", { _tenant: tenantId! });
      if (error) throw error;
      return data as {
        total?: number; new?: number; replied?: number; task?: number;
        negative?: number; question?: number; by_channel?: Record<string, number>;
      };
    },
  });
}

export function useUpdateInboxItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { id: string; status?: InboxStatus; reply_text?: string; sentiment?: InboxSentiment }) => {
      const patch: Record<string, unknown> = {};
      if (input.status) { patch.status = input.status; patch.handled_by = user?.id ?? null; patch.handled_at = new Date().toISOString(); }
      if (input.reply_text !== undefined) patch.reply_text = input.reply_text;
      if (input.sentiment) patch.sentiment = input.sentiment;
      const { error } = await supabase.from("social_inbox_items").update(patch as never).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social_inbox"] });
      qc.invalidateQueries({ queryKey: ["inbox_summary"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useConvertInboxToTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; project_id?: string; assignee_id?: string }) => {
      const { data, error } = await supabase.rpc("convert_inbox_item_to_task", {
        _inbox_id: input.id,
        _project_id: input.project_id ?? undefined,
        _assignee_id: input.assignee_id ?? undefined,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social_inbox"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa criada a partir da mensagem");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function pollInboxNow(tenantId: string, count = 6) {
  const { data, error } = await supabase.functions.invoke("social-inbox-poll", {
    body: { tenantId, count },
  });
  if (error) throw error;
  return data as { ok: boolean; inserted: number; mode: string };
}

/* ===== Cadence ===== */
export interface CadenceSlot {
  id: string;
  tenant_id: string;
  channel: SocialChannel;
  dow: number;
  hour: number;
  target_posts: number;
  enabled: boolean;
  notes: string | null;
}

export function useCadence() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["posting_cadence", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("posting_cadence").select("*")
        .eq("tenant_id", tenantId!).order("dow").order("hour");
      if (error) throw error;
      return (data ?? []) as CadenceSlot[];
    },
  });
}

export function useToggleCadenceSlot() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { channel: SocialChannel; dow: number; hour: number; existing?: CadenceSlot | null }) => {
      if (!tenantId) throw new Error("Workspace");
      if (input.existing) {
        const { error } = await supabase.from("posting_cadence").delete().eq("id", input.existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("posting_cadence").insert({
          tenant_id: tenantId, channel: input.channel, dow: input.dow, hour: input.hour, target_posts: 1, enabled: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posting_cadence"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ===== Campaign report ===== */
export interface CampaignReport {
  totals: {
    posts: number; reach: number; impressions: number; likes: number;
    comments: number; shares: number; saves: number; clicks: number; followers_gained: number;
  };
  by_channel: Array<{ channel: string; posts: number; reach: number; likes: number; comments: number; shares: number }>;
  top_posts: Array<{ id: string; title: string; channel: string; reach: number; likes: number; comments: number }>;
}

export function useCampaignReport(campaignId: string | null) {
  return useQuery({
    queryKey: ["campaign_report", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("campaign_report", { _campaign_id: campaignId! });
      if (error) throw error;
      return data as unknown as CampaignReport;
    },
  });
}

export async function collectMetricsNow(opts: { taskId?: string; campaignId?: string; tenantId?: string } = {}) {
  const { data, error } = await supabase.functions.invoke("collect-social-metrics", { body: opts });
  if (error) throw error;
  return data as { ok: boolean; updated: number; mode: string };
}