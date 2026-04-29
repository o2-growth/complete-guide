import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Workspace {
  tenantId: string | null;
  inboxProjectId: string | null;
  loading: boolean;
}

export function useWorkspace(): Workspace {
  const { user } = useAuth();
  const [state, setState] = useState<Workspace>({
    tenantId: null,
    inboxProjectId: null,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setState({ tenantId: null, inboxProjectId: null, loading: false });
      return;
    }

    let cancelled = false;

    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .maybeSingle();

      const prefs = (profile?.preferences as Record<string, unknown> | null) ?? {};
      let tenantId = (prefs.tenant_id as string | undefined) ?? null;
      let inboxProjectId = (prefs.inbox_project_id as string | undefined) ?? null;

      // Self-heal: se faltar, chama a função do banco
      if (!tenantId || !inboxProjectId) {
        const { data } = await supabase.rpc("ensure_user_workspace", { _user_id: user.id });
        if (data) {
          inboxProjectId = data as string;
          const { data: refreshed } = await supabase
            .from("profiles")
            .select("preferences")
            .eq("id", user.id)
            .maybeSingle();
          const np = (refreshed?.preferences as Record<string, unknown> | null) ?? {};
          tenantId = (np.tenant_id as string | undefined) ?? tenantId;
          inboxProjectId = (np.inbox_project_id as string | undefined) ?? inboxProjectId;
        }
      }

      if (!cancelled) {
        setState({ tenantId, inboxProjectId, loading: false });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return state;
}