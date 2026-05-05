import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

type CustomFieldDefinitionInsert = Database["public"]["Tables"]["custom_field_definitions"]["Insert"];
type CustomFieldDefinitionUpdate = Database["public"]["Tables"]["custom_field_definitions"]["Update"];
type TaskCustomFieldValueInsert = Database["public"]["Tables"]["task_custom_field_values"]["Insert"];

// ----------------------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------------------

export const CUSTOM_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "datetime",
  "select",
  "multi_select",
  "checkbox",
  "url",
  "email",
  "phone",
  "currency",
  "rating",
  "user",
  "tag",
  "file",
  "formula",
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];
export type CustomFieldScope = "global" | "task_type" | "project";

export interface CustomFieldOption {
  value: string;
  label: string;
}

export interface CustomFieldDefinition {
  id: string;
  tenant_id: string;
  scope: CustomFieldScope;
  task_type_id: string | null;
  project_id: string | null;
  key: string;
  label: string;
  field_type: CustomFieldType;
  options: CustomFieldOption[];
  required: boolean;
  default_value: unknown;
  position: number;
  help_text: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  task_id: string;
  field_definition_id: string;
  value: unknown;
  updated_at: string;
}

export interface CustomFieldDefinitionInput {
  scope: CustomFieldScope;
  task_type_id?: string | null;
  project_id?: string | null;
  key: string;
  label: string;
  field_type: CustomFieldType;
  options?: CustomFieldOption[];
  required?: boolean;
  default_value?: unknown;
  position?: number;
  help_text?: string | null;
  is_active?: boolean;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function normalizeDefinition(row: Record<string, unknown>): CustomFieldDefinition {
  const opts = row.options;
  let options: CustomFieldOption[] = [];
  if (Array.isArray(opts)) {
    options = (opts as unknown[]).map((o) => {
      if (typeof o === "string") return { value: o, label: o };
      const obj = o as Record<string, unknown>;
      return {
        value: String(obj.value ?? ""),
        label: String(obj.label ?? obj.value ?? ""),
      };
    });
  }
  return {
    id: row.id as string,
    tenant_id: row.tenant_id as string,
    scope: row.scope as CustomFieldScope,
    task_type_id: (row.task_type_id as string | null) ?? null,
    project_id: (row.project_id as string | null) ?? null,
    key: row.key as string,
    label: row.label as string,
    field_type: row.field_type as CustomFieldType,
    options,
    required: Boolean(row.required),
    default_value: row.default_value ?? null,
    position: (row.position as number) ?? 0,
    help_text: (row.help_text as string | null) ?? null,
    is_active: row.is_active !== false,
    created_by: (row.created_by as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// ----------------------------------------------------------------------------
// Listagem de definitions
// ----------------------------------------------------------------------------

interface ListParams {
  scope?: CustomFieldScope;
  task_type_id?: string | null;
  project_id?: string | null;
  enabled?: boolean;
}

export function useCustomFieldDefinitions(params: ListParams = {}) {
  const { tenantId, loading } = useWorkspace();
  const { scope, task_type_id, project_id, enabled = true } = params;

  return useQuery({
    queryKey: ["custom-field-definitions", tenantId, scope ?? "all", task_type_id ?? null, project_id ?? null],
    enabled: enabled && !loading && !!tenantId,
    queryFn: async (): Promise<CustomFieldDefinition[]> => {
      let q = supabase
        .from("custom_field_definitions")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("is_active", true)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });

      if (scope) q = q.eq("scope", scope);
      if (task_type_id !== undefined) {
        q = task_type_id === null ? q.is("task_type_id", null) : q.eq("task_type_id", task_type_id);
      }
      if (project_id !== undefined) {
        q = project_id === null ? q.is("project_id", null) : q.eq("project_id", project_id);
      }

      const { data, error } = await q;
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(normalizeDefinition);
    },
  });
}

// ----------------------------------------------------------------------------
// Definitions + values aplicáveis a uma task
// ----------------------------------------------------------------------------

export interface ResolvedCustomField {
  definition: CustomFieldDefinition;
  value: unknown;
}

export function useCustomFieldsForTask(
  taskId: string | null | undefined,
  taskTypeId: string | null | undefined,
  projectId: string | null | undefined,
) {
  const { tenantId, loading } = useWorkspace();

  const definitionsQ = useQuery({
    queryKey: ["custom-field-definitions-for-task", tenantId, taskTypeId ?? null, projectId ?? null],
    enabled: !loading && !!tenantId,
    queryFn: async (): Promise<CustomFieldDefinition[]> => {
      const { data, error } = await supabase
        .from("custom_field_definitions")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("is_active", true)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      const all = ((data ?? []) as Record<string, unknown>[]).map(normalizeDefinition);
      return all.filter((def) => {
        if (def.scope === "global") return true;
        if (def.scope === "task_type") return def.task_type_id && def.task_type_id === taskTypeId;
        if (def.scope === "project") return def.project_id && def.project_id === projectId;
        return false;
      });
    },
  });

  const valuesQ = useQuery({
    queryKey: ["custom-field-values", taskId],
    enabled: !!taskId,
    queryFn: async (): Promise<CustomFieldValue[]> => {
      const { data, error } = await supabase
        .from("task_custom_field_values")
        .select("*")
        .eq("task_id", taskId!);
      if (error) throw error;
      return (data ?? []) as CustomFieldValue[];
    },
  });

  const fields = useMemo<ResolvedCustomField[]>(() => {
    const defs = definitionsQ.data ?? [];
    const values = valuesQ.data ?? [];
    const map = new Map(values.map((v) => [v.field_definition_id, v.value]));
    return defs.map((definition) => ({
      definition,
      value: map.has(definition.id) ? map.get(definition.id) : definition.default_value,
    }));
  }, [definitionsQ.data, valuesQ.data]);

  return {
    fields,
    isLoading: definitionsQ.isLoading || valuesQ.isLoading,
    error: definitionsQ.error || valuesQ.error,
  };
}

// ----------------------------------------------------------------------------
// Mutations — definitions
// ----------------------------------------------------------------------------

export function useCreateFieldDefinition() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CustomFieldDefinitionInput) => {
      if (!tenantId) throw new Error("Workspace não pronto");
      const payload: CustomFieldDefinitionInsert = {
        tenant_id: tenantId,
        scope: input.scope,
        task_type_id: input.scope === "task_type" ? input.task_type_id ?? null : null,
        project_id: input.scope === "project" ? input.project_id ?? null : null,
        key: input.key,
        label: input.label,
        field_type: input.field_type,
        // Cast: CustomFieldOption[]/unknown -> Json (parser de domínio na leitura).
        options: (input.options ?? []) as unknown as CustomFieldDefinitionInsert["options"],
        required: input.required ?? false,
        default_value: (input.default_value ?? null) as CustomFieldDefinitionInsert["default_value"],
        position: input.position ?? 0,
        help_text: input.help_text ?? null,
        is_active: input.is_active ?? true,
        created_by: user?.id ?? null,
      };
      const { data, error } = await supabase
        .from("custom_field_definitions")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Campo criado");
      qc.invalidateQueries({ queryKey: ["custom-field-definitions"] });
      qc.invalidateQueries({ queryKey: ["custom-field-definitions-for-task"] });
    },
    onError: (e: Error) => toast.error("Erro ao criar campo: " + e.message),
  });
}

