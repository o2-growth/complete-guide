import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TourStep {
  selector: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
}

const STORAGE_KEY = "oxy.guided_tour.v1";

/**
 * Tour guiado — overlay com spotlight no elemento alvo. Persistência local +
 * profiles.preferences.guided_tour_done quando usuário autenticado.
 */
export function useGuidedTour(steps: TourStep[], tourId = "default") {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const localKey = `${STORAGE_KEY}.${tourId}`;
    if (localStorage.getItem(localKey) === "done") return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .maybeSingle();
      const prefs = (data?.preferences ?? {}) as Record<string, unknown>;
      const done = ((prefs.guided_tour_done ?? {}) as Record<string, boolean>)[tourId];
      if (!done) setActive(true);
    })();
  }, [user, tourId]);

  const finish = useCallback(async () => {
    setActive(false);
    setStep(0);
    const localKey = `${STORAGE_KEY}.${tourId}`;
    localStorage.setItem(localKey, "done");
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle();
    const prefs = (data?.preferences ?? {}) as Record<string, unknown>;
    const done = { ...(prefs.guided_tour_done as Record<string, boolean> | undefined ?? {}), [tourId]: true };
    await supabase
      .from("profiles")
      .update({ preferences: { ...prefs, guided_tour_done: done } as never })
      .eq("id", user.id);
  }, [user, tourId]);

  const next = useCallback(() => {
    if (step >= steps.length - 1) finish();
    else setStep(step + 1);
  }, [step, steps.length, finish]);

  const prev = useCallback(() => setStep(Math.max(0, step - 1)), [step]);

  const start = useCallback(() => {
    setStep(0);
    setActive(true);
  }, []);

  return { active, step, current: steps[step], total: steps.length, next, prev, finish, start };
}