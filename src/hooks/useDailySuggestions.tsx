import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { queryProfile } from "@/lib/query-config";

export interface DailyRecommendation {
  task_id: string;
  title: string;
  reason: string;
}

export interface DailySuggestionsPayload {
  recommendations: DailyRecommendation[];
  pattern: string;
  generated_at: string;
}

/**
 * Consome a Edge Function `ai-suggest-daily` (deploy via Lovable Cloud).
 * Cache: profile `analytics` (5min stale). Erros são propagados — o
 * componente consumidor decide o fallback amigável.
 */
export function useDailySuggestions() {
  const { user } = useAuth();
  const { tenantId, loading: wsLoading } = useWorkspace();

  return useQuery<DailySuggestionsPayload>({
    ...queryProfile("analytics"),
    queryKey: ["ai-suggest-daily", tenantId, user?.id],
    enabled: !wsLoading && !!tenantId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-suggest-daily", {
        body: { tenant_id: tenantId, user_id: user!.id },
      });
      if (error) throw error;
      return data as DailySuggestionsPayload;
    },
  });
}
