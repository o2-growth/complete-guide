import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

/** Garante espaços padrão (Banco de Projetos, IA, Expansão) no tenant atual. */
export function useSeedClickUpSpaces() {
  const { tenantId, loading } = useWorkspace();

  useQuery({
    queryKey: ["seed-clickup-spaces", tenantId],
    enabled: !loading && !!tenantId,
    staleTime: Infinity,
    queryFn: async () => {
      const { error } = await supabase.rpc("seed_clickup_spaces", {
        _tenant_id: tenantId!,
      });
      if (error) throw error;
      return true;
    },
  });
}
