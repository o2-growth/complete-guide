import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

export interface SidebarPrefs {
  favorites: string[];
  collapsedGroups: string[];
  customOrder: Record<string, string[]>;
}

const DEFAULT_PREFS: SidebarPrefs = {
  favorites: [],
  collapsedGroups: [
    "midias-sociais",
    "insights-avancados",
    "atendimento",
    "conhecimento",
    "enterprise",
    "developer",
    "gamificacao",
    "marketplace",
  ],
  customOrder: {},
};

const LS_KEY = "oxy.sidebar-prefs";
const EVENT = "oxy:sidebar-prefs-change";

function readLocal(): Partial<SidebarPrefs> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<SidebarPrefs>;
  } catch {
    return {};
  }
}

function writeLocal(prefs: SidebarPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent(EVENT));
}

function normalize(remote: unknown): SidebarPrefs {
  const r = (remote as Record<string, unknown>) ?? {};
  return {
    favorites: Array.isArray(r.favorites) ? (r.favorites as string[]) : [],
    collapsedGroups: Array.isArray(r.collapsedGroups)
      ? (r.collapsedGroups as string[])
      : DEFAULT_PREFS.collapsedGroups,
    customOrder:
      r.customOrder && typeof r.customOrder === "object"
        ? (r.customOrder as Record<string, string[]>)
        : {},
  };
}

/**
 * Lê e escreve preferências da sidebar (favoritos, grupos colapsados, ordem custom).
 * Cache local imediato + persistência em profiles.preferences.sidebar.
 */
export function useSidebarPrefs() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<SidebarPrefs>(() => ({
    ...DEFAULT_PREFS,
    ...readLocal(),
  }));
  // Cache do objeto preferences completo do usuário. Evita o ciclo
  // read-modify-write a cada toggle, que perdia atualizações concorrentes.
  // Permanece null até o primeiro fetch completar.
  const remotePrefsRef = useRef<Record<string, Json> | null>(null);

  useEffect(() => {
    const handler = () => setPrefs({ ...DEFAULT_PREFS, ...readLocal() });
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

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
      const remote = (data?.preferences as Record<string, Json> | null) ?? {};
      remotePrefsRef.current = remote;
      const sidebar = remote.sidebar;
      if (sidebar) {
        const next = normalize(sidebar);
        writeLocal(next);
        setPrefs(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const persist = useCallback(
    async (next: SidebarPrefs) => {
      writeLocal(next);
      setPrefs(next);
      if (!user) return;
      // Se o fetch inicial ainda não populou o cache, busca uma única vez.
      if (remotePrefsRef.current === null) {
        const { data } = await supabase
          .from("profiles")
          .select("preferences")
          .eq("id", user.id)
          .maybeSingle();
        remotePrefsRef.current = (data?.preferences as Record<string, Json> | null) ?? {};
      }
      const merged: Record<string, Json> = {
        ...remotePrefsRef.current,
        sidebar: next as unknown as Json,
      };
      remotePrefsRef.current = merged;
      await supabase
        .from("profiles")
        .update({ preferences: merged as Json })
        .eq("id", user.id);
    },
    [user],
  );

  const toggleFavorite = useCallback(
    (path: string) => {
      const exists = prefs.favorites.includes(path);
      const favorites = exists
        ? prefs.favorites.filter((p) => p !== path)
        : [...prefs.favorites, path];
      void persist({ ...prefs, favorites });
    },
    [prefs, persist],
  );

  const toggleGroupCollapsed = useCallback(
    (groupId: string) => {
      const exists = prefs.collapsedGroups.includes(groupId);
      const collapsedGroups = exists
        ? prefs.collapsedGroups.filter((g) => g !== groupId)
        : [...prefs.collapsedGroups, groupId];
      void persist({ ...prefs, collapsedGroups });
    },
    [prefs, persist],
  );

  const reorderItems = useCallback(
    (groupId: string, order: string[]) => {
      void persist({
        ...prefs,
        customOrder: { ...prefs.customOrder, [groupId]: order },
      });
    },
    [prefs, persist],
  );

  const isFavorite = useCallback(
    (path: string) => prefs.favorites.includes(path),
    [prefs.favorites],
  );

  const isGroupCollapsed = useCallback(
    (groupId: string) => prefs.collapsedGroups.includes(groupId),
    [prefs.collapsedGroups],
  );

  return {
    favorites: prefs.favorites,
    collapsedGroups: prefs.collapsedGroups,
    customOrder: prefs.customOrder,
    toggleFavorite,
    toggleGroupCollapsed,
    reorderItems,
    isFavorite,
    isGroupCollapsed,
  };
}
