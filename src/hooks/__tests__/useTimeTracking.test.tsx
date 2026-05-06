import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const fromCalls: Array<{ table: string; chain: Record<string, unknown> }> = [];
const tableResults: Record<string, { data: unknown; error: unknown }> = {};
const hoisted = vi.hoisted(() => ({ rpcMock: vi.fn() }));
const { rpcMock } = hoisted;

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
    rpc: hoisted.rpcMock,
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
  useAddManualTimeEntry,
  useTaskTotalTime,
  useUserTimesheet,
} from "@/hooks/useTimeTracking";
import { withQueryClient } from "@/test/helpers";

beforeEach(() => {
  vi.clearAllMocks();
  fromCalls.length = 0;
  for (const k of Object.keys(tableResults)) delete tableResults[k];
  rpcMock.mockReset();
});

describe("useAddManualTimeEntry", () => {
  it("deve inserir entry com billable=true e tenant_id/user_id corretos", async () => {
    tableResults["time_entries"] = { data: null, error: null };
    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useAddManualTimeEntry(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: "task-1",
        startedAt: "2026-05-04T10:00:00Z",
        endedAt: "2026-05-04T10:30:00Z",
        billable: true,
        hourlyRate: 150,
        note: "trabalho focado",
      });
    });

    const insertCall = fromCalls
      .filter((c) => c.table === "time_entries")
      .find(
        (c) =>
          (c.chain.insert as ReturnType<typeof vi.fn>).mock.calls.length > 0,
      );
    expect(insertCall).toBeDefined();
    const payload = (insertCall!.chain.insert as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>;
    expect(payload.tenant_id).toBe("tenant-test-1");
    expect(payload.user_id).toBe("user-1");
    expect(payload.task_id).toBe("task-1");
    expect(payload.billable).toBe(true);
    expect(payload.hourly_rate).toBe(150);
    expect(payload.minutes).toBe(30);
    expect(payload.source).toBe("manual");
  });
});

describe("useTaskTotalTime", () => {
  it("deve somar minutes de todas as entries finalizadas", async () => {
    tableResults["time_entries"] = {
      data: [
        {
          id: "e1",
          tenant_id: "tenant-test-1",
          task_id: "task-1",
          user_id: "user-1",
          started_at: "2026-05-04T09:00:00Z",
          ended_at: "2026-05-04T09:30:00Z",
          minutes: 30,
          note: null,
          source: "manual",
          billable: true,
          hourly_rate: null,
          tags: [],
          created_at: "2026-05-04T00:00:00Z",
          updated_at: "2026-05-04T00:00:00Z",
        },
        {
          id: "e2",
          tenant_id: "tenant-test-1",
          task_id: "task-1",
          user_id: "user-1",
          started_at: "2026-05-04T10:00:00Z",
          ended_at: "2026-05-04T10:45:00Z",
          minutes: 45,
          note: null,
          source: "manual",
          billable: false,
          hourly_rate: null,
          tags: [],
          created_at: "2026-05-04T00:00:00Z",
          updated_at: "2026-05-04T00:00:00Z",
        },
      ],
      error: null,
    };
    tableResults["tasks"] = { data: { estimate_minutes: 120 }, error: null };
    tableResults["profiles"] = { data: [], error: null };

    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useTaskTotalTime("task-1"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.totalMinutes).toBe(75);
    expect(result.current.data!.billableMinutes).toBe(30);
    expect(result.current.data!.estimatedMinutes).toBe(120);
  });
});

describe("useUserTimesheet", () => {
  it("deve chamar rpc('user_timesheet') com tenant/user/start/end e devolver agregado", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          day: "2026-05-04",
          total_minutes: 240,
          billable_minutes: 180,
          total_amount: 450,
          task_count: 3,
        },
      ],
      error: null,
    });

    const start = new Date("2026-05-01T00:00:00Z");
    const end = new Date("2026-05-07T23:59:59Z");

    const { Wrapper } = withQueryClient();
    const { result } = renderHook(
      () => useUserTimesheet("user-1", start, end),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(rpcMock).toHaveBeenCalledWith("user_timesheet", {
      _tenant: "tenant-test-1",
      _user: "user-1",
      _start: start.toISOString(),
      _end: end.toISOString(),
    });
    expect(result.current.data?.[0]).toEqual({
      day: "2026-05-04",
      total_minutes: 240,
      billable_minutes: 180,
      total_amount: 450,
      task_count: 3,
    });
  });
});
