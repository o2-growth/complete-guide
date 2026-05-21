import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Workspace {
  tenantId: string | null;
  inboxProjectId: string | null;
  loading: boolean;
}

interface WorkspaceFetched {
  tenantId: string | null;
  inboxProjectId: string | null;
}

// React Query compartilha a mesma query entre todos os consumers — evita
// o loop infinito anterior onde cada chamador disparava seu próprio
// `ensure_user_workspace`. Mantém staleTime alto pois preferences raramente mudam.
export function useWorkspace(): Workspace {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["workspace", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 min — preferences são quase imutáveis na sessão
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<WorkspaceFetched> => {
      if (!user) return { tenantId: null, inboxProjectId: null };

      const { data: profile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .maybeSingle();

      const prefs = (profile?.preferences as Record<string, unknown> | null) ?? {};
      let tenantId = (prefs.tenant_id as string | undefined) ?? null;
      let inboxProjectId = (prefs.inbox_project_id as string | undefined) ?? null;

      if (tenantId && inboxProjectId) {
        return { tenantId, inboxProjectId };
      }

      // Self-heal: roda uma vez por sessão por user (cache da react-query cuida disso)
      const { data: rpcProject } = await supabase.rpc("ensure_user_workspace", {
        _user_id: user.id,
      });
      if (rpcProject) inboxProjectId = rpcProject as string;

      const { data: refreshed } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .maybeSingle();
      const np = (refreshed?.preferences as Record<string, unknown> | null) ?? {};
      tenantId = (np.tenant_id as string | undefined) ?? tenantId;
      inboxProjectId = (np.inbox_project_id as string | undefined) ?? inboxProjectId;

      return { tenantId, inboxProjectId };
    },
  });

  if (!user) {
    return { tenantId: null, inboxProjectId: null, loading: false };
  }

  return {
    tenantId: query.data?.tenantId ?? null,
    inboxProjectId: query.data?.inboxProjectId ?? null,
    loading: query.isLoading,
  };
}
