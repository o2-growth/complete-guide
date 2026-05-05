import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface PublicPlan {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: string[];
  cta_label: string | null;
  highlight: boolean;
  position: number;
}

export function usePublicPlans() {
  return useQuery({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_plans_public").select("*").eq("active", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PublicPlan[];
    },
  });
}

export function useConvertLead() {
  return useMutation({
    mutationFn: async (input: { email: string; name?: string; company?: string; plan?: string; source?: string; utm?: Record<string, string> }) => {
      const { data, error } = await supabase.rpc("convert_lead", {
        _email: input.email,
        _name: input.name ?? null,
        _company: input.company ?? null,
        _plan: input.plan ?? null,
        _source: input.source ?? "landing",
        _utm: (input.utm ?? {}) as never,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => toast.success("Recebemos seu contato! 🎉"),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao enviar"),
  });
}

export interface Trial {
  id: string;
  tenant_id: string;
  plan_slug: string;
  started_at: string;
  ends_at: string;
  converted_at: string | null;
}

export function useTrial() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["trial", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_trials").select("*").eq("tenant_id", tenantId!)
        .order("started_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Trial | null;
    },
  });
}

export function useStartTrial() {
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planSlug: string) => {
      if (!tenantId) throw new Error("workspace ausente");
      const { data, error } = await supabase.rpc("start_trial", { _tenant: tenantId, _plan_slug: planSlug });
      if (error) throw error;
      return data as { ok: boolean; reason?: string; ends_at?: string };
    },
    onSuccess: (res) => {
      if (res.ok) toast.success("Trial de 14 dias ativado!");
      else toast.info(res.reason === "trial_already_used" ? "Trial já foi utilizado neste workspace" : "Não foi possível iniciar o trial");
      qc.invalidateQueries({ queryKey: ["trial"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha"),
  });
}

export interface CheckoutSession {
  id: string;
  plan_slug: string;
  billing_cycle: "monthly" | "yearly";
  status: "pending" | "success" | "cancelled" | "expired";
  amount: number | null;
  currency: string;
  stripe_session_id: string | null;
  return_url: string | null;
  created_at: string;
  completed_at: string | null;
}

export function useCreateCheckout() {
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { plan_slug: string; billing_cycle: "monthly" | "yearly"; amount: number }) => {
      const { data, error } = await supabase.from("checkout_sessions").insert({
        tenant_id: tenantId,
        user_id: user?.id ?? null,
        plan_slug: input.plan_slug,
        billing_cycle: input.billing_cycle,
        amount: input.amount,
        currency: "BRL",
        return_url: window.location.origin + "/app/configuracoes/plano",
      }).select().single();
      if (error) throw error;
      return data as unknown as CheckoutSession;
    },
  });
}

export function useMarkCheckoutSuccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checkout_sessions")
        .update({ status: "success", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano ativado.");
      qc.invalidateQueries({ queryKey: ["checkout"] });
    },
  });
}