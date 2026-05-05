import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// vi.mock é hoisted — variáveis acessíveis pelo factory precisam de vi.hoisted.
const hoisted = vi.hoisted(() => {
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  };
  const fromCalls: Array<{
    table: string;
    chain: Record<string, unknown>;
  }> = [];
  const state = { activeTimeEntry: null as unknown, activePomodoro: null as unknown };
  const rpcMock = vi.fn();

  function buildChain(result: { data: unknown; error: unknown }) {
    const chain: Record<string, unknown> = {};
    const methods = [
      "select",
      "eq",
      "is",
      "order",
      "limit",
      "insert",
      "update",
      "delete",
    ];
    for (const m of methods) chain[m] = vi.fn(() => chain);
    chain.maybeSingle = vi.fn(async () => result);
    chain.single = vi.fn(async () => result);
    (chain as { then: unknown }).then = (
      onF: (v: unknown) => unknown,
    ) => Promise.resolve(result).then(onF);
    return chain;
  }

  return { channelMock, fromCalls, state, rpcMock, buildChain };
});

const { channelMock, fromCalls, state, rpcMock, buildChain } = hoisted;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      const data =
        table === "time_entries"
          ? hoisted.state.activeTimeEntry
          : table === "pomodoros"
            ? hoisted.state.activePomodoro
            : null;
      const chain = hoisted.buildChain({ data, error: null });
      hoisted.fromCalls.push({ table, chain });
      return chain;
    },
    rpc: hoisted.rpcMock,
    channel: () => hoisted.channelMock,
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: null, loading: false }),
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
  useTimerSync,
  useStartTimer,
  useStopTimer,
} from "@/hooks/useTimer";
import { useTimerStore } from "@/stores/timerStore";
import { withQueryClient } from "@/test/helpers";

beforeEach(() => {
  vi.clearAllMocks();
  fromCalls.length = 0;
  state.activeTimeEntry = null;
  state.activePomodoro = null;
  // reset store
  useTimerStore.setState({ timer: null, pomodoro: null, tickNow: Date.now() });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useTimerSync", () => {
  it("deve buscar o time_entry ativo do usuário no mount (1 ativo por user — invariante DB)", async () => {
    state.activeTimeEntry = {
      id: "te-1",
      task_id: "task-9",
      started_at: "2026-05-04T10:00:00Z",
      note: "trabalhando",
    };

    const { Wrapper } = withQueryClient();
    renderHook(() => useTimerSync(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(useTimerStore.getState().timer?.id).toBe("te-1");
    });

    // Confirma que filtrou por user_id e ended_at IS NULL
    const teCall = fromCalls.find((c) => c.table === "time_entries");
    expect(teCall).toBeDefined();
    expect(teCall!.chain.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(teCall!.chain.is).toHaveBeenCalledWith("ended_at", null);
  });

  it("deve registrar listeners de broadcast nos canais tenant:{id}:timer e tenant:{id}:pomodoro do user", async () => {
    const { Wrapper } = withQueryClient();
    renderHook(() => useTimerSync(), { wrapper: Wrapper });

    await waitFor(() => expect(channelMock.subscribe).toHaveBeenCalled());
    // 2 channels: timer + pomodoro (Broadcast com triggers — regra §1.3)
    expect(channelMock.on).toHaveBeenCalledTimes(2);
    const [firstCall, secondCall] = channelMock.on.mock.calls;
    expect(firstCall[0]).toBe("broadcast");
    expect(firstCall[1]).toMatchObject({ event: "*" });
    expect(secondCall[0]).toBe("broadcast");
    expect(secondCall[1]).toMatchObject({ event: "*" });
  });
});

describe("useStartTimer", () => {
  it("deve chamar a RPC start_timer com taskId e note", async () => {
    rpcMock.mockResolvedValue({ data: "te-new", error: null });

    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useStartTimer(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ taskId: "task-1", note: "foco" });
    });

    expect(rpcMock).toHaveBeenCalledWith("start_timer", {
      _task_id: "task-1",
      _note: "foco",
    });
  });

  it("deve passar note=null quando não fornecida", async () => {
    rpcMock.mockResolvedValue({ data: "te-new", error: null });

    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useStartTimer(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ taskId: "task-1" });
    });

    expect(rpcMock).toHaveBeenCalledWith("start_timer", {
      _task_id: "task-1",
      _note: null,
    });
  });

  it("deve propagar erro da RPC", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: new Error("conflict"),
    });

    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useStartTimer(), { wrapper: Wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ taskId: "task-x" });
      }),
    ).rejects.toThrow("conflict");
  });
});

describe("useStopTimer", () => {
  it("deve chamar a RPC stop_timer (DB seta ended_at = now())", async () => {
    rpcMock.mockResolvedValue({ data: "ok", error: null });

    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useStopTimer(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(rpcMock).toHaveBeenCalledWith("stop_timer");
  });

  it("deve invalidar queries de tasks no sucesso", async () => {
    rpcMock.mockResolvedValue({ data: "ok", error: null });

    const { Wrapper, queryClient } = withQueryClient();
    const spy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useStopTimer(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(spy).toHaveBeenCalledWith({ queryKey: ["tasks"] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["task"] });
  });
});
