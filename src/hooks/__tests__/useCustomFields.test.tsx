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
  useCustomFieldDefinitions,
  useCreateFieldDefinition,
  useUpsertFieldValue,
} from "@/hooks/useCustomFields";
import { withQueryClient } from "@/test/helpers";

beforeEach(() => {
  vi.clearAllMocks();
  fromCalls.length = 0;
  for (const k of Object.keys(tableResults)) delete tableResults[k];
});

describe("useCreateFieldDefinition", () => {
  it("deve inserir nova definition com tenant_id e created_by", async () => {
    tableResults["custom_field_definitions"] = {
      data: { id: "def-1" },
      error: null,
    };
    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useCreateFieldDefinition(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        scope: "global",
        key: "owner",
        label: "Owner",
        field_type: "text",
      });
    });

    const insertCall = fromCalls
      .filter((c) => c.table === "custom_field_definitions")
      .find(
        (c) =>
          (c.chain.insert as ReturnType<typeof vi.fn>).mock.calls.length > 0,
      );
    expect(insertCall).toBeDefined();
    const payload = (insertCall!.chain.insert as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>;
    expect(payload.tenant_id).toBe("tenant-test-1");
    expect(payload.created_by).toBe("user-1");
    expect(payload.scope).toBe("global");
    expect(payload.key).toBe("owner");
    expect(payload.field_type).toBe("text");
  });
});

describe("useCustomFieldDefinitions", () => {
  it("deve listar definitions filtrando por tenant_id, is_active e scope quando informado", async () => {
    tableResults["custom_field_definitions"] = {
      data: [
        {
          id: "def-1",
          tenant_id: "tenant-test-1",
          scope: "task_type",
          task_type_id: "tt-1",
          project_id: null,
          key: "owner",
          label: "Owner",
          field_type: "text",
          options: [],
          required: false,
          default_value: null,
          position: 0,
          help_text: null,
          is_active: true,
          created_by: "user-1",
          created_at: "2026-05-04T00:00:00Z",
          updated_at: "2026-05-04T00:00:00Z",
        },
      ],
      error: null,
    };

    const { Wrapper } = withQueryClient();
    const { result } = renderHook(
      () => useCustomFieldDefinitions({ scope: "task_type", task_type_id: "tt-1" }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const call = fromCalls.find((c) => c.table === "custom_field_definitions");
    expect(call).toBeDefined();
    expect(call!.chain.eq).toHaveBeenCalledWith("tenant_id", "tenant-test-1");
    expect(call!.chain.eq).toHaveBeenCalledWith("is_active", true);
    expect(call!.chain.eq).toHaveBeenCalledWith("scope", "task_type");
    expect(call!.chain.eq).toHaveBeenCalledWith("task_type_id", "tt-1");
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0].key).toBe("owner");
  });
});

describe("useUpsertFieldValue", () => {
  it("deve upsertar value com onConflict task_id,field_definition_id quando valor não-vazio", async () => {
    tableResults["task_custom_field_values"] = { data: null, error: null };
    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useUpsertFieldValue(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: "task-1",
        definitionId: "def-1",
        value: "ana",
      });
    });

    const upsertCall = fromCalls
      .filter((c) => c.table === "task_custom_field_values")
      .find(
        (c) =>
          (c.chain.upsert as ReturnType<typeof vi.fn>).mock.calls.length > 0,
      );
    expect(upsertCall).toBeDefined();
    const args = (upsertCall!.chain.upsert as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const payload = args[0] as Record<string, unknown>;
    const opts = args[1] as { onConflict?: string };
    expect(payload.task_id).toBe("task-1");
    expect(payload.field_definition_id).toBe("def-1");
    expect(payload.value).toBe("ana");
    expect(opts.onConflict).toBe("task_id,field_definition_id");
  });

  it("deve deletar registro quando valor é vazio (string vazia / null / array vazio)", async () => {
    tableResults["task_custom_field_values"] = { data: null, error: null };
    const { Wrapper } = withQueryClient();
    const { result } = renderHook(() => useUpsertFieldValue(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: "task-1",
        definitionId: "def-1",
        value: "",
      });
    });

    const deleteCall = fromCalls
      .filter((c) => c.table === "task_custom_field_values")
      .find(
        (c) =>
          (c.chain.delete as ReturnType<typeof vi.fn>).mock.calls.length > 0,
      );
    expect(deleteCall).toBeDefined();
    expect(deleteCall!.chain.eq).toHaveBeenCalledWith("task_id", "task-1");
    expect(deleteCall!.chain.eq).toHaveBeenCalledWith(
      "field_definition_id",
      "def-1",
    );
  });
});
