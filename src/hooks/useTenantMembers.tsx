import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

export interface TenantMember {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export function useTenantMembers() {
  const { tenantId } = useWorkspace();

  return useQuery({
    queryKey: ["tenant_members", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<TenantMember[]> => {
      const { data: memberRows, error: memberErr } = await supabase
        .from("tenant_members")
        .select("user_id")
        .eq("tenant_id", tenantId!);
      if (memberErr) throw memberErr;
      const ids = Array.from(new Set((memberRows ?? []).map((m) => m.user_id)));
      if (!ids.length) return [];
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, display_name, full_name, email, avatar_url")
        .in("id", ids);
      if (profErr) throw profErr;
      return (profiles ?? []) as TenantMember[];
    },
    staleTime: 60_000,
  });
}
