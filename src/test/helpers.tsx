import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { vi } from "vitest";

/**
 * Cria um QueryClient isolado por teste (sem retry, sem cache compartilhado).
 * Evita vazamento de estado entre testes e mantém previsibilidade.
 */
export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Renderiza uma árvore React envolta no QueryClientProvider — único provider
 * realmente necessário pros hooks testados (useAuth/useWorkspace são mockados).
 */
export function renderWithProviders(ui: ReactNode, qc?: QueryClient) {
  const client = qc ?? makeTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
  return { ...utils, queryClient: client };
}

/**
 * Wrapper para usar com `renderHook` do @testing-library/react.
 */
export function withQueryClient(qc?: QueryClient) {
  const client = qc ?? makeTestQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient: client };
}

/**
 * Construtor de chain encadeável que retorna sempre `this` até `then`/await.
 * O resultado final é o objeto `{ data, error }` configurado.
 *
 * Os métodos cobertos batem com o subset que usamos nos hooks:
 *   select, eq, neq, gt, gte, lt, lte, in, is, not, or, ilike, order,
 *   limit, range, contains, match, single, maybeSingle.
 */
export function buildSupabaseChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const passThrough = [
    "select",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "in",
    "is",
    "not",
    "or",
    "ilike",
    "order",
    "limit",
    "range",
    "contains",
    "match",
    "single",
    "maybeSingle",
    "insert",
    "update",
    "upsert",
    "delete",
  ];
  for (const m of passThrough) {
    chain[m] = vi.fn(() => chain);
  }
  // Suporta `await chainResult` retornando o `result`.
  (chain as { then: unknown }).then = (
    onFulfilled: (value: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled);
  return chain;
}

/**
 * Mock minimo do client Supabase para testes unitários. Cada chamada de
 * `from(table)` retorna um chain encadeável que resolve para `result`.
 *
 * Uso:
 *   const sb = mockSupabase({ "tasks": { data: [...], error: null } });
 *   sb.from("tasks").select().eq("archived", false) // → resolve com data
 */
export function mockSupabase(
  perTable: Record<string, { data: unknown; error: unknown }> = {},
) {
  const fromCalls: Array<{ table: string; chain: Record<string, unknown> }> =
    [];

  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  };

  const supabase = {
    from: vi.fn((table: string) => {
      const result = perTable[table] ?? { data: null, error: null };
      const chain = buildSupabaseChain(result);
      fromCalls.push({ table, chain });
      return chain;
    }),
    rpc: vi.fn(async () => ({ data: null, error: null })),
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn((_cb: unknown) => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(async () => ({
        data: { user: null, session: null },
        error: null,
      })),
      signUp: vi.fn(async () => ({
        data: { user: null, session: null },
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
    },
  };

  return { supabase, fromCalls, channel };
}

/**
 * Espera que o microtask + timer queue se esvaziem. Útil pra fluxos
 * que disparam várias `Promise.all` antes do estado finalizar.
 */
export async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
