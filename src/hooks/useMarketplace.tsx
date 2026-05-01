import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";

export function useMarketplaceTemplates(category?: string) {
  return useQuery({
    queryKey: ["marketplace_templates", category ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("marketplace_templates")
        .select("*")
        .eq("is_public", true)
        .order("install_count", { ascending: false });
      if (category) q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInstallTemplate() {
  const { tenantId } = useTenant();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      if (!tenantId) throw new Error("Sem workspace ativo");
      const { data, error } = await supabase.rpc("install_marketplace_template", {
        _template_id: templateId,
        _tenant_id: tenantId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Template instalado no seu workspace");
      qc.invalidateQueries({ queryKey: ["marketplace_templates"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMyMarketplaceInstalls() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ["marketplace_installs", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_installs")
        .select("*, marketplace_templates(name, category)")
        .eq("tenant_id", tenantId!)
        .order("installed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