export function useUpdateFieldDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<CustomFieldDefinitionInput>;
    }) => {
      const safePatch: CustomFieldDefinitionUpdate = { ...patch } as unknown as CustomFieldDefinitionUpdate;
      if ("options" in safePatch) {
        safePatch.options = (safePatch.options ?? []) as CustomFieldDefinitionUpdate["options"];
      }
      const { error } = await supabase.from("custom_field_definitions").update(safePatch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campo atualizado");
      qc.invalidateQueries({ queryKey: ["custom-field-definitions"] });
      qc.invalidateQueries({ queryKey: ["custom-field-definitions-for-task"] });
    },
    onError: (e: Error) => toast.error("Erro ao atualizar: " + e.message),
  });
}

export function useDeleteFieldDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_field_definitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campo removido");
      qc.invalidateQueries({ queryKey: ["custom-field-definitions"] });
      qc.invalidateQueries({ queryKey: ["custom-field-definitions-for-task"] });
    },
    onError: (e: Error) => toast.error("Erro ao remover: " + e.message),
  });
}

export function useReorderFieldDefinitions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<{ id: string; position: number }>) => {
      // Sem RPC: faz N updates em paralelo (lista é pequena, OK)
      await Promise.all(
        items.map((it) =>
          supabase.from("custom_field_definitions").update({ position: it.position }).eq("id", it.id),
        ),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-field-definitions"] });
      qc.invalidateQueries({ queryKey: ["custom-field-definitions-for-task"] });
    },
    onError: (e: Error) => toast.error("Erro ao reordenar: " + e.message),
  });
}

// ----------------------------------------------------------------------------
// Mutations — values
// ----------------------------------------------------------------------------

export function useUpsertFieldValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      definitionId,
      value,
    }: {
      taskId: string;
      definitionId: string;
      value: unknown;
    }) => {
      // null/undefined/string vazia → deleta o registro
      const isEmpty =
        value === null ||
        value === undefined ||
        (typeof value === "string" && value === "") ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        const { error } = await supabase
          .from("task_custom_field_values")
          .delete()
          .eq("task_id", taskId)
          .eq("field_definition_id", definitionId);
        if (error) throw error;
        return;
      }

      const upsertPayload: TaskCustomFieldValueInsert = {
        task_id: taskId,
        field_definition_id: definitionId,
        // Cast: valor de domínio (unknown) -> Json (parser na leitura).
        value: value as TaskCustomFieldValueInsert["value"],
      };
      const { error } = await supabase
        .from("task_custom_field_values")
        .upsert(upsertPayload, { onConflict: "task_id,field_definition_id" });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["custom-field-values", vars.taskId] });
    },
    onError: (e: Error) => toast.error("Erro ao salvar campo: " + e.message),
  });
}
