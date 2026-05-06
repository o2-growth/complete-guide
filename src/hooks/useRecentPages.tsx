import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export interface RecentPage {
  path: string;
  visitedAt: number;
}

const LS_KEY = "oxy.recent-pages";
const MAX = 8;

function readLocal(): RecentPage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentPage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p) => p && typeof p.path === "string" && typeof p.visitedAt === "number",
    );
  } catch {
    return [];
  }
}

function writeLocal(pages: RecentPage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(pages));
}

/**
 * Mantém histórico das últimas páginas /app/* visitadas em localStorage.
 * Retorna lista (excluindo a página atual) ordenada da mais recente para a mais antiga.
 */
export function useRecentPages(limit = 5) {
  const { pathname } = useLocation();
  const [pages, setPages] = useState<RecentPage[]>(() => readLocal());

  useEffect(() => {
    if (!pathname.startsWith("/app")) return;
    setPages((prev) => {
      const filtered = prev.filter((p) => p.path !== pathname);
      const next = [{ path: pathname, visitedAt: Date.now() }, ...filtered].slice(
        0,
        MAX,
      );
      writeLocal(next);
      return next;
    });
  }, [pathname]);

  const recents = pages.filter((p) => p.path !== pathname).slice(0, limit);
  return { recents };
}
