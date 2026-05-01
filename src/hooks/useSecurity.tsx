import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export function useSecurityAudit(limit = 50) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["security_audit", tenantId, limit],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_audit")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLogSecurityEvent() {
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { event: string; severity?: string; metadata?: Record<string, unknown> }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      await supabase.from("security_audit").insert({
        tenant_id: tenantId,
        user_id: user.user.id,
        event: input.event,
        severity: input.severity ?? "info",
        user_agent: navigator.userAgent,
        metadata: (input.metadata ?? {}) as never,
      });
    },
  });
}

export function useMfaFactors() {
  return useQuery({
    queryKey: ["mfa_factors"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data;
    },
  });
}

export function useEnrollTotp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendlyName: string) => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mfa_factors"] }),
  });
}

export function useVerifyTotp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { factorId: string; code: string }) => {
      const ch = await supabase.auth.mfa.challenge({ factorId: input.factorId });
      if (ch.error) throw ch.error;
      const v = await supabase.auth.mfa.verify({
        factorId: input.factorId,
        challengeId: ch.data.id,
        code: input.code,
      });
      if (v.error) throw v.error;
      return v.data;
    },
    onSuccess: () => {
      toast.success("2FA ativado");
      qc.invalidateQueries({ queryKey: ["mfa_factors"] });
    },
  });
}

export function useUnenrollTotp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (factorId: string) => {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("2FA removido");
      qc.invalidateQueries({ queryKey: ["mfa_factors"] });
    },
  });
}
