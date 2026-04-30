import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { SocialChannel } from "@/hooks/useSocialMedia";

/* ================ Creators ================ */
export interface Creator {
  id: string; tenant_id: string; full_name: string; handle: string | null;
  email: string | null; phone: string | null; avatar_url: string | null;
  niche: string | null; followers_count: number; engagement_rate: number;
  notes: string | null; tags: string[]; status: "active" | "paused" | "archived";
  created_at: string;
}

export function useCreators() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["creators", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("creators").select("*")
        .eq("tenant_id", tenantId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Creator[];
    },
  });
}

export function useUpsertCreator() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<Creator> & { id?: string }) => {
      if (!tenantId) throw new Error("Workspace");
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from("creators").update(patch as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("creators").insert({
          tenant_id: tenantId,
          full_name: input.full_name ?? "Novo creator",
          handle: input.handle ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          niche: input.niche ?? null,
          followers_count: input.followers_count ?? 0,
          engagement_rate: input.engagement_rate ?? 0,
          tags: input.tags ?? [],
          notes: input.notes ?? null,
          status: input.status ?? "active",
          created_by: user?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creators"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ================ UGC ================ */
export interface UgcAsset {
  id: string; tenant_id: string; creator_id: string | null;
  asset_id: string | null; source_url: string | null; caption: string | null;
  status: "pending" | "approved" | "rejected" | "reposted" | "archived";
  rights_ok: boolean; rights_until: string | null;
  reposted_task_id: string | null; created_at: string;
}

export function useUgcAssets() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["ugc_assets", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ugc_assets").select("*")
        .eq("tenant_id", tenantId!).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as UgcAsset[];
    },
  });
}

export function useUpsertUgc() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<UgcAsset> & { id?: string }) => {
      if (!tenantId) throw new Error("Workspace");
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from("ugc_assets").update(patch as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ugc_assets").insert({
          tenant_id: tenantId,
          creator_id: input.creator_id ?? null,
          source_url: input.source_url ?? null,
          caption: input.caption ?? null,
          rights_ok: input.rights_ok ?? false,
          rights_until: input.rights_until ?? null,
          status: input.status ?? "pending",
          created_by: user?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ugc_assets"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRepostUgc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ugc_id: string; project_id: string; channel: SocialChannel }) => {
      const { data, error } = await supabase.rpc("repost_ugc", {
        _ugc_id: input.ugc_id, _project_id: input.project_id, _channel: input.channel,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ugc_assets"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Repost criado como rascunho");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ================ Bio Pages / Links ================ */
export interface BioPage {
  id: string; tenant_id: string; slug: string; title: string; bio: string | null;
  avatar_url: string | null; theme: { bg: string; fg: string; accent: string; button_style: string };
  active: boolean; views: number; created_at: string;
}
export interface BioLink {
  id: string; tenant_id: string; page_id: string; label: string; url: string;
  icon: string | null; position: number; active: boolean;
  utm_source: string | null; utm_medium: string | null;
  utm_campaign: string | null; utm_content: string | null;
  clicks: number; starts_at: string | null; ends_at: string | null;
}

export function useBioPages() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["bio_pages", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("bio_pages").select("*")
        .eq("tenant_id", tenantId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BioPage[];
    },
  });
}

export function useBioLinks(pageId: string | null) {
  return useQuery({
    queryKey: ["bio_links", pageId],
    enabled: !!pageId,
    queryFn: async () => {
      const { data, error } = await supabase.from("bio_links").select("*")
        .eq("page_id", pageId!).order("position");
      if (error) throw error;
      return (data ?? []) as BioLink[];
    },
  });
}

export function useUpsertBioPage() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<BioPage> & { id?: string }) => {
      if (!tenantId) throw new Error("Workspace");
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from("bio_pages").update(patch as never).eq("id", id);
        if (error) throw error;
        return id;
      } else {
        const { data, error } = await supabase.from("bio_pages").insert({
          tenant_id: tenantId,
          slug: input.slug ?? `bio-${Date.now()}`,
          title: input.title ?? "Minha bio",
          bio: input.bio ?? null,
          avatar_url: input.avatar_url ?? null,
          theme: input.theme ?? { bg: "#0F172A", fg: "#FFFFFF", accent: "#0EA5E9", button_style: "rounded" },
          active: input.active ?? true,
          created_by: user?.id ?? null,
        }).select("id").maybeSingle();
        if (error) throw error;
        return data?.id;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bio_pages"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpsertBioLink() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: Partial<BioLink> & { id?: string; page_id: string }) => {
      if (!tenantId) throw new Error("Workspace");
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from("bio_links").update(patch as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bio_links").insert({
          tenant_id: tenantId,
          page_id: input.page_id,
          label: input.label ?? "Novo link",
          url: input.url ?? "https://",
          icon: input.icon ?? null,
          position: input.position ?? 0,
          active: input.active ?? true,
          utm_source: input.utm_source ?? null,
          utm_medium: input.utm_medium ?? null,
          utm_campaign: input.utm_campaign ?? null,
          utm_content: input.utm_content ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["bio_links", vars.page_id] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBioLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bio_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bio_links"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ================ Boosts / ROAS ================ */
export interface AdBoost {
  id: string; tenant_id: string; task_id: string | null;
  campaign_id: string | null; channel: string; objective: string;
  budget_cents: number; spent_cents: number; revenue_cents: number;
  starts_at: string; ends_at: string | null;
  status: "planned" | "running" | "paused" | "done" | "cancelled";
  external_id: string | null; notes: string | null; created_at: string;
}

export function useBoosts(campaignId?: string) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["ad_boosts", tenantId, campaignId],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase.from("ad_boosts").select("*")
        .eq("tenant_id", tenantId!).order("created_at", { ascending: false });
      if (campaignId) q = q.eq("campaign_id", campaignId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AdBoost[];
    },
  });
}

