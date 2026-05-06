import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const fromCalls: Array<{ table: string; chain: Record<string, unknown> }> = [];
const tableResults: Record<string, { data: unknown; error: unknown }> = {};

function buildChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = [
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
    "insert",
    "update",
    "upsert",
    "delete",
  ];
  for (const m of methods) chain[m] = vi.fn(() => chain);
  chain.single = vi.fn(async () => result);
  chain.maybeSingle = vi.fn(async () => result);
  (chain as { then: unknown }).then = (
    onF: (v: unknown) => unknown,
  ) => Promise.resolve(result).then(onF);
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const result = tableResults[table] ?? { data: [], error: null };
      const chain = buildChain(result);
      fromCalls.push({ table, chain });
      return chain;
    }),
    rpc: vi.fn(async () => ({ data: null, error: null })),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "u@o2.com.br" },
    session: null,
    loading: false,
  }),
}));

vi.mock("@/hooks/useWorkspace", () => ({
  useWorkspace: () => ({
    tenantId: "tenant-test-1",
    inboxProjectId: "inbox-1",
    loading: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import {
  useCreateDashboard,
  useAddWidget,
  useReorderWidgets,
} from "@/hooks/useDashboards";
import { withQueryClient } from "@/test/helpers";

beforeEach(() => {
  vi.clearAllMocks();
  fromCalls.length = 0;
  for (const k of Object.keys(tableResults)) delete tableResults[k];
});

describe("useCreateDashboard", () => {
  it("deve inserir dashboard com tenant_id e created_by", async () => {
    tableResults["dashboards"] = { data: { id: "dash-1" }, error: null };
    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useCreateDashboard(), {
      wrapper: Wrapper,
    });

    let returned: string | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync({
        name: "Cockpit",
        description: "main",
      });
    });

    expect(returned).toBe("dash-1");
    const insertCall = fromCalls
      .filter((c) => c.table === "dashboards")
      .find(
        (c) =>
          (c.chain.insert as ReturnType<typeof vi.fn>).mock.calls.length > 0,
      );
    expect(insertCall).toBeDefined();
    const payload = (insertCall!.chain.insert as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>;
    expect(payload.tenant_id).toBe("tenant-test-1");
    expect(payload.created_by).toBe("user-1");
    expect(payload.name).toBe("Cockpit");
    expect(payload.description).toBe("main");
  });
});

describe("useAddWidget", () => {
  it("deve inserir widget com kind, title e config defaults", async () => {
    tableResults["dashboard_widgets"] = { data: { id: "w-1" }, error: null };
    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useAddWidget(), {
      wrapper: Wrapper,
    });

    let returned: string | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync({
        dashboard_id: "dash-1",
        kind: "kpi",
        title: "Tarefas hoje",
        config: { metric: "tasks_today" },
      });
    });

    expect(returned).toBe("w-1");
    const insertCall = fromCalls
      .filter((c) => c.table === "dashboard_widgets")
      .find(
        (c) =>
          (c.chain.insert as ReturnType<typeof vi.fn>).mock.calls.length > 0,
      );
    expect(insertCall).toBeDefined();
    const payload = (insertCall!.chain.insert as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>;
    expect(payload.dashboard_id).toBe("dash-1");
    expect(payload.kind).toBe("kpi");
    expect(payload.title).toBe("Tarefas hoje");
    expect(payload.width).toBe(1);
    expect(payload.height).toBe(1);
    expect(payload.position).toBe(0);
    expect(payload.config).toEqual({ metric: "tasks_today" });
  });
});

describe("useReorderWidgets", () => {
  it("deve atualizar position de cada widget na ordem informada", async () => {
    tableResults["dashboard_widgets"] = { data: null, error: null };
    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useReorderWidgets(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        dashboard_id: "dash-1",
        order: [
          { id: "w-a", position: 0 },
          { id: "w-b", position: 1 },
          { id: "w-c", position: 2 },
        ],
      });
    });

    const updateCalls = fromCalls
      .filter((c) => c.table === "dashboard_widgets")
      .filter(
        (c) =>
          (c.chain.update as ReturnType<typeof vi.fn>).mock.calls.length > 0,
      );
    expect(updateCalls.length).toBe(3);

    const positions = updateCalls.map(
      (c) =>
        (
          (c.chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
            position: number;
          }
        ).position,
    );
    expect(positions).toEqual([0, 1, 2]);

    const ids = updateCalls.map(
      (c) =>
        (c.chain.eq as ReturnType<typeof vi.fn>).mock.calls.find(
          (call) => call[0] === "id",
        )?.[1],
    );
    expect(ids).toEqual(["w-a", "w-b", "w-c"]);
  });
});
