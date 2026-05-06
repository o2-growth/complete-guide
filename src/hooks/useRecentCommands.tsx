import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "oxy:recent-commands";
const MAX_STORED = 10;
const MAX_RECENT = 5;

export interface RecentCommand {
  id: string;
  label: string;
  icon?: string;
  action_type: "navigate" | "create" | "action";
  executed_at: number;
}

function readStorage(): RecentCommand[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentCommand[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c) => c && typeof c.id === "string" && typeof c.label === "string",
    );
  } catch {
    return [];
  }
}

function writeStorage(items: RecentCommand[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export function useRecentCommands() {
  const [items, setItems] = useState<RecentCommand[]>(() => readStorage());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const recordCommand = useCallback(
    (cmd: Omit<RecentCommand, "executed_at">) => {
      setItems((prev) => {
        const filtered = prev.filter((c) => c.id !== cmd.id);
        const next: RecentCommand[] = [
          { ...cmd, executed_at: Date.now() },
          ...filtered,
        ].slice(0, MAX_STORED);
        writeStorage(next);
        return next;
      });
    },
    [],
  );

  const getRecent = useCallback(
    (limit = MAX_RECENT) => items.slice(0, limit),
    [items],
  );

  const clear = useCallback(() => {
    setItems([]);
    writeStorage([]);
  }, []);

  return { items, recordCommand, getRecent, clear };
}
