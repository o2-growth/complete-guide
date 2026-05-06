import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { queryProfile } from "@/lib/query-config";

export interface RecentTask {
  id: string;
  title: string;
  status_id: string | null;
  project_id: string | null;
  updated_at: string;
}

/**
 * Últimas tarefas atualizadas no tenant atual — ordem por updated_at desc.
 * Usado pelo Command Palette / Quick Switcher.
 */
export function useRecentTasks(limit = 5) {
  const { tenantId } = useWorkspace();
  return useQuery({
    ...queryProfile("realtime"),
    queryKey: ["recent-tasks", tenantId, limit],
    enabled: !!tenantId,
    queryFn: async (): Promise<RecentTask[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id,title,status_id,project_id,updated_at")
        .eq("tenant_id", tenantId!)
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as RecentTask[];
    },
  });
}
