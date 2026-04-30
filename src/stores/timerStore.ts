import { create } from "zustand";

export interface ActiveTimer {
  id: string;
  task_id: string;
  started_at: string; // ISO
  note: string | null;
}

export interface ActivePomodoro {
  id: string;
  task_id: string | null;
  started_at: string;
  planned_minutes: number;
  break_minutes: number;
}

interface TimerState {
  timer: ActiveTimer | null;
  pomodoro: ActivePomodoro | null;
  /** segundos transcorridos do timer ativo (atualiza a cada 1s via tick) */
  tickNow: number;
  setTimer: (t: ActiveTimer | null) => void;
  setPomodoro: (p: ActivePomodoro | null) => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  timer: null,
  pomodoro: null,
  tickNow: Date.now(),
  setTimer: (t) => set({ timer: t }),
  setPomodoro: (p) => set({ pomodoro: p }),
  tick: () => set({ tickNow: Date.now() }),
}));

/** Helpers puros */
export function elapsedSeconds(startedAtIso: string, now: number) {
  return Math.max(0, Math.floor((now - new Date(startedAtIso).getTime()) / 1000));
}

export function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}