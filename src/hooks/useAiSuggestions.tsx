import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface AiSuggestion {
  id: string;
  tenant_id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  status: "pending" | "applied" | "dismissed" | "snoozed";
  context_url: string | null;
  created_at: string;
}

export function useAiSuggestions(status: AiSuggestion["status"] = "pending") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ai-suggestions", user?.id, status],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_suggestions").select("*")
        .eq("status", status)
        .order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as AiSuggestion[];
    },
  });
}

export function useGenerateSuggestions() {
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("workspace ausente");
      const { data, error } = await supabase.rpc("generate_ai_suggestions", { _tenant: tenantId });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      if (count > 0) toast.success(`${count} nova(s) sugestão(ões)`);
      qc.invalidateQueries({ queryKey: ["ai-suggestions"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao gerar"),
  });
}

export function useApplySuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("apply_ai_suggestion", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-suggestions"] }),
  });
}

export function useDismissSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("dismiss_ai_suggestion", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-suggestions"] }),
  });
}

export interface AiSummary {
  id: string;
  tenant_id: string;
  squad_id: string | null;
  kind: string;
  period_date: string;
  content: string;
  metrics: Record<string, number>;
}

export function useTodaySummary() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["ai-summary-today", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("ai_summaries").select("*")
        .eq("tenant_id", tenantId!).eq("period_date", today)
        .eq("kind", "morning_briefing").is("squad_id", null).maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as AiSummary | null;
    },
  });
}

export function useGenerateDailySummary() {
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("workspace ausente");
      const { data, error } = await supabase.functions.invoke("daily-summary", {
        body: { tenant_id: tenantId, kind: "morning_briefing" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Briefing matinal gerado");
      qc.invalidateQueries({ queryKey: ["ai-summary-today"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha no briefing"),
  });
}