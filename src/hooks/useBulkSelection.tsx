import { useCallback } from "react";
import { create } from "zustand";

interface BulkSelectionState {
  selectedIds: Set<string>;
  /** Última task clicada — usada para implementar shift-click range. */
  lastSelectedId: string | null;
  /** Lista visível atual — atualizada por listas; usada pra selectAll. */
  visibleIds: string[];

  toggle: (id: string) => void;
  setRange: (anchorId: string, targetId: string) => void;
  selectAll: (ids: string[]) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  setVisible: (ids: string[]) => void;
}

export const useBulkSelectionStore = create<BulkSelectionState>((set, get) => ({
  selectedIds: new Set<string>(),
  lastSelectedId: null,
  visibleIds: [],

  toggle: (id) => {
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next, lastSelectedId: id };
    });
  },

  setRange: (anchorId, targetId) => {
    const { visibleIds, selectedIds } = get();
    const a = visibleIds.indexOf(anchorId);
    const b = visibleIds.indexOf(targetId);
    if (a === -1 || b === -1) {
      // Sem range possível — fallback pra toggle simples.
      const next = new Set(selectedIds);
      if (next.has(targetId)) next.delete(targetId);
      else next.add(targetId);
      set({ selectedIds: next, lastSelectedId: targetId });
      return;
    }
    const [start, end] = a <= b ? [a, b] : [b, a];
    const slice = visibleIds.slice(start, end + 1);
    const next = new Set(selectedIds);
    slice.forEach((id) => next.add(id));
    set({ selectedIds: next, lastSelectedId: targetId });
  },

  selectAll: (ids) => {
    const next = new Set(ids);
    set({
      selectedIds: next,
      lastSelectedId: ids.length ? ids[ids.length - 1] : null,
    });
  },

  clear: () => set({ selectedIds: new Set(), lastSelectedId: null }),

  isSelected: (id) => get().selectedIds.has(id),

  setVisible: (ids) => set({ visibleIds: ids }),
}));

/**
 * Hook idiomático para uso em componentes — devolve a API mínima e re-renderiza
 * só quando o conjunto muda (zustand seleciona por shallow comparison via Set).
 */
export function useBulkSelection() {
  const selectedIds = useBulkSelectionStore((s) => s.selectedIds);
  const lastSelectedId = useBulkSelectionStore((s) => s.lastSelectedId);
  const toggle = useBulkSelectionStore((s) => s.toggle);
  const setRange = useBulkSelectionStore((s) => s.setRange);
  const selectAll = useBulkSelectionStore((s) => s.selectAll);
  const clear = useBulkSelectionStore((s) => s.clear);
  const setVisible = useBulkSelectionStore((s) => s.setVisible);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  return {
    selectedIds,
    lastSelectedId,
    toggle,
    setRange,
    selectAll,
    clear,
    isSelected,
    setVisible,
    count: selectedIds.size,
    bulkMode: selectedIds.size > 0,
  };
}
