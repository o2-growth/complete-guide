import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FieldRenderer } from "../CustomFieldsPanel";
import type { ResolvedCustomField } from "@/hooks/useCustomFields";

// Mock do hook de upsert (FieldRenderer chama useUpsertFieldValue)
const upsertMock = vi.fn();
vi.mock("@/hooks/useCustomFields", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useCustomFields")>(
    "@/hooks/useCustomFields",
  );
  return {
    ...actual,
    useUpsertFieldValue: () => ({
      mutate: upsertMock,
      isPending: false,
    }),
  };
});

vi.mock("@/hooks/useWorkload", () => ({
  useTenantMembers: () => ({
    data: [
      {
        user_id: "u1",
        display_name: "Alice",
        full_name: "Alice Silva",
        email: "alice@example.com",
        avatar_url: null,
        role: "admin",
        capacity_minutes_day: 480,
      },
    ],
    isLoading: false,
  }),
}));

function makeField(over: Partial<ResolvedCustomField["definition"]> = {}, value: unknown = null): ResolvedCustomField {
  return {
    definition: {
      id: "def-1",
      tenant_id: "t1",
      scope: "global",
      task_type_id: null,
      project_id: null,
      key: "campo",
      label: "Campo",
      field_type: "text",
      options: [],
      required: false,
      default_value: null,
      position: 0,
      help_text: null,
      is_active: true,
      created_by: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
      ...over,
    },
    value,
  };
}

function renderWithClient(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("FieldRenderer", () => {
  beforeEach(() => {
    upsertMock.mockReset();
  });

  it("renderiza input de texto e debounca alteração antes de salvar", async () => {
    vi.useFakeTimers();
    const field = makeField({ field_type: "text" }, "");
    renderWithClient(<FieldRenderer taskId="task-1" field={field} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "olá" } });
    expect(upsertMock).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(upsertMock).toHaveBeenCalledWith({
      taskId: "task-1",
      definitionId: "def-1",
      value: "olá",
    });
    vi.useRealTimers();
  });

  it("renderiza number e converte string para number ao salvar", async () => {
    vi.useFakeTimers();
    const field = makeField({ field_type: "number" }, null);
    renderWithClient(<FieldRenderer taskId="task-1" field={field} />);
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "42" } });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(upsertMock).toHaveBeenCalledWith({
      taskId: "task-1",
      definitionId: "def-1",
      value: 42,
    });
    vi.useRealTimers();
  });

  it("renderiza checkbox como switch e salva imediatamente", () => {
    const field = makeField({ field_type: "checkbox" }, false);
    renderWithClient(<FieldRenderer taskId="task-1" field={field} />);
    const sw = screen.getByRole("switch");
    fireEvent.click(sw);
    expect(upsertMock).toHaveBeenCalledWith({
      taskId: "task-1",
      definitionId: "def-1",
      value: true,
    });
  });

  it("renderiza rating com 5 estrelas e salva ao clicar", () => {
    const field = makeField({ field_type: "rating" }, 0);
    renderWithClient(<FieldRenderer taskId="task-1" field={field} />);
    const stars = screen.getAllByRole("button");
    expect(stars.length).toBeGreaterThanOrEqual(5);
    fireEvent.click(stars[2]); // 3 estrelas
    expect(upsertMock).toHaveBeenCalledWith({
      taskId: "task-1",
      definitionId: "def-1",
      value: 3,
    });
  });

  it("formula é readonly", () => {
    const field = makeField({ field_type: "formula" }, "calc");
    renderWithClient(<FieldRenderer taskId="task-1" field={field} />);
    const input = screen.getByPlaceholderText(/Fórmula calculada/i) as HTMLInputElement;
    expect(input).toHaveAttribute("readonly");
  });
});
