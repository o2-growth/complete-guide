import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { SocialChannel } from "@/hooks/useSocialMedia";

/* ===== Integrations ===== */
export interface SocialIntegration {
  id: string;
  tenant_id: string;
  provider: "meta" | "instagram" | "linkedin" | "tiktok" | "facebook" | "x";
  account_id: string | null;
  account_name: string | null;
  account_avatar: string | null;
  status: "mock" | "active" | "expired" | "revoked" | "error";
  scopes: string[] | null;
  expires_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useIntegrations() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["social_integrations", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_integrations").select("*")
        .eq("tenant_id", tenantId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SocialIntegration[];
    },
  });
}

export function useUpsertIntegration() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<SocialIntegration> & { provider: SocialIntegration["provider"]; account_name: string }) => {
      if (!tenantId) throw new Error("Workspace");
      const payload = {
        tenant_id: tenantId,
        connected_by: user?.id ?? null,
        provider: input.provider,
        account_id: input.account_id ?? `mock-${input.provider}-${Date.now()}`,
        account_name: input.account_name,
        status: input.status ?? "mock",
        scopes: input.scopes ?? [],
        metadata: input.metadata ?? {},
      };
      const { error } = await supabase.from("social_integrations").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social_integrations"] });
      toast.success("Integração conectada (modo mock — adicione secrets para ativar)");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_integrations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social_integrations"] }),
  });
}

/* ===== Scheduled publishes ===== */
export interface ScheduledPublish {
  id: string; tenant_id: string; task_id: string; integration_id: string | null;
  channel: SocialChannel; scheduled_at: string;
  status: "pending" | "running" | "published" | "failed" | "cancelled" | "mocked";
  attempts: number; last_attempt_at: string | null; external_url: string | null; error: string | null;
}

export function useScheduledPublishes(filter?: "pending" | "all") {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["scheduled_publishes", tenantId, filter ?? "all"],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase.from("scheduled_publishes").select("*")
        .eq("tenant_id", tenantId!).order("scheduled_at", { ascending: true }).limit(200);
      if (filter === "pending") q = q.eq("status", "pending");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ScheduledPublish[];
    },
  });
}

export async function runPublishTick() {
  const { data, error } = await supabase.functions.invoke("schedule-publisher-tick", { body: {} });
  if (error) throw error;
  return data as { processed: number };
}

export async function publishNow(publishId: string) {
  const { data, error } = await supabase.functions.invoke("social-publish", { body: { publishId } });
  if (error) throw error;
  return data;
}

/* ===== Content briefs ===== */
export interface ContentBrief {
  id: string; tenant_id: string; campaign_id: string | null; title: string;
  objective: string | null; audience: string | null; tone: string | null;
  channels: SocialChannel[];
  angles: Array<{ name: string; summary: string; format?: string }>;
  hooks: string[];
  generated_by_ai: boolean;
  used_count: number;
  created_at: string;
}

export function useContentBriefs() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["content_briefs", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_briefs").select("*")
        .eq("tenant_id", tenantId!).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as ContentBrief[];
    },
  });
}

export function useSaveBrief() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<ContentBrief> & { title: string }) => {
      if (!tenantId) throw new Error("Workspace");
      const { error } = await supabase.from("content_briefs").insert({
        tenant_id: tenantId,
        created_by: user?.id ?? null,
        title: input.title,
        objective: input.objective ?? null,
        audience: input.audience ?? null,
        tone: input.tone ?? null,
        channels: input.channels ?? ["instagram"],
        angles: input.angles ?? [],
        hooks: input.hooks ?? [],
        generated_by_ai: input.generated_by_ai ?? false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content_briefs"] });
      toast.success("Pauta salva");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_briefs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content_briefs"] }),
  });
}

export async function generateBriefAI(input: { topic: string; channels: SocialChannel[]; audience?: string; tone?: string }) {
  const { data, error } = await supabase.functions.invoke("ai-content-brief", { body: input });
  if (error) throw error;
  return (data as { brief: { title: string; objective: string; angles: ContentBrief["angles"]; hooks: string[] } }).brief;
}

