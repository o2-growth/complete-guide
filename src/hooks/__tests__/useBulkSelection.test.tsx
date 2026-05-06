import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  useBulkSelection,
  useBulkSelectionStore,
} from "@/hooks/useBulkSelection";

describe("useBulkSelection", () => {
  beforeEach(() => {
    useBulkSelectionStore.setState({
      selectedIds: new Set(),
      lastSelectedId: null,
      visibleIds: [],
    });
  });

  it("toggle adiciona e remove ids", () => {
    const { result } = renderHook(() => useBulkSelection());

    expect(result.current.count).toBe(0);
    expect(result.current.bulkMode).toBe(false);

    act(() => {
      result.current.toggle("a");
    });
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.count).toBe(1);
    expect(result.current.bulkMode).toBe(true);

    act(() => {
      result.current.toggle("a");
    });
    expect(result.current.isSelected("a")).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it("setRange seleciona intervalo entre âncora e alvo respeitando ordem", () => {
    const { result } = renderHook(() => useBulkSelection());

    act(() => {
      result.current.setVisible(["a", "b", "c", "d", "e"]);
      result.current.toggle("b");
    });
    expect(result.current.lastSelectedId).toBe("b");

    act(() => {
      result.current.setRange("b", "d");
    });
    expect(result.current.isSelected("b")).toBe(true);
    expect(result.current.isSelected("c")).toBe(true);
    expect(result.current.isSelected("d")).toBe(true);
    expect(result.current.isSelected("a")).toBe(false);
    expect(result.current.isSelected("e")).toBe(false);
    expect(result.current.count).toBe(3);
  });

  it("selectAll e clear funcionam como esperado", () => {
    const { result } = renderHook(() => useBulkSelection());

    act(() => {
      result.current.selectAll(["x", "y", "z"]);
    });
    expect(result.current.count).toBe(3);
    expect(result.current.lastSelectedId).toBe("z");

    act(() => {
      result.current.clear();
    });
    expect(result.current.count).toBe(0);
    expect(result.current.lastSelectedId).toBeNull();
    expect(result.current.bulkMode).toBe(false);
  });
});
