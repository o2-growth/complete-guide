import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";

export interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  done: boolean;
}

interface OnboardingState {
  dismissed: boolean;
  manual: Record<string, boolean>;
}

const DEFAULT_STATE: OnboardingState = { dismissed: false, manual: {} };

export function useOnboardingChecklist() {
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle();
    const prefs = (profile?.preferences as Record<string, any> | null) ?? {};
    const ob: OnboardingState = prefs.onboarding_v2 ?? DEFAULT_STATE;
    setState(ob);

    // Detect completion via DB
    const [{ count: squadCount }, { count: memberCount }, { count: integCount }, { count: taskCount }, { count: postCount }] = await Promise.all([
      supabase.from("squads").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("squad_members").select("user_id", { count: "exact", head: true }),
      supabase.from("social_integrations").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).not("publish_state", "is", null),
    ]);

    const computed: OnboardingStep[] = [
      {
        key: "squad",
        title: "Crie seu primeiro squad",
        description: "Organize o time em squads (IA, Marketing, Expansão...).",
        cta: "Criar squad",
        href: "/app/squads",
        done: (squadCount ?? 0) > 0,
      },
      {
        key: "invite",
        title: "Convide alguém do time",
        description: "Adicione membros ao squad pra distribuir tarefas.",
        cta: "Convidar",
        href: "/app/squads",
        done: (memberCount ?? 0) > 1,
      },
      {
        key: "task",
        title: "Crie sua primeira tarefa",
        description: "Use o Quick Add (atalho Q) ou clique em Inbox.",
        cta: "Ir para Inbox",
        href: "/app",
        done: (taskCount ?? 0) > 0,
      },
      {
        key: "social",
        title: "Conecte um canal social",
        description: "Instagram, LinkedIn ou Facebook — modo mock funciona sem credenciais.",
        cta: "Integrações",
        href: "/app/configuracoes/integracoes",
        done: (integCount ?? 0) > 0,
      },
      {
        key: "post",
        title: "Agende seu primeiro post",
        description: "Crie uma tarefa de tipo social e agende a publicação.",
        cta: "Calendário editorial",
        href: "/app/social",
        done: (postCount ?? 0) > 0,
      },
      {
        key: "explore_ai",
        title: "Converse com o Copilot IA",
        description: "Faça uma pergunta sobre o estado do seu workspace.",
        cta: "Abrir Copilot",
        href: "/app/copilot",
        done: ob.manual.explore_ai === true,
      },
    ];

    setSteps(computed);
    setLoading(false);
  }, [user, tenantId]);

  useEffect(() => { load(); }, [load]);

  const persist = useCallback(async (next: OnboardingState) => {
    setState(next);
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("preferences").eq("id", user.id).maybeSingle();
    const prefs = (profile?.preferences as Record<string, any> | null) ?? {};
    await supabase.from("profiles").update({ preferences: { ...prefs, onboarding_v2: { ...next } } as any }).eq("id", user.id);
  }, [user]);

  const dismiss = useCallback(() => persist({ ...state, dismissed: true }), [state, persist]);
  const markManual = useCallback((key: string) => persist({ ...state, manual: { ...state.manual, [key]: true } }), [state, persist]);

  const completed = steps.filter(s => s.done).length;
  const total = steps.length;
  const allDone = total > 0 && completed === total;

  return { steps, completed, total, allDone, dismissed: state.dismissed, dismiss, markManual, refresh: load, loading };
}