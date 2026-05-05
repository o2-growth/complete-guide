import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export type SocialChannel =
  | "instagram"
  | "linkedin"
  | "email"
  | "tiktok"
  | "youtube"
  | "x"
  | "whatsapp";

export interface Persona {
  id: string;
  tenant_id: string;
  name: string;
  age_range: string | null;
  occupation: string | null;
  pain_points: string[];
  goals: string[];
  channels: SocialChannel[];
  bio: string | null;
  avatar_url: string | null;
  color: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonaInput {
  name: string;
  age_range?: string | null;
  occupation?: string | null;
  pain_points?: string[];
  goals?: string[];
  channels?: SocialChannel[];
  bio?: string | null;
  avatar_url?: string | null;
  color?: string;
}

function normalizePersona(row: Record<string, unknown>): Persona {
  const pp = row.pain_points;
  const gl = row.goals;
  return {
    id: row.id as string,
    tenant_id: row.tenant_id as string,
    name: row.name as string,
    age_range: (row.age_range as string | null) ?? null,
    occupation: (row.occupation as string | null) ?? null,
    pain_points: Array.isArray(pp) ? (pp as string[]) : [],
    goals: Array.isArray(gl) ? (gl as string[]) : [],
    channels: ((row.channels as SocialChannel[] | null) ?? []) as SocialChannel[],
    bio: (row.bio as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    color: ((row.color as string | null) ?? "#0EA5E9"),
    created_by: (row.created_by as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function usePersonas() {
  const { tenantId, loading } = useWorkspace();
  return useQuery({
    queryKey: ["personas", tenantId],
    enabled: !loading && !!tenantId,
    queryFn: async (): Promise<Persona[]> => {
      const { data, error } = await supabase
        .from("personas")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((row) => normalizePersona(row as unknown as Record<string, unknown>));
    },
  });
}

export function usePersona(id: string | null | undefined) {
  return useQuery({
    queryKey: ["persona", id],
    enabled: !!id,
    queryFn: async (): Promise<Persona | null> => {
      const { data, error } = await supabase
        .from("personas")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return normalizePersona(data as unknown as Record<string, unknown>);
    },
  });
}

export function useCreatePersona() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: PersonaInput) => {
      if (!tenantId) throw new Error("Sem workspace");
      const payload = {
        tenant_id: tenantId,
        name: input.name,
        age_range: input.age_range ?? null,
        occupation: input.occupation ?? null,
        pain_points: input.pain_points ?? [],
        goals: input.goals ?? [],
        channels: input.channels ?? [],
        bio: input.bio ?? null,
        avatar_url: input.avatar_url ?? null,
        color: input.color ?? "#0EA5E9",
      };
      const { error } = await supabase.from("personas").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["personas", tenantId] });
      toast.success("Persona criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePersona() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<PersonaInput> }) => {
      const { error } = await supabase
        .from("personas")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["personas", tenantId] });
      qc.invalidateQueries({ queryKey: ["persona", vars.id] });
      toast.success("Persona atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePersona() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("personas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["personas", tenantId] });
      toast.success("Persona removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
