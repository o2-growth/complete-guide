import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CONSENT_KINDS = ["terms", "privacy", "marketing", "analytics", "cookies"] as const;
export type ConsentKind = (typeof CONSENT_KINDS)[number];

export function useConsents() {
  return useQuery({
    queryKey: ["privacy_consents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("privacy_consents")
        .select("*")
        .order("granted_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSetConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { kind: ConsentKind; granted: boolean }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const payload = {
        user_id: u.user.id,
        kind: input.kind,
        granted: input.granted,
        user_agent: navigator.userAgent,
        revoked_at: input.granted ? null : new Date().toISOString(),
      };
      const { error } = await supabase.from("privacy_consents").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["privacy_consents"] });
      toast.success("Preferências de privacidade atualizadas");
    },
  });
}

export function usePrivacyRequests() {
  return useQuery({
    queryKey: ["privacy_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("privacy_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useExportPersonalData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("export_my_personal_data");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Seus dados foram exportados");
      qc.invalidateQueries({ queryKey: ["privacy_requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRequestDeletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notes: string) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { error } = await supabase.from("privacy_requests").insert({
        user_id: u.user.id,
        kind: "delete",
        status: "pending",
        notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["privacy_requests"] });
      toast.success("Pedido de exclusão registrado. Nossa equipe processará em até 30 dias.");
    },
  });
}

export const CONSENT_LABELS: Record<ConsentKind, string> = {
  terms: "Termos de uso",
  privacy: "Política de privacidade",
  marketing: "Comunicações de marketing",
  analytics: "Coleta de analytics",
  cookies: "Cookies não-essenciais",
};
