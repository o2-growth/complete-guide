import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";

export interface SearchResult {
  kind: "task" | "project" | "comment" | "attachment";
  id: string;
  title: string;
  subtitle: string;
  url: string;
  rank: number;
}

/** Debounced FTS global usando RPC global_search. */
export function useAdvancedSearch(query: string, debounceMs = 250) {
  const { tenantId } = useWorkspace();
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  return useQuery({
    queryKey: ["global-search", tenantId, debounced],
    enabled: !!tenantId && debounced.trim().length >= 2,
    queryFn: async (): Promise<SearchResult[]> => {
      const { data, error } = await supabase.rpc("global_search", {
        _tenant: tenantId!,
        _q: debounced.trim(),
        _limit: 50,
      });
      if (error) throw error;
      return (data ?? []) as SearchResult[];
    },
  });
}

/** Histórico recente de buscas do usuário. */
export function useSearchHistory(limit = 10) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["search-history", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_history")
        .select("id, query, result_count, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRecordSearch() {
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ query, resultCount }: { query: string; resultCount: number }) => {
      if (!user || !tenantId || !query.trim()) return;
      await supabase.from("search_history").insert({
        user_id: user.id,
        tenant_id: tenantId,
        query: query.trim(),
        result_count: resultCount,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["search-history"] }),
  });
}

/** Saved Views: visões salvas pinadas na sidebar pessoal. */
export interface SavedView {
  id: string;
  name: string;
  source: "tasks" | "projects" | "posts" | "comments";
  filters: Record<string, unknown>;
  icon: string | null;
  color: string | null;
  pinned: boolean;
  position: number;
}

export function useSavedViews() {
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["saved-views", user?.id, tenantId],
    enabled: !!user && !!tenantId,
    queryFn: async (): Promise<SavedView[]> => {
      const { data, error } = await supabase
        .from("saved_views")
        .select("*")
        .eq("user_id", user!.id)
        .eq("tenant_id", tenantId!)
        .order("position");
      if (error) throw error;
      return (data ?? []) as SavedView[];
    },
  });
}

export function useCreateSavedView() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: Omit<SavedView, "id" | "position" | "pinned"> & { pinned?: boolean }) => {
      if (!user || !tenantId) throw new Error("no workspace");
      const { data, error } = await supabase
        .from("saved_views")
        .insert({
          user_id: user.id,
          tenant_id: tenantId,
          name: input.name,
          source: input.source,
          filters: input.filters as never,
          icon: input.icon,
          color: input.color,
          pinned: input.pinned ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-views"] }),
  });
}

export function useDeleteSavedView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_views").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-views"] }),
  });
}

/** Agrupa resultados por kind para renderização em seções. */
export function useGroupedResults(results: SearchResult[] | undefined) {
  return useMemo(() => {
    const groups: Record<SearchResult["kind"], SearchResult[]> = {
      task: [], project: [], comment: [], attachment: [],
    };
    (results ?? []).forEach((r) => groups[r.kind].push(r));
    return groups;
  }, [results]);
}