import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

    const ch = supabase
      .channel(`timer:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_entries", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as {
            id: string;
            task_id: string;
            started_at: string;
            ended_at: string | null;
            note: string | null;
          };
          if (!row) return;
          if (payload.eventType === "DELETE") {
            setTimer(null);
            return;
          }
          if (row.ended_at) {
            setTimer((prev) => (prev?.id === row.id ? null : prev) as never);
            // simplifica: apenas força refetch
            useTimerStore.setState((s) => (s.timer?.id === row.id ? { timer: null } : s));
          } else {
            setTimer({
              id: row.id,
              task_id: row.task_id,
              started_at: row.started_at,
              note: row.note,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pomodoros", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as {
            id: string;
            task_id: string | null;
            started_at: string;
            ended_at: string | null;
            planned_minutes: number;
            break_minutes: number;
          };
          if (!row) return;
          if (payload.eventType === "DELETE") {
            setPomodoro(null);
            return;
          }
          if (row.ended_at) {
            useTimerStore.setState((s) => (s.pomodoro?.id === row.id ? { pomodoro: null } : s));
          } else {
            setPomodoro({
              id: row.id,
              task_id: row.task_id,
              started_at: row.started_at,
              planned_minutes: row.planned_minutes,
              break_minutes: row.break_minutes,
            });
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user, setTimer, setPomodoro]);
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