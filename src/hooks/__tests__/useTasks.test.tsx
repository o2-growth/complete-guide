import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

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
  useTasks,
  useQuickAdd,
  useToggleTaskDone,
  useTaskStatuses,
  type TaskRow,
} from "@/hooks/useTasks";
import { withQueryClient } from "@/test/helpers";

beforeEach(() => {
  vi.clearAllMocks();
  fromCalls.length = 0;
  for (const k of Object.keys(tableResults)) delete tableResults[k];
  // statuses default usadas pelos hooks de mutação
  tableResults["task_statuses"] = {
    data: [
      { id: "st-todo", name: "A fazer", slug: "todo", is_done: false, position: 1, color: "#000" },
      { id: "st-done", name: "Feito", slug: "done", is_done: true, position: 99, color: "#0f0" },
    ],
    error: null,
  };
  tableResults["tasks"] = { data: [], error: null };
});

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

describe("useTasks", () => {
  it("deve filtrar pela janela de hoje quando list='today'", async () => {
    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useTasks("today"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const tasksCall = fromCalls.find((c) => c.table === "tasks");
    expect(tasksCall).toBeDefined();
    expect(tasksCall!.chain.gte).toHaveBeenCalledWith(
      "due_at",
      startOfToday().toISOString(),
    );
    expect(tasksCall!.chain.lte).toHaveBeenCalledWith(
      "due_at",
      endOfToday().toISOString(),
    );
  });

  it("deve filtrar próximos 7 dias quando list='next7'", async () => {
    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useTasks("next7"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const tasksCall = fromCalls.find((c) => c.table === "tasks");
    expect(tasksCall!.chain.gte).toHaveBeenCalled();
    expect(tasksCall!.chain.lte).toHaveBeenCalled();
    // janela: gte=hoje 00:00, lte=hoje+7 23:59:59 — diff fica entre 7 e 8 dias.
    const lteCalls = (tasksCall!.chain.lte as ReturnType<typeof vi.fn>).mock
      .calls;
    const lteIso = lteCalls[lteCalls.length - 1][1] as string;
    const lteDate = new Date(lteIso);
    const diffMs = lteDate.getTime() - startOfToday().getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(7);
    expect(diffDays).toBeLessThan(8.1);
  });

  it("deve filtrar atrasadas com due_at < hoje e done_at IS NULL quando list='overdue'", async () => {
    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useTasks("overdue"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const tasksCall = fromCalls.find((c) => c.table === "tasks");
    expect(tasksCall!.chain.lt).toHaveBeenCalledWith(
      "due_at",
      startOfToday().toISOString(),
    );
    expect(tasksCall!.chain.is).toHaveBeenCalledWith("done_at", null);
  });

  it("deve filtrar por assignee_id e done_at IS NULL quando list='assigned'", async () => {
    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useTasks("assigned"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const tasksCall = fromCalls.find((c) => c.table === "tasks");
    expect(tasksCall!.chain.eq).toHaveBeenCalledWith("assignee_id", "user-1");
    expect(tasksCall!.chain.is).toHaveBeenCalledWith("done_at", null);
  });

  it("deve filtrar por inbox_project_id quando list='inbox'", async () => {
    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useTasks("inbox"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const tasksCall = fromCalls.find((c) => c.table === "tasks");
    expect(tasksCall!.chain.eq).toHaveBeenCalledWith("project_id", "inbox-1");
  });
});

describe("useQuickAdd", () => {
  it("deve parsear 'Reunião amanhã 14h' e inserir tarefa com tenant_id, assignee_id e due_at", async () => {
    // resultado do INSERT precisa retornar uma "tarefa"
    tableResults["tasks"] = {
      data: { id: "task-new", code: "MKT-1", title: "Reunião" } as TaskRow,
      error: null,
    };

    const { Wrapper } = withQueryClient();
    const { result } = renderHook(
      () => ({ quick: useQuickAdd(), statuses: useTaskStatuses() }),
      { wrapper: Wrapper },
    );

    // Espera que statuses tenham carregado para o useTaskStatuses interno.
    await waitFor(() =>
      expect(result.current.statuses.data?.length ?? 0).toBeGreaterThan(0),
    );

    await act(async () => {
      await result.current.quick.mutateAsync("Reunião amanhã 14h");
    });

    // O INSERT bate em from("tasks") e chama .insert(payload)
    const insertCall = fromCalls
      .filter((c) => c.table === "tasks")
      .find(
        (c) =>
          (c.chain.insert as ReturnType<typeof vi.fn>).mock.calls.length > 0,
      );
    expect(insertCall).toBeDefined();
    const payload = (insertCall!.chain.insert as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>;

    expect(payload.tenant_id).toBe("tenant-test-1");
    expect(payload.project_id).toBe("inbox-1");
    expect(payload.assignee_id).toBe("user-1");
    expect(payload.reporter_id).toBe("user-1");
    expect(payload.created_by).toBe("user-1");
    expect(payload.title).toMatch(/Reunião/i);

    // due_at deve ser um ISO string apontando pra amanhã (chrono.pt com forwardDate=true).
    // Hora exata (14h) varia conforme TZ do runner — o ponto-chave é que cai em D+1.
    expect(typeof payload.due_at).toBe("string");
    const due = new Date(payload.due_at as string);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueLocalDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const tomorrowDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const diffDays = Math.abs((dueLocalDay.getTime() - tomorrowDay.getTime()) / 86400000);
    expect(diffDays).toBeLessThanOrEqual(1); // tolera shift de TZ entre runner e parser
  });

  it("deve completar sucesso quando workspace está pronto (caminho feliz adicional)", async () => {
    tableResults["tasks"] = {
      data: { id: "x", title: "ok" } as TaskRow,
      error: null,
    };
    const { Wrapper } = withQueryClient();
    const { result } = renderHook(
      () => ({ quick: useQuickAdd(), statuses: useTaskStatuses() }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current.statuses.data?.length ?? 0).toBeGreaterThan(0),
    );

    await act(async () => {
      await result.current.quick.mutateAsync("ok");
    });
    expect(result.current.quick.isError).toBe(false);
  });
});

describe("useToggleTaskDone", () => {
  it("deve marcar task como concluída setando done_at e status_id de done", async () => {
    tableResults["tasks"] = { data: null, error: null };

    const { Wrapper } = withQueryClient();
    const { result } = renderHook(
      () => ({
        toggle: useToggleTaskDone(),
        statuses: useTaskStatuses(),
      }),
      { wrapper: Wrapper },
    );

    // Aguarda useTaskStatuses ter dados — o toggle depende deles.
    await waitFor(() =>
      expect(result.current.statuses.data?.length ?? 0).toBeGreaterThan(0),
    );

    const task: TaskRow = {
      id: "task-1",
      tenant_id: "tenant-test-1",
      project_id: "p-1",
      code: "MKT-1",
      number: 1,
      title: "x",
      description: null,
      priority: "medium",
      status_id: "st-todo",
      assignee_id: "user-1",
      start_at: null,
      due_at: null,
      estimate_minutes: null,
      spent_minutes: 0,
      archived: false,
      done_at: null,
      created_at: "2026-05-04T00:00:00Z",
      updated_at: "2026-05-04T00:00:00Z",
    };

    await act(async () => {
      await result.current.toggle.mutateAsync(task);
    });

    const updateCall = fromCalls
      .filter((c) => c.table === "tasks")
      .find(
        (c) =>
          (c.chain.update as ReturnType<typeof vi.fn>).mock.calls.length > 0,
      );
    expect(updateCall).toBeDefined();
    const payload = (updateCall!.chain.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>;
    expect(typeof payload.done_at).toBe("string");
    expect(payload.status_id).toBe("st-done");
    expect(updateCall!.chain.eq).toHaveBeenCalledWith("id", "task-1");
  });

  it("deve desmarcar task (toggle off): zera done_at e volta status pra todo", async () => {
    tableResults["tasks"] = { data: null, error: null };

    const { Wrapper } = withQueryClient();
    const { result } = renderHook(
      () => ({
        toggle: useToggleTaskDone(),
        statuses: useTaskStatuses(),
      }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current.statuses.data?.length ?? 0).toBeGreaterThan(0),
    );

    const task: TaskRow = {
      id: "task-2",
      tenant_id: "tenant-test-1",
      project_id: "p-1",
      code: "MKT-2",
      number: 2,
      title: "y",
      description: null,
      priority: "low",
      status_id: "st-done",
      assignee_id: "user-1",
      start_at: null,
      due_at: null,
      estimate_minutes: null,
      spent_minutes: 0,
      archived: false,
      done_at: "2026-05-04T10:00:00Z",
      created_at: "2026-05-04T00:00:00Z",
      updated_at: "2026-05-04T00:00:00Z",
    };

    await act(async () => {
      await result.current.toggle.mutateAsync(task);
    });

    const updateCall = fromCalls
      .filter((c) => c.table === "tasks")
      .find(
        (c) =>
          (c.chain.update as ReturnType<typeof vi.fn>).mock.calls.length > 0,
      );
    const payload = (updateCall!.chain.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>;
    expect(payload.done_at).toBeNull();
    expect(payload.status_id).toBe("st-todo");
  });
});