export async function generateImageAI(prompt: string, aspect: "square" | "portrait" | "landscape" = "square") {
  const { data, error } = await supabase.functions.invoke("ai-generate-image", { body: { prompt, aspect } });
  if (error) throw error;
  return (data as { imageUrl: string | null }).imageUrl;
}

/* ===== Competitors ===== */
export interface Competitor {
  id: string; tenant_id: string; name: string; handle: string | null;
  channel: SocialChannel; url: string | null; followers: number | null;
  notes: string | null; created_at: string;
}
export interface CompetitorPost {
  id: string; competitor_id: string; posted_at: string | null;
  caption: string | null; url: string | null; thumbnail_url: string | null;
  likes: number | null; comments: number | null; shares: number | null;
  notes: string | null;
}

export function useCompetitors() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["competitors", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitors").select("*").eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Competitor[];
    },
  });
}

export function useSaveCompetitor() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<Competitor> & { name: string; channel: SocialChannel }) => {
      if (!tenantId) throw new Error("Workspace");
      if (input.id) {
        const { error } = await supabase.from("competitors").update({
          name: input.name, handle: input.handle ?? null, channel: input.channel,
          url: input.url ?? null, followers: input.followers ?? null, notes: input.notes ?? null,
        }).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("competitors").insert({
          tenant_id: tenantId, created_by: user?.id ?? null,
          name: input.name, handle: input.handle ?? null, channel: input.channel,
          url: input.url ?? null, followers: input.followers ?? null, notes: input.notes ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["competitors"] });
      toast.success("Concorrente salvo");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competitors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["competitors"] }),
  });
}

export function useCompetitorPosts(competitorId: string | null) {
  return useQuery({
    queryKey: ["competitor_posts", competitorId],
    enabled: !!competitorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitor_posts").select("*").eq("competitor_id", competitorId!)
        .order("posted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CompetitorPost[];
    },
  });
}

export function useSaveCompetitorPost() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<CompetitorPost> & { competitor_id: string }) => {
      if (!tenantId) throw new Error("Workspace");
      const { error } = await supabase.from("competitor_posts").insert({
        tenant_id: tenantId,
        competitor_id: input.competitor_id,
        created_by: user?.id ?? null,
        posted_at: input.posted_at ?? new Date().toISOString(),
        caption: input.caption ?? null,
        url: input.url ?? null,
        thumbnail_url: input.thumbnail_url ?? null,
        likes: input.likes ?? null,
        comments: input.comments ?? null,
        shares: input.shares ?? null,
        notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["competitor_posts", vars.competitor_id] });
      toast.success("Post registrado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ===== Best time to post (heurística baseada em métricas próprias) ===== */
export function useBestTimeToPost() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["best_time_to_post", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      // pega métricas dos últimos 90 dias e cruza com published_at
      const { data: metrics } = await supabase
        .from("post_metrics").select("task_id, reach, likes, comments")
        .eq("tenant_id", tenantId!).limit(2000);
      const taskIds = Array.from(new Set((metrics ?? []).map((m) => m.task_id)));
      if (taskIds.length === 0) return [] as Array<{ dow: number; hour: number; score: number; samples: number }>;

      const { data: tasks } = await supabase
        .from("tasks").select("id, published_at, social_channel")
        .in("id", taskIds);
      const tasksMap = new Map((tasks ?? []).map((t) => [t.id, t]));

      const buckets = new Map<string, { dow: number; hour: number; score: number; samples: number }>();
      for (const m of metrics ?? []) {
        const t = tasksMap.get(m.task_id);
        if (!t?.published_at) continue;
        const d = new Date(t.published_at);
        const dow = d.getDay();
        const hour = d.getHours();
        const k = `${dow}-${hour}`;
        const cur = buckets.get(k) ?? { dow, hour, score: 0, samples: 0 };
        cur.score += (m.reach ?? 0) + ((m.likes ?? 0) + (m.comments ?? 0)) * 5;
        cur.samples += 1;
        buckets.set(k, cur);
      }
      return Array.from(buckets.values())
        .map((b) => ({ ...b, score: Math.round(b.score / Math.max(1, b.samples)) }))
        .sort((a, b) => b.score - a.score);
    },
  });
}