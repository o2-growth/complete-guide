import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { queryProfile } from "@/lib/query-config";
import { toast } from "sonner";

type DashboardUpdate = Database["public"]["Tables"]["dashboards"]["Update"];
type DashboardWidgetInsert = Database["public"]["Tables"]["dashboard_widgets"]["Insert"];
type DashboardWidgetUpdate = Database["public"]["Tables"]["dashboard_widgets"]["Update"];

/**
 * Sub-fase 7F — Dashboards customizáveis.
 */

export type WidgetKind =
  | "kpi"
  | "chart_bar"
  | "chart_line"
  | "chart_donut"
  | "task_list"
  | "calendar_mini"
  | "timesheet_snippet"
  | "recent_activity"
  | "goals_progress"
  | "workload_heatmap"
  | "embed"
  | "markdown";

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  kind: WidgetKind;
  title: string;
  config: Record<string, unknown>;
  position: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  layout: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardWithWidgets extends Dashboard {
  widgets: DashboardWidget[];
}

export function useDashboards() {
  const { tenantId } = useWorkspace();
  return useQuery({
    ...queryProfile("structural"),
    queryKey: ["dashboards", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<Dashboard[]> => {
      const { data, error } = await supabase
        .from("dashboards")
        .select("id,tenant_id,name,description,is_public,layout,created_by,created_at,updated_at")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Dashboard[];
    },
  });
}

export function useDashboard(id: string | null | undefined) {
  const { tenantId } = useWorkspace();
  return useQuery({
    ...queryProfile("structural"),
    queryKey: ["dashboard", id],
    enabled: !!id && !!tenantId,
    queryFn: async (): Promise<DashboardWithWidgets | null> => {
      if (!id) return null;
      const { data: dash, error: e1 } = await supabase
        .from("dashboards")
        .select("id,tenant_id,name,description,is_public,layout,created_by,created_at,updated_at")
        .eq("id", id)
        .maybeSingle();
      if (e1) throw e1;
      if (!dash) return null;
      const { data: ws, error: e2 } = await supabase
        .from("dashboard_widgets")
        .select("id,dashboard_id,kind,title,config,position,width,height,created_at,updated_at")
        .eq("dashboard_id", id)
        .order("position", { ascending: true });
      if (e2) throw e2;
      return {
        ...(dash as Dashboard),
        widgets: (ws ?? []).map((w) => ({
          ...(w as unknown as DashboardWidget),
          // Cast: parser JSON -> Record<string, unknown> de domínio.
          config: (w.config ?? {}) as Record<string, unknown>,
        })),
      };
    },
  });
}

export function useCreateDashboard() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string | null }) => {
      if (!tenantId) throw new Error("Tenant não carregado");
      const { data, error } = await supabase
        .from("dashboards")
        .insert({
          tenant_id: tenantId,
          name: input.name,
          description: input.description ?? null,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboards"] });
      toast.success("Dashboard criado");
    },
    onError: (e: Error) => toast.error(`Erro ao criar dashboard: ${e.message}`),
  });
}

export function useUpdateDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string | null;
      is_public?: boolean;
    }) => {
      const patch: DashboardUpdate = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.description !== undefined) patch.description = input.description;
      if (input.is_public !== undefined) patch.is_public = input.is_public;
      const { error } = await supabase.from("dashboards").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["dashboards"] });
      qc.invalidateQueries({ queryKey: ["dashboard", vars.id] });
      toast.success("Dashboard atualizado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dashboards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboards"] });
      toast.success("Dashboard removido");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useAddWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      dashboard_id: string;
      kind: WidgetKind;
      title: string;
      config?: Record<string, unknown>;
      width?: number;
      height?: number;
      position?: number;
    }) => {
      const insertPayload: DashboardWidgetInsert = {
        dashboard_id: input.dashboard_id,
        kind: input.kind,
        title: input.title,
        // Cast: Record<string, unknown> de domínio -> Json.
        config: (input.config ?? {}) as DashboardWidgetInsert["config"],
        width: input.width ?? 1,
        height: input.height ?? 1,
        position: input.position ?? 0,
      };
      const { data, error } = await supabase
        .from("dashboard_widgets")
        .insert(insertPayload)
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["dashboard", vars.dashboard_id] });
      toast.success("Widget adicionado");
    },
    onError: (e: Error) => toast.error(`Erro ao adicionar widget: ${e.message}`),
  });
}

export function useUpdateWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      dashboard_id: string;
      title?: string;
      config?: Record<string, unknown>;
      width?: number;
      height?: number;
      position?: number;
    }) => {
      const patch: DashboardWidgetUpdate = {};
      if (input.title !== undefined) patch.title = input.title;
      // Cast: Record<string, unknown> de domínio -> Json.
      if (input.config !== undefined) patch.config = input.config as DashboardWidgetUpdate["config"];
      if (input.width !== undefined) patch.width = input.width;
      if (input.height !== undefined) patch.height = input.height;
      if (input.position !== undefined) patch.position = input.position;
      const { error } = await supabase.from("dashboard_widgets").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["dashboard", vars.dashboard_id] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useRemoveWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; dashboard_id: string }) => {
      const { error } = await supabase.from("dashboard_widgets").delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["dashboard", vars.dashboard_id] });
      toast.success("Widget removido");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useReorderWidgets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      dashboard_id: string;
      order: Array<{ id: string; position: number }>;
    }) => {
      // Update sequencial; volume é baixo (≤ ~30 widgets por dashboard).
      for (const w of input.order) {
        const { error } = await supabase
          .from("dashboard_widgets")
          .update({ position: w.position })
          .eq("id", w.id);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["dashboard", vars.dashboard_id] });
    },
    onError: (e: Error) => toast.error(`Erro ao reordenar: ${e.message}`),
  });
}
