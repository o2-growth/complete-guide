import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface WorkspaceState {
  tenantId: string | null;
  tenantName: string | null;
  role: string | null;
  loading: boolean;
}

export function useWorkspace(): WorkspaceState {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["workspace", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!user) return null;
      const { data: members } = await supabase
        .from("tenant_members")
        .select("tenant_id, role, tenants(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);
      if (members && members.length > 0) {
        const m = members[0] as { tenant_id: string; role: string; tenants: { name: string } | null };
        return { tenant_id: m.tenant_id, role: m.role, name: m.tenants?.name ?? null };
      }
      const { data: tid } = await (supabase.rpc as never as (n: string, a: Record<string, unknown>) => Promise<{ data: string | null }>)("ensure_user_workspace", { _user_id: user.id });
      if (!tid) return null;
      const { data: t } = await supabase.from("tenants").select("name").eq("id", tid).maybeSingle();
      return { tenant_id: tid, role: "admin", name: t?.name ?? null };
    },
  });
  return {
    tenantId: q.data?.tenant_id ?? null,
    tenantName: q.data?.name ?? null,
    role: q.data?.role ?? null,
    loading: !!user && q.isLoading,
  };
}