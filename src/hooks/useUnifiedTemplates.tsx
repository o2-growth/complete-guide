import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import type { Database, Json } from "@/integrations/supabase/types";

export type TemplateKind =
  | "project"
  | "task_checklist"
  | "message"
  | "form"
  | "brief"
  | "content_caption"
  | "hashtag_group";

export const TEMPLATE_KINDS: TemplateKind[] = [
  "project",
  "task_checklist",
  "message",
  "form",
  "brief",
  "content_caption",
  "hashtag_group",
];

export const TEMPLATE_KIND_LABELS: Record<TemplateKind, string> = {
  project: "Projeto",
  task_checklist: "Checklist",
  message: "Mensagem",
  form: "Formulário",
  brief: "Brief",
  content_caption: "Legenda",
  hashtag_group: "Hashtags",
};

// Body shapes por kind — usados para validação leve no UI.
export interface ChecklistItem {
  text: string;
  required: boolean;
}
export interface MessageVariable {
  key: string;
  default?: string;
}
export interface FormField {
  name: string;
  type: "text" | "textarea" | "select" | "number" | "date";
  required: boolean;
  options?: string[];
}

export type SocialChannelLite =
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "facebook"
  | "youtube"
  | "twitter"
  | "email"
  | "other";

export type TemplateBody =
  | { name: string; description?: string; sections: Array<{ name: string; tasks: unknown[] }> } // project
  | { items: ChecklistItem[] } // task_checklist
  | { subject?: string; body: string; variables?: MessageVariable[] } // message
  | { fields: FormField[] } // form
  | { context: string; target: string; deliverables: string; deadline_template: string } // brief
  | { text: string; channels: SocialChannelLite[] } // content_caption
  | { tags: string[] } // hashtag_group
  | Record<string, unknown>;

export interface UnifiedTemplate {
  id: string;
  tenant_id: string;
  kind: TemplateKind;
  name: string;
  description: string | null;
  body: TemplateBody;
  tags: string[];
  is_pinned: boolean;
  use_count: number;
  last_used_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const QK = "templates-unified";

export function useUnifiedTemplates(filterKind?: TemplateKind) {
  const { tenantId, loading } = useWorkspace();
  return useQuery({
    queryKey: [QK, tenantId, filterKind ?? "all"],
    enabled: !loading && !!tenantId,
    queryFn: async (): Promise<UnifiedTemplate[]> => {
      let q = supabase
        .from("templates_unified")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("is_pinned", { ascending: false })
        .order("use_count", { ascending: false })
        .order("created_at", { ascending: false });
      if (filterKind) q = q.eq("kind", filterKind);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as UnifiedTemplate[];
    },
  });
}

interface CreateInput {
  kind: TemplateKind;
  name: string;
  description?: string | null;
  body: TemplateBody;
  tags?: string[];
  is_pinned?: boolean;
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      if (!tenantId) throw new Error("Workspace não carregado");
      const { data: userRes } = await supabase.auth.getUser();
      const payload = {
        tenant_id: tenantId,
        kind: input.kind,
        name: input.name,
        description: input.description ?? null,
        body: (input.body ?? {}) as unknown as Json,
        tags: input.tags ?? [],
        is_pinned: input.is_pinned ?? false,
        created_by: userRes.user?.id ?? null,
      };
      const { data, error } = await supabase
        .from("templates_unified")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as UnifiedTemplate;
    },
    onSuccess: () => {
      toast.success("Modelo criado");
      qc.invalidateQueries({ queryKey: [QK] });
    },
    onError: (e: Error) => toast.error("Erro ao criar modelo: " + e.message),
  });
}

interface UpdateInput {
  id: string;
  patch: Partial<Pick<UnifiedTemplate, "name" | "description" | "body" | "tags" | "is_pinned">>;
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: UpdateInput) => {
      const { body, ...rest } = patch;
      const dbPatch: Database["public"]["Tables"]["templates_unified"]["Update"] = { ...rest };
      if (body !== undefined) dbPatch.body = body as unknown as Json;
      const { error } = await supabase
        .from("templates_unified")
        .update(dbPatch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Modelo atualizado");
      qc.invalidateQueries({ queryKey: [QK] });
    },
    onError: (e: Error) => toast.error("Erro ao atualizar: " + e.message),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("templates_unified")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Modelo removido");
      qc.invalidateQueries({ queryKey: [QK] });
    },
    onError: (e: Error) => toast.error("Erro ao remover: " + e.message),
  });
}

/**
 * Incrementa use_count + last_used_at no servidor e devolve o body
 * pronto para o consumidor aplicar (checklist, legenda, etc.).
 */
export function useUseTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<TemplateBody> => {
      const { data, error } = await supabase.rpc("use_unified_template", { p_id: id });
      if (error) throw error;
      return (data ?? {}) as unknown as TemplateBody;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
    },
    onError: (e: Error) => toast.error("Erro ao aplicar modelo: " + e.message),
  });
}
