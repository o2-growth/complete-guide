import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { queryProfile } from "@/lib/query-config";
import { toast } from "sonner";

type WhiteboardRow = Database["public"]["Tables"]["whiteboards"]["Row"];
type WhiteboardUpdate = Database["public"]["Tables"]["whiteboards"]["Update"];

// Snapshot lib-agnostic; valores vindos do Excalidraw vivem aqui como JSON puro.
export interface WhiteboardSnapshot {
  elements: unknown[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
}

export interface Whiteboard {
  id: string;
  tenant_id: string;
  project_id: string | null;
  task_id: string | null;
  name: string;
  description: string | null;
  snapshot: WhiteboardSnapshot;
  thumbnail_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const EMPTY_SNAPSHOT: WhiteboardSnapshot = { elements: [], appState: {}, files: {} };

export function useWhiteboards(filter?: { taskId?: string | null; projectId?: string | null }) {
  const { tenantId } = useWorkspace();
  return useQuery({
    ...queryProfile("structural"),
    queryKey: ["whiteboards", tenantId, filter?.taskId ?? null, filter?.projectId ?? null],
    enabled: !!tenantId,
    queryFn: async (): Promise<Whiteboard[]> => {
      let q = supabase
        .from("whiteboards")
        .select("id,tenant_id,project_id,task_id,name,description,thumbnail_url,created_by,created_at,updated_at")
        .eq("tenant_id", tenantId!)
        .order("updated_at", { ascending: false });
      if (filter?.taskId) q = q.eq("task_id", filter.taskId);
      if (filter?.projectId) q = q.eq("project_id", filter.projectId);
      const { data, error } = await q;
      if (error) throw error;
      // Lista não traz snapshot pra evitar tráfego pesado; preencher vazio.
      return (data ?? []).map((row) => ({
        ...row,
        snapshot: EMPTY_SNAPSHOT,
      }));
    },
  });
}

export function useWhiteboard(id: string | null | undefined) {
  const { tenantId } = useWorkspace();
  return useQuery({
    ...queryProfile("workload"),
    queryKey: ["whiteboard", tenantId, id],
    enabled: !!tenantId && !!id,
    queryFn: async (): Promise<Whiteboard | null> => {
      const { data, error } = await supabase
        .from("whiteboards")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row: WhiteboardRow = data;
      // Cast: parser JSON -> tipo de domínio. Snapshot pode vir null/parcial.
      const raw = (row.snapshot ?? {}) as Partial<WhiteboardSnapshot>;
      return {
        ...row,
        snapshot: {
          elements: Array.isArray(raw.elements) ? raw.elements : [],
          appState: (raw.appState ?? {}) as Record<string, unknown>,
          files: (raw.files ?? {}) as Record<string, unknown>,
        },
      };
    },
  });
}

export function useCreateWhiteboard() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string | null;
      projectId?: string | null;
      taskId?: string | null;
    }) => {
      if (!tenantId) throw new Error("Sem workspace");
      if (!user) throw new Error("Sem sessão");
      const trimmed = input.name.trim() || "Sem título";
      const { data, error } = await supabase
        .from("whiteboards")
        .insert([
          {
            tenant_id: tenantId,
            project_id: input.projectId ?? null,
            task_id: input.taskId ?? null,
            name: trimmed,
            description: input.description ?? null,
            // Cast: WhiteboardSnapshot (domínio) -> Json.
            snapshot: EMPTY_SNAPSHOT as unknown as WhiteboardUpdate["snapshot"],
            created_by: user.id,
          },
        ])
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as Whiteboard;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["whiteboards", tenantId] });
      if (vars.taskId) {
        qc.invalidateQueries({ queryKey: ["whiteboards", tenantId, vars.taskId] });
      }
      toast.success("Whiteboard criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateWhiteboardSnapshot() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      snapshot: WhiteboardSnapshot;
      name?: string;
    }) => {
      const patch: WhiteboardUpdate = {
        // Cast: WhiteboardSnapshot (domínio) -> Json.
        snapshot: input.snapshot as unknown as WhiteboardUpdate["snapshot"],
      };
      if (typeof input.name === "string") patch.name = input.name.trim() || "Sem título";
      const { error } = await supabase.from("whiteboards").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["whiteboard", tenantId, vars.id] });
      qc.invalidateQueries({ queryKey: ["whiteboards", tenantId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Mapa task_id -> qty whiteboards. Uma única query por workspace, partilhada entre todos os
// TaskRow via cache do React Query — evita N requisições.
export function useWhiteboardTaskIndex() {
  const { tenantId } = useWorkspace();
  return useQuery({
    ...queryProfile("structural"),
    queryKey: ["whiteboards-task-index", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from("whiteboards")
        .select("task_id")
        .eq("tenant_id", tenantId!)
        .not("task_id", "is", null);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        if (row.task_id) map[row.task_id] = (map[row.task_id] ?? 0) + 1;
      }
      return map;
    },
  });
}

export function useDeleteWhiteboard() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("whiteboards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whiteboards", tenantId] });
      toast.success("Whiteboard excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
