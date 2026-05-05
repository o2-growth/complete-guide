import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTimerStore } from "@/stores/timerStore";
import { toast } from "sonner";

/**
 * Sincroniza store global de timer/pomodoro com o backend.
 * - busca o timer/pomodoro ativo no mount
 * - escuta Realtime nas tabelas time_entries e pomodoros para o usuário
 * - mantém um tick global a cada 1s para a UI
 */
export function useTimerSync() {
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  const setTimer = useTimerStore((s) => s.setTimer);
  const setPomodoro = useTimerStore((s) => s.setPomodoro);
  const tick = useTimerStore((s) => s.tick);

  // Tick global de 1s
  useEffect(() => {
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [tick]);

  // Fetch inicial + Realtime
  useEffect(() => {
    if (!user) {
      setTimer(null);
      setPomodoro(null);
      return;
    }
    // namespace por tenant (regra de ouro CLAUDE.md §1.3): sem tenantId não subscreve realtime
    if (!tenantId) return;

    let cancelled = false;
    (async () => {
      const [{ data: te }, { data: pomo }] = await Promise.all([
        supabase
          .from("time_entries")
          .select("id, task_id, started_at, note")
          .eq("user_id", user.id)
          .is("ended_at", null)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("pomodoros")
          .select("id, task_id, started_at, planned_minutes, break_minutes")
          .eq("user_id", user.id)
          .is("ended_at", null)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setTimer(te ?? null);
      setPomodoro(pomo ?? null);
    })();

    // Realtime via Broadcast (regra de ouro CLAUDE.md §1.3) — triggers em time_entries
    // e pomodoros disparam realtime.send no canal tenant:{id}:timer:{user_id}.
    // Discriminamos a tabela pelo shape do payload (time_entries tem `note`,
    // pomodoros tem `planned_minutes`).
    type BroadcastRow = Record<string, unknown> & {
      id?: string;
      task_id?: string | null;
      started_at?: string;
      ended_at?: string | null;
    };

    const handleEvent = (msg: { event?: string; payload?: BroadcastRow }) => {
      const row = msg.payload;
      const op = (msg.event ?? "").toUpperCase();
      if (!row || !row.id) return;

      const isPomodoro = "planned_minutes" in row;
      if (isPomodoro) {
        if (op === "DELETE") {
          setPomodoro(null);
          return;
        }
        if (row.ended_at) {
          useTimerStore.setState((s) => (s.pomodoro?.id === row.id ? { pomodoro: null } : s));
        } else {
          setPomodoro({
            id: row.id as string,
            task_id: (row.task_id as string | null) ?? null,
            started_at: row.started_at as string,
            planned_minutes: (row.planned_minutes as number) ?? 25,
            break_minutes: (row.break_minutes as number) ?? 5,
          });
        }
        return;
      }

      // time_entries
      if (op === "DELETE") {
        setTimer(null);
        return;
      }
      if (row.ended_at) {
        useTimerStore.setState((s) => (s.timer?.id === row.id ? { timer: null } : s));
      } else {
        setTimer({
          id: row.id as string,
          task_id: row.task_id as string,
          started_at: row.started_at as string,
          note: (row.note as string | null) ?? null,
        });
      }
    };

    const ch = supabase
      .channel(`tenant:${tenantId}:timer:${user.id}`)
      .on("broadcast", { event: "*" }, (msg) => handleEvent(msg as never))
      .subscribe();

    // Canal alternativo caso o trigger de pomodoros use namespace separado.
    const chPomo = supabase
      .channel(`tenant:${tenantId}:pomodoro:${user.id}`)
      .on("broadcast", { event: "*" }, (msg) => handleEvent(msg as never))
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
      supabase.removeChannel(chPomo);
    };
  }, [user, tenantId, setTimer, setPomodoro]);
}

/* ----------------- Mutations ----------------- */

export function useStartTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, note }: { taskId: string; note?: string }) => {
      const { data, error } = await supabase.rpc("start_timer", {
        _task_id: taskId,
        _note: note ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task"] });
    },
    onError: (e: Error) => toast.error("Erro ao iniciar timer: " + e.message),
  });
}

export function useStopTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("stop_timer");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task"] });
    },
    onError: (e: Error) => toast.error("Erro ao parar timer: " + e.message),
  });
}

export function useStartPomodoro() {
  return useMutation({
    mutationFn: async (input: {
      taskId?: string | null;
      planned?: number;
      breakMinutes?: number;
      ambient?: string | null;
    }) => {
      const { data, error } = await supabase.rpc("start_pomodoro", {
        _task_id: input.taskId ?? null,
        _planned_minutes: input.planned ?? 25,
        _break_minutes: input.breakMinutes ?? 5,
        _ambient: input.ambient ?? null,
      });
      if (error) throw error;
      return data;
    },
    onError: (e: Error) => toast.error("Erro no pomodoro: " + e.message),
  });
}

export function useStopPomodoro() {
  return useMutation({
    mutationFn: async (completed: boolean) => {
      const { data, error } = await supabase.rpc("stop_pomodoro", { _completed: completed });
      if (error) throw error;
      return data;
    },
    onError: (e: Error) => toast.error("Erro ao parar pomodoro: " + e.message),
  });
}