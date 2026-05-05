import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import type { SocialChannel } from "@/hooks/usePersonas";

export interface Audience {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  persona_ids: string[];
  channels: SocialChannel[];
  size_estimate: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AudienceInput {
  name: string;
  description?: string | null;
  persona_ids?: string[];
  channels?: SocialChannel[];
  size_estimate?: number | null;
}

function normalizeAudience(row: Record<string, unknown>): Audience {
  return {
    id: row.id as string,
    tenant_id: row.tenant_id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    persona_ids: ((row.persona_ids as string[] | null) ?? []) as string[],
    channels: ((row.channels as SocialChannel[] | null) ?? []) as SocialChannel[],
    size_estimate: (row.size_estimate as number | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function useAudiences() {
  const { tenantId, loading } = useWorkspace();
  return useQuery({
    queryKey: ["audiences", tenantId],
    enabled: !loading && !!tenantId,
    queryFn: async (): Promise<Audience[]> => {
      const { data, error } = await supabase
        .from("audiences")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((row) => normalizeAudience(row as unknown as Record<string, unknown>));
    },
  });
}

export function useAudience(id: string | null | undefined) {
  return useQuery({
    queryKey: ["audience", id],
    enabled: !!id,
    queryFn: async (): Promise<Audience | null> => {
      const { data, error } = await supabase
        .from("audiences")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return normalizeAudience(data as unknown as Record<string, unknown>);
    },
  });
}

export function useCreateAudience() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: AudienceInput) => {
      if (!tenantId) throw new Error("Sem workspace");
      const payload = {
        tenant_id: tenantId,
        name: input.name,
        description: input.description ?? null,
        persona_ids: input.persona_ids ?? [],
        channels: input.channels ?? [],
        size_estimate: input.size_estimate ?? null,
      };
      const { error } = await supabase.from("audiences").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["audiences", tenantId] });
      toast.success("Público criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAudience() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<AudienceInput> }) => {
      const { error } = await supabase
        .from("audiences")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["audiences", tenantId] });
      qc.invalidateQueries({ queryKey: ["audience", vars.id] });
      toast.success("Público atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAudience() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("audiences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["audiences", tenantId] });
      toast.success("Público removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