export function useUpsertBoost() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<AdBoost> & { id?: string }) => {
      if (!tenantId) throw new Error("Workspace");
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from("ad_boosts").update(patch as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ad_boosts").insert({
          tenant_id: tenantId,
          task_id: input.task_id ?? null,
          campaign_id: input.campaign_id ?? null,
          channel: input.channel ?? "instagram",
          objective: input.objective ?? "reach",
          budget_cents: input.budget_cents ?? 0,
          spent_cents: input.spent_cents ?? 0,
          revenue_cents: input.revenue_cents ?? 0,
          starts_at: input.starts_at ?? new Date().toISOString(),
          ends_at: input.ends_at ?? null,
          status: input.status ?? "planned",
          notes: input.notes ?? null,
          created_by: user?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ad_boosts"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCampaignRoas(campaignId: string | null) {
  return useQuery({
    queryKey: ["campaign_roas", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("campaign_roas", { _campaign_id: campaignId! });
      if (error) throw error;
      return data as { spent_cents: number; revenue_cents: number; roas: number; clicks: number; cpc_cents: number; boosts_total: number; boosts_running: number };
    },
  });
}

export function useBoostRecommendations() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["boost_recommendations", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("recommend_boosts", { _tenant: tenantId!, _limit: 8 });
      if (error) throw error;
      return (data ?? []) as Array<{ task_id: string; title: string; channel: string; reach: number; engagement: number; score: number }>;
    },
  });
}

/* ================ UTM Builder ================ */
export function buildUtmUrl(base: string, utms: { source?: string; medium?: string; campaign?: string; content?: string; term?: string }) {
  try {
    const u = new URL(base);
    if (utms.source) u.searchParams.set("utm_source", utms.source);
    if (utms.medium) u.searchParams.set("utm_medium", utms.medium);
    if (utms.campaign) u.searchParams.set("utm_campaign", utms.campaign);
    if (utms.content) u.searchParams.set("utm_content", utms.content);
    if (utms.term) u.searchParams.set("utm_term", utms.term);
    return u.toString();
  } catch {
    return base;
  }
}