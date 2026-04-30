import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type SocialChannel =
  | "instagram" | "linkedin" | "tiktok" | "facebook" | "youtube" | "twitter" | "email" | "other";

export type PublishState =
  | "idea" | "drafting" | "review" | "approved" | "scheduled" | "published" | "archived";

export type MediaKind = "image" | "video" | "document" | "audio" | "other";

export interface SocialCampaign {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  objective: string | null;
  color: string | null;
  channels: SocialChannel[];
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  tenant_id: string;
  campaign_id: string | null;
  name: string;
  kind: MediaKind;
  bucket: string;
  path: string;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  tags: string[] | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface SocialPost {
  id: string;
  code: string | null;
  title: string;
  social_caption: string | null;
  social_channel: SocialChannel | null;
  publish_state: PublishState | null;
  scheduled_at: string | null;
  published_at: string | null;
  published_url: string | null;
  campaign_id: string | null;
  due_at: string | null;
  status_id: string | null;
  assignee_id: string | null;
  type_id: string | null;
  project_id: string;
  tenant_id: string;
}

export interface SocialApprovalRequest {
  id: string;
  tenant_id: string;
  task_id: string;
  token: string;
  client_name: string | null;
  client_email: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected" | "expired";
  decided_at: string | null;
  decided_by_name: string | null;
  decision_comment: string | null;
  expires_at: string | null;
  created_at: string;
}

/* -------------------------- CAMPAIGNS -------------------------- */

export function useCampaigns() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["social_campaigns", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_campaigns")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SocialCampaign[];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<SocialCampaign> & { name: string }) => {
      if (!tenantId) throw new Error("Workspace ainda carregando");
      const { data, error } = await supabase
        .from("social_campaigns")
        .insert({
          tenant_id: tenantId,
          created_by: user?.id ?? null,
          name: input.name,
          description: input.description ?? null,
          objective: input.objective ?? null,
          color: input.color ?? "#0EA5E9",
          channels: input.channels ?? ["instagram"],
          start_date: input.start_date ?? null,
          end_date: input.end_date ?? null,
          status: input.status ?? "active",
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as SocialCampaign;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social_campaigns"] });
      toast.success("Campanha criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<SocialCampaign> }) => {
      const { data, error } = await supabase
        .from("social_campaigns")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as SocialCampaign;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social_campaigns"] });
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social_campaigns"] });
      toast.success("Campanha excluída");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* -------------------------- MEDIA ASSETS -------------------------- */

export function useMediaAssets(filters?: { search?: string; campaignId?: string | null; tag?: string | null }) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["media_assets", tenantId, filters?.search ?? "", filters?.campaignId ?? "", filters?.tag ?? ""],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase
        .from("media_assets")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (filters?.campaignId) q = q.eq("campaign_id", filters.campaignId);
      if (filters?.tag) q = q.contains("tags", [filters.tag]);
      if (filters?.search) q = q.ilike("name", `%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as MediaAsset[];
    },
  });
}

export function getAssetPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function useUploadAsset() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      file,
      campaignId,
      tags,
    }: {
      file: File;
      campaignId?: string | null;
      tags?: string[];
    }) => {
      if (!tenantId || !user) throw new Error("Faça login");
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;

      const kind: MediaKind = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
        ? "audio"
        : file.type.includes("pdf") || file.type.includes("document")
        ? "document"
        : "other";

      const { data, error } = await supabase
        .from("media_assets")
        .insert({
          tenant_id: tenantId,
          campaign_id: campaignId ?? null,
          name: file.name,
          kind,
          bucket: "media-assets",
          path,
          mime_type: file.type,
          size_bytes: file.size,
          tags: tags ?? [],
          uploaded_by: user.id,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as MediaAsset;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media_assets"] });
      toast.success("Asset enviado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asset: MediaAsset) => {
      await supabase.storage.from(asset.bucket).remove([asset.path]);
      const { error } = await supabase.from("media_assets").delete().eq("id", asset.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media_assets"] });
      toast.success("Asset removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* -------------------------- POSTS (calendário editorial) -------------------------- */

const SOCIAL_TYPE_SLUGS = ["ig_feed", "ig_story", "ig_reel", "linkedin", "email"];

export function useSocialPosts(filters?: {
  channel?: SocialChannel | "all";
  campaignId?: string | null;
  state?: PublishState | "all";
  from?: string;
  to?: string;
}) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: [
      "social_posts",
      tenantId,
      filters?.channel ?? "all",
      filters?.campaignId ?? "all",
      filters?.state ?? "all",
      filters?.from ?? "",
      filters?.to ?? "",
    ],
    enabled: !!tenantId,
    queryFn: async () => {
      // task_types do tenant (apenas slugs sociais)
      const { data: types } = await supabase
        .from("task_types")
        .select("id, slug")
        .eq("tenant_id", tenantId!)
        .in("slug", SOCIAL_TYPE_SLUGS);
      const typeIds = (types ?? []).map((t) => t.id);

      let q = supabase
        .from("tasks")
        .select(
          "id, code, title, social_caption, social_channel, publish_state, scheduled_at, published_at, published_url, campaign_id, due_at, status_id, assignee_id, type_id, project_id, tenant_id",
        )
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .order("scheduled_at", { ascending: true, nullsFirst: false })
        .limit(500);

      // tarefas marcadas como sociais (canal preenchido) OU dos tipos sociais
      if (typeIds.length > 0) {
        q = q.or(`social_channel.not.is.null,type_id.in.(${typeIds.join(",")})`);
      } else {
        q = q.not("social_channel", "is", null);
      }

      if (filters?.channel && filters.channel !== "all") q = q.eq("social_channel", filters.channel);
      if (filters?.campaignId) q = q.eq("campaign_id", filters.campaignId);
      if (filters?.state && filters.state !== "all") q = q.eq("publish_state", filters.state);
      if (filters?.from) q = q.gte("scheduled_at", filters.from);
      if (filters?.to) q = q.lte("scheduled_at", filters.to);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SocialPost[];
    },
  });
}

export function useUpdatePostSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, scheduled_at }: { id: string; scheduled_at: string | null }) => {
      const { error } = await supabase.from("tasks").update({ scheduled_at }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social_posts"] }),
  });
}

/* -------------------------- TASK ASSETS (vínculo) -------------------------- */

export function useTaskAssets(taskId: string | null) {
  return useQuery({
    queryKey: ["task_assets", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_assets")
        .select("position, asset_id, media_assets(*)")
        .eq("task_id", taskId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: { media_assets: MediaAsset; position: number }) => ({
        ...row.media_assets,
        position: row.position,
      }));
    },
  });
}

export function useLinkAssetToTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, assetId, position }: { taskId: string; assetId: string; position?: number }) => {
      const { error } = await supabase
        .from("task_assets")
        .insert({ task_id: taskId, asset_id: assetId, position: position ?? 0 });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["task_assets", vars.taskId] }),
  });
}

export function useUnlinkAssetFromTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, assetId }: { taskId: string; assetId: string }) => {
      const { error } = await supabase
        .from("task_assets")
        .delete()
        .eq("task_id", taskId)
        .eq("asset_id", assetId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["task_assets", vars.taskId] }),
  });
}

/* -------------------------- APROVAÇÕES PÚBLICAS -------------------------- */

export function useTaskApprovalRequests(taskId: string | null) {
  return useQuery({
    queryKey: ["social_approvals", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_approval_requests")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SocialApprovalRequest[];
    },
  });
}

export function useCreateApprovalRequest() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      taskId: string;
      clientName?: string;
      clientEmail?: string;
      message?: string;
      expiresInDays?: number;
    }) => {
      if (!tenantId) throw new Error("Workspace ainda carregando");
      const expires_at = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 86400000).toISOString()
        : null;
      const { data, error } = await supabase
        .from("social_approval_requests")
        .insert({
          tenant_id: tenantId,
          task_id: input.taskId,
          client_name: input.clientName ?? null,
          client_email: input.clientEmail ?? null,
          message: input.message ?? null,
          expires_at,
          created_by: user?.id ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as SocialApprovalRequest;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["social_approvals", vars.taskId] });
      toast.success("Link de aprovação criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function buildApprovalUrl(token: string): string {
  return `${window.location.origin}/aprovar-midia/${token}`;
}