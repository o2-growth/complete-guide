import type { QueryClientConfig } from "@tanstack/react-query";

/**
 * Profiles de caching por categoria de dado. Use sempre que possível em vez de
 * deixar useQuery sem opções (defaults v5: staleTime=0 → refetch agressivo).
 */
export const QUERY_PROFILES = {
  // dados estáticos / quase imutáveis (catálogos, plans, task_types)
  static: { staleTime: 60 * 60 * 1000, gcTime: 24 * 60 * 60 * 1000 },
  // dados estruturais (projetos, squads, members) — mudam pouco
  structural: { staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 },
  // dados de trabalho (tasks, comments, attachments) — moderado
  workload: { staleTime: 60 * 1000, gcTime: 5 * 60 * 1000 },
  // realtime-ish (notificações, presença, timer) — frequente
  realtime: { staleTime: 10 * 1000, gcTime: 60 * 1000 },
  // analytics / dashboards — pesado, pode esperar
  analytics: { staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000 },
} as const;

export type QueryProfileName = keyof typeof QUERY_PROFILES;

/**
 * Default global do QueryClient — vale para qualquer useQuery sem profile.
 * Optei por valores moderados pra reduzir N+1 sem virar stale demais.
 */
export const DEFAULT_QUERY_CLIENT_CONFIG: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
};

/**
 * Helper: spread em useQuery({ ...queryProfile("workload"), queryKey, queryFn }).
 */
export function queryProfile(name: QueryProfileName) {
  return QUERY_PROFILES[name];
}
