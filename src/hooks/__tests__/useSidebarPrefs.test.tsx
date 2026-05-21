import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const fromCalls: Array<{ table: string; chain: Record<string, unknown> }> = [];
let lastUpdatePayload: unknown = null;
const remoteState: { preferences: Record<string, unknown> | null } = {
  preferences: null,
};

function buildChain() {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "update"];
  for (const m of methods) {
    chain[m] = vi.fn((...args: unknown[]) => {
      if (m === "update") {
        lastUpdatePayload = args[0];
      }
      return chain;
    });
  }
  chain.maybeSingle = vi.fn(async () => ({
    data: { preferences: remoteState.preferences },
    error: null,
  }));
  (chain as { then: unknown }).then = (
    onF: (v: unknown) => unknown,
  ) => Promise.resolve({ data: null, error: null }).then(onF);
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const chain = buildChain();
      fromCalls.push({ table, chain });
      return chain;
    }),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "u@o2.com.br" },
    session: null,
    loading: false,
  }),
}));

import { useSidebarPrefs } from "@/hooks/useSidebarPrefs";

beforeEach(() => {
  fromCalls.length = 0;
  lastUpdatePayload = null;
  remoteState.preferences = null;
  localStorage.clear();
});

describe("useSidebarPrefs", () => {
  it("inicia com defaults (sem favoritos, grupos pesados colapsados)", async () => {
    const { result } = renderHook(() => useSidebarPrefs());
    expect(result.current.favorites).toEqual([]);
    expect(result.current.isGroupCollapsed("operacao")).toBe(true);
    expect(result.current.isGroupCollapsed("atendimento")).toBe(true);
    expect(result.current.isGroupCollapsed("midias-sociais")).toBe(true);
    expect(result.current.isGroupCollapsed("insights")).toBe(true);
    expect(result.current.isGroupCollapsed("conhecimento")).toBe(true);
    expect(result.current.isGroupCollapsed("sistema")).toBe(true);
    expect(result.current.isGroupCollapsed("inicio")).toBe(false);
    expect(result.current.isGroupCollapsed("visualizacoes")).toBe(false);
  });

  it("toggleFavorite adiciona e remove paths persistindo em localStorage", async () => {
    const { result } = renderHook(() => useSidebarPrefs());

    await act(async () => {
      result.current.toggleFavorite("/app/hoje");
    });
    await waitFor(() => {
      expect(result.current.favorites).toContain("/app/hoje");
    });
    expect(result.current.isFavorite("/app/hoje")).toBe(true);
    const stored = JSON.parse(localStorage.getItem("oxy.sidebar-prefs") || "{}");
    expect(stored.favorites).toContain("/app/hoje");

    await act(async () => {
      result.current.toggleFavorite("/app/hoje");
    });
    await waitFor(() => {
      expect(result.current.favorites).not.toContain("/app/hoje");
    });
  });

  it("toggleGroupCollapsed alterna estado e persiste payload completo no profiles", async () => {
    const { result } = renderHook(() => useSidebarPrefs());

    await act(async () => {
      result.current.toggleGroupCollapsed("inicio");
    });
    await waitFor(() => {
      expect(result.current.isGroupCollapsed("inicio")).toBe(true);
    });

    await waitFor(() => {
      expect(lastUpdatePayload).toBeTruthy();
    });
    const payload = lastUpdatePayload as {
      preferences?: { sidebar?: { collapsedGroups?: string[] } };
    };
    expect(payload.preferences?.sidebar?.collapsedGroups).toContain("inicio");
  });

  it("reorderItems salva customOrder por groupId", async () => {
    const { result } = renderHook(() => useSidebarPrefs());
    const order = ["/app/projetos", "/app/squads", "/app/demandas"];

    await act(async () => {
      result.current.reorderItems("operacao", order);
    });
    await waitFor(() => {
      expect(result.current.customOrder.operacao).toEqual(order);
    });
  });
});
