import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { SocialChannel } from "@/hooks/useSocialMedia";

export interface CaptionSnippet {
  id: string;
  tenant_id: string;
  name: string;
  body: string;
  channel: SocialChannel | null;
  tags: string[] | null;
  usage_count: number;
  created_by: string | null;
  created_at: string;
}

export interface HashtagGroup {
  id: string;
  tenant_id: string;
  name: string;
  hashtags: string[];
  channel: SocialChannel | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PostMetric {
  id: string;
  tenant_id: string;
  task_id: string;
  collected_at: string;
  reach: number | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  shares: number | null;
  clicks: number | null;
  followers_gained: number | null;
  notes: string | null;
}

/* -------- Snippets -------- */
export function useCaptionSnippets(channel?: SocialChannel | null) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["caption_snippets", tenantId, channel ?? "all"],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase
        .from("caption_snippets")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("usage_count", { ascending: false })
        .limit(200);
      if (channel) q = q.or(`channel.eq.${channel},channel.is.null`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CaptionSnippet[];
    },
  });
}

export function useSaveSnippet() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; body: string; channel?: SocialChannel | null; tags?: string[] }) => {
      if (!tenantId) throw new Error("Workspace");
      if (input.id) {
        const { error } = await supabase
          .from("caption_snippets")
          .update({ name: input.name, body: input.body, channel: input.channel ?? null, tags: input.tags ?? [] })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("caption_snippets").insert({
          tenant_id: tenantId,
          created_by: user?.id ?? null,
          name: input.name,
          body: input.body,
          channel: input.channel ?? null,
          tags: input.tags ?? [],
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caption_snippets"] });
      toast.success("Legenda salva");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("caption_snippets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["caption_snippets"] }),
  });
}

export async function bumpSnippetUsage(id: string) {
  const { data } = await supabase.from("caption_snippets").select("usage_count").eq("id", id).single();
  if (data) {
    await supabase.from("caption_snippets").update({ usage_count: (data.usage_count ?? 0) + 1 }).eq("id", id);
  }
}

/* -------- Hashtag groups -------- */
export function useHashtagGroups(channel?: SocialChannel | null) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["hashtag_groups", tenantId, channel ?? "all"],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase
        .from("hashtag_groups")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (channel) q = q.or(`channel.eq.${channel},channel.is.null`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as HashtagGroup[];
    },
  });
}

export function useSaveHashtagGroup() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; hashtags: string[]; channel?: SocialChannel | null; notes?: string | null }) => {
      if (!tenantId) throw new Error("Workspace");
      if (input.id) {
        const { error } = await supabase
          .from("hashtag_groups")
          .update({ name: input.name, hashtags: input.hashtags, channel: input.channel ?? null, notes: input.notes ?? null })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hashtag_groups").insert({
          tenant_id: tenantId,
          created_by: user?.id ?? null,
          name: input.name,
          hashtags: input.hashtags,
          channel: input.channel ?? null,
          notes: input.notes ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hashtag_groups"] });
      toast.success("Grupo salvo");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteHashtagGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hashtag_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hashtag_groups"] }),
  });
}

/* -------- Post metrics -------- */
export function usePostMetrics(filters?: { from?: string; to?: string; campaignId?: string | null; channel?: SocialChannel | null }) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["post_metrics", tenantId, filters?.from ?? "", filters?.to ?? "", filters?.campaignId ?? "", filters?.channel ?? ""],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase
        .from("post_metrics")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("collected_at", { ascending: false })
        .limit(1000);
      if (filters?.from) q = q.gte("collected_at", filters.from);
      if (filters?.to) q = q.lte("collected_at", filters.to);
      const { data, error } = await q;
      if (error) throw error;
      const metrics = (data ?? []) as PostMetric[];
      const taskIds = Array.from(new Set(metrics.map((m) => m.task_id)));
      const tasksMap = new Map<string, { id: string; title: string; social_channel: SocialChannel | null; campaign_id: string | null; published_at: string | null; scheduled_at: string | null }>();
      if (taskIds.length > 0) {
        const { data: tasksData } = await supabase
          .from("tasks")
          .select("id, title, social_channel, campaign_id, published_at, scheduled_at")
          .in("id", taskIds);
        for (const t of tasksData ?? []) tasksMap.set(t.id, t as never);
      }
      let rows = metrics.map((m) => ({ ...m, task: tasksMap.get(m.task_id) ?? null }));
      if (filters?.campaignId) rows = rows.filter((r) => r.task?.campaign_id === filters.campaignId);
      if (filters?.channel) rows = rows.filter((r) => r.task?.social_channel === filters.channel);
      return rows;
    },
  });
}

export function useTaskMetrics(taskId: string | null) {
  return useQuery({
    queryKey: ["post_metrics_task", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_metrics")
        .select("*")
        .eq("task_id", taskId!)
        .order("collected_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PostMetric[];
    },
  });
}

export function useSaveMetric() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<PostMetric> & { task_id: string }) => {
      if (!tenantId) throw new Error("Workspace");
      const { error } = await supabase.from("post_metrics").insert({
        tenant_id: tenantId,
        task_id: input.task_id,
        collected_at: input.collected_at ?? new Date().toISOString(),
        reach: input.reach ?? 0,
        impressions: input.impressions ?? 0,
        likes: input.likes ?? 0,
        comments: input.comments ?? 0,
        saves: input.saves ?? 0,
        shares: input.shares ?? 0,
        clicks: input.clicks ?? 0,
        followers_gained: input.followers_gained ?? 0,
        notes: input.notes ?? null,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["post_metrics"] });
      qc.invalidateQueries({ queryKey: ["post_metrics_task", vars.task_id] });
      toast.success("Métricas registradas");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("post_metrics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post_metrics"] }),
  });
}

/* -------- Variações de legenda via Lovable AI -------- */
const CHANNEL_TO_PLATFORM: Record<string, string> = {
  instagram: "ig_feed",
  linkedin: "linkedin",
  email: "email",
  tiktok: "ig_reel",
  facebook: "ig_feed",
  youtube: "ig_reel",
  twitter: "linkedin",
  other: "ig_feed",
};

export async function generateCaptionVariations(
  brief: string,
  channel: SocialChannel | null,
  tone: string = "profissional",
  count: number = 3,
): Promise<string[]> {
  const platform = CHANNEL_TO_PLATFORM[channel ?? "instagram"] ?? "ig_feed";
  const calls = Array.from({ length: count }, (_, i) =>
    supabase.functions.invoke("ai-generate-copy", {
      body: { brief: `${brief}\n\n(Variação #${i + 1} — explore um ângulo diferente)`, platform, tone },
    }),
  );
  const results = await Promise.all(calls);
  return results
    .map((r) => (r.error ? "" : (r.data as { text?: string } | null)?.text ?? ""))
    .filter((t) => t.trim().length > 0);
}
