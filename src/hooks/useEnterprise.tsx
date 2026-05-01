import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export interface SsoConfig { id: string; tenant_id: string; provider: "saml"|"oidc"; metadata_url: string | null; entity_id: string | null; domains: string[]; active: boolean; }
export interface ImpersonationSession { id: string; admin_user_id: string; target_user_id: string; tenant_id: string; reason: string; started_at: string; ended_at: string | null; }
export interface ComplianceExport { id: string; tenant_id: string; requested_by: string; kind: "audit"|"soc2"|"gdpr"|"full"; status: string; file_url: string | null; created_at: string; }
export interface TenantEnterprise { id: string; name: string; custom_domain: string | null; white_label: boolean; data_residency: string; sla_tier: "standard"|"premium"|"enterprise"; }

export const useTenantEnterprise = () => {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["tenant-enterprise", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("id,name,custom_domain,white_label,data_residency,sla_tier").eq("id", tenantId!).maybeSingle();
      if (error) throw error;
      return data as TenantEnterprise | null;
    },
  });
};

export const useUpdateTenantEnterprise = () => {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (patch: Partial<TenantEnterprise>) => {
      if (!tenantId) throw new Error("no tenant");
      const { error } = await supabase.from("tenants").update(patch).eq("id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-enterprise"] });
      toast.success("Configurações enterprise atualizadas");
    },
  });
};

export const useSsoConfigs = () => {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["sso-configs", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("sso_configurations").select("*").eq("tenant_id", tenantId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SsoConfig[];
    },
  });
};

export const useCreateSsoConfig = () => {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (payload: { provider: "saml"|"oidc"; metadata_url: string; domains: string[] }) => {
      if (!tenantId) throw new Error("no tenant");
      const { error } = await supabase.from("sso_configurations").insert({ tenant_id: tenantId, ...payload, active: true });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sso-configs"] }); toast.success("SSO configurado"); },
  });
};

export const useImpersonationSessions = () => {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["impersonation-sessions", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("impersonation_sessions").select("*").eq("tenant_id", tenantId!).order("started_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as ImpersonationSession[];
    },
  });
};

export const useComplianceExports = () => {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["compliance-exports", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("compliance_exports").select("*").eq("tenant_id", tenantId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ComplianceExport[];
    },
  });
};

export const useRequestComplianceExport = () => {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async ({ kind }: { kind: "audit"|"soc2"|"gdpr"|"full" }) => {
      if (!tenantId) throw new Error("no tenant");
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("compliance_exports").insert({ tenant_id: tenantId, kind, requested_by: u.user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compliance-exports"] }); toast.success("Solicitação registrada — relatório em processamento"); },
  });
};