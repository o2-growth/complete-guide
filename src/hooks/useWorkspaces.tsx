import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface WorkspaceMembership {
  tenant_id: string;
  role: string;
  tenant: { id: string; name: string; slug: string; primary_color: string | null; logo_url: string | null };
}

export function useMyWorkspaces() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my_workspaces", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_members")
        .select("tenant_id, role, tenants(id, name, slug, primary_color, logo_url)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return ((data ?? []) as Array<{ tenant_id: string; role: string; tenants: { id: string; name: string; slug: string; primary_color: string | null; logo_url: string | null } }>).map(r => ({
        tenant_id: r.tenant_id,
        role: r.role,
        tenant: r.tenants,
      }));
    },
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.rpc("create_workspace", { _name: name });
      if (error) throw error;
      const newTenantId = data as unknown as string;
      // troca atual
      if (user) {
        await supabase
          .from("profiles")
          .update({ preferences: { tenant_id: newTenantId } as never })
          .eq("id", user.id);
      }
      return newTenantId;
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Workspace criado!");
      setTimeout(() => window.location.reload(), 400);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSwitchWorkspace() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tenantId: string) => {
      if (!user) throw new Error("auth");
      const { data: prof } = await supabase.from("profiles").select("preferences").eq("id", user.id).maybeSingle();
      const prefs = (prof?.preferences as Record<string, unknown>) ?? {};
      const next = { ...prefs, tenant_id: tenantId };
      const { error } = await supabase.from("profiles").update({ preferences: next as never }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Workspace ativo");
      setTimeout(() => window.location.reload(), 300);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export function useInvitations(tenantId: string | null) {
  return useQuery({
    queryKey: ["invitations", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Invitation[];
    },
  });
}

export function useSendInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tenantId, email, role }: { tenantId: string; email: string; role: string }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase
        .from("invitations")
        .insert({ tenant_id: tenantId, email: normalizedEmail, role: role as never })
        .select()
        .single();
      if (error) throw error;
      // dispara email (modo best-effort — sem RESEND_API_KEY apenas registra)
      const emailResult = await supabase.functions.invoke("send-invite", { body: { invitation_id: data.id } })
        .catch((err) => {
          toast.warning(`Convite criado, mas e-mail pode não ter sido enviado: ${err?.message ?? "erro desconhecido"}`);
          return null;
        });
      if (emailResult?.data?.status === "dry_run") {
        toast.warning("Convite criado. O envio por e-mail ainda não está configurado; use Copiar link por enquanto.");
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Convite criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invitations").update({ status: "revoked" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invitations"] }),
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc("accept_invitation", { _token: token });
      if (error) throw error;
      return data as unknown as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my_workspaces"] });
      qc.invalidateQueries({ queryKey: ["tenant_members"] });
    },
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ["billing_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_plans")
        .select("*")
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTenantBilling(tenantId: string | null) {
  return useQuery({
    queryKey: ["tenant_billing", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_billing")
        .select("*")
        .eq("tenant_id", tenantId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tenantId, planId }: { tenantId: string; planId: string }) => {
      const { error } = await supabase
        .from("tenant_billing")
        .upsert({ tenant_id: tenantId, plan_id: planId, status: "active", updated_at: new Date().toISOString() }, { onConflict: "tenant_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant_billing"] });
      toast.success("Plano atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
