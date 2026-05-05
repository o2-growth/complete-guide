import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type DueAtFormat = "absolute" | "countdown";

export interface UserPreferences {
  due_at_format: DueAtFormat;
}

const DEFAULT_PREFS: UserPreferences = {
  due_at_format: "absolute",
};

const LS_KEY = "oxy.user-prefs";
const EVENT = "oxy:user-prefs-change";

function readLocal(): Partial<UserPreferences> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<UserPreferences>;
  } catch {
    return {};
  }
}

function writeLocal(prefs: Partial<UserPreferences>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent(EVENT));
}

/**
 * Lê e escreve preferências do usuário (cache local + persistência em profiles.preferences).
 * Cache local: lê instantâneo sem hit no banco; refresh em background.
 * Mudanças disparam evento global para outros componentes re-renderizarem.
 */
export function usePreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(() => ({
    ...DEFAULT_PREFS,
    ...readLocal(),
  }));

  // Sincroniza entre tabs/componentes.
  useEffect(() => {
    const handler = () => setPrefs({ ...DEFAULT_PREFS, ...readLocal() });
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // Hidrata do servidor.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const remote = (data?.preferences as Record<string, unknown> | null) ?? {};
      const next: UserPreferences = {
        due_at_format:
          remote.due_at_format === "countdown" ? "countdown" : "absolute",
      };
      writeLocal(next);
      setPrefs(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const update = useCallback(
    async (patch: Partial<UserPreferences>) => {
      const next = { ...prefs, ...patch };
      writeLocal(next);
      setPrefs(next);
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .maybeSingle();
      const remote = (profile?.preferences as Record<string, unknown> | null) ?? {};
      await supabase
        .from("profiles")
        .update({ preferences: { ...remote, ...patch } })
        .eq("id", user.id);
    },
    [prefs, user],
  );

  return { ...prefs, update };
}
