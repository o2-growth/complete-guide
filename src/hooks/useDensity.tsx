import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Density = "compact" | "cozy" | "comfortable";

const DENSITY_LS_KEY = "oxy.user-density";
const DENSITY_EVENT = "oxy:user-density-change";
const DEFAULT_DENSITY: Density = "cozy";

function isDensity(v: unknown): v is Density {
  return v === "compact" || v === "cozy" || v === "comfortable";
}

function readLocal(): Density {
  if (typeof window === "undefined") return DEFAULT_DENSITY;
  try {
    const raw = localStorage.getItem(DENSITY_LS_KEY);
    if (isDensity(raw)) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_DENSITY;
}

function writeLocal(value: Density) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DENSITY_LS_KEY, value);
  window.dispatchEvent(new CustomEvent(DENSITY_EVENT));
}

function applyToDocument(value: Density) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-density", value);
}

/**
 * Hook de densidade da interface (compact/cozy/comfortable).
 * - Lê do localStorage no mount (hidrata UI antes do banco responder).
 * - Sincroniza com profiles.preferences.density quando usuário disponível.
 * - Aplica via `data-density` no <html> — CSS vars em src/index.css cuidam do resto.
 */
export function useDensity() {
  const { user } = useAuth();
  const [density, setDensityState] = useState<Density>(() => readLocal());

  // Aplica imediato e mantém em sync entre tabs/instâncias.
  useEffect(() => {
    applyToDocument(density);
  }, [density]);

  useEffect(() => {
    const handler = () => setDensityState(readLocal());
    window.addEventListener(DENSITY_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(DENSITY_EVENT, handler);
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
      if (isDensity(remote.density)) {
        writeLocal(remote.density);
        setDensityState(remote.density);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const setDensity = useCallback(
    async (value: Density) => {
      writeLocal(value);
      setDensityState(value);
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .maybeSingle();
      const remote = (profile?.preferences as Record<string, unknown> | null) ?? {};
      await supabase
        .from("profiles")
        .update({ preferences: { ...remote, density: value } })
        .eq("id", user.id);
    },
    [user],
  );

  return { density, setDensity };
}

/**
 * Bootstrap de densidade — chame uma vez no entry-point para aplicar o valor
 * salvo antes mesmo de qualquer componente montar.
 */
export function bootstrapDensity() {
  applyToDocument(readLocal());
}
