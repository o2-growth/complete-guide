import { useEffect, useMemo, useState } from "react";
import { Timer as TimerIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import {
  useStartPomodoro,
  useStopPomodoro,
  useStartTimer,
  useStopTimer,
} from "@/hooks/useTimer";
import {
  elapsedSeconds,
  formatHMS,
  formatMSS,
  useTimerStore,
} from "@/stores/timerStore";
import { useQuery } from "@tanstack/react-query";
import { FocusTimerDisplay } from "./_components/focus/FocusTimerDisplay";
import { FocusSettings } from "./_components/focus/FocusSettings";
import { FocusStats } from "./_components/focus/FocusStats";
import { FocusWeeklyChart } from "./_components/focus/FocusWeeklyChart";
import { AmbientPlayer } from "@/components/timer/AmbientPlayer";

export default function FocusPage() {
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  const [taskId, setTaskId] = useState<string>("none");
  const [preset, setPreset] = useState<number>(25);

  useEffect(() => {
    const prev = document.title;
    document.title = "Foco — Pomodoro & Cronômetro | Oxy Growth OS";
    return () => {
      document.title = prev;
    };
  }, []);

  const startPomo = useStartPomodoro();
  const stopPomo = useStopPomodoro();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const pomo = useTimerStore((s) => s.pomodoro);
  const timer = useTimerStore((s) => s.timer);
  const now = useTimerStore((s) => s.tickNow);

  const { data: tasks } = useQuery({
    queryKey: ["focus-tasks", user?.id, tenantId],
    enabled: !!user && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, code")
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .is("done_at", null)
        .eq("assignee_id", user!.id)
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: today } = useQuery({
    queryKey: ["focus-today", user?.id, now ? Math.floor(now / 60000) : 0],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const [{ data: pomos }, { data: entries }] = await Promise.all([
        supabase
          .from("pomodoros")
          .select("id, completed, planned_minutes")
          .eq("user_id", user!.id)
          .gte("started_at", start.toISOString()),
        supabase
          .from("time_entries")
          .select("minutes")
          .eq("user_id", user!.id)
          .gte("started_at", start.toISOString()),
      ]);
      const completed = (pomos ?? []).filter((p) => p.completed).length;
      const totalMin = (entries ?? []).reduce((acc, e) => acc + (e.minutes ?? 0), 0);
      return { completed, totalMin, pomosToday: pomos?.length ?? 0 };
    },
    refetchInterval: 60_000,
  });

  // auto-bipe ao chegar em 0
  useEffect(() => {
    if (!pomo) return;
    const total = pomo.planned_minutes * 60;
    const elapsed = elapsedSeconds(pomo.started_at, now);
    if (elapsed === total) {
      try {
        const ctx = new (window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.frequency.value = 880;
        osc.connect(ctx.destination);
        osc.start();
        setTimeout(() => {
          osc.stop();
          ctx.close();
        }, 400);
      } catch {
        // ignore
      }
    }
  }, [now, pomo]);

  const display = useMemo(() => {
    if (pomo) {
      const total = pomo.planned_minutes * 60;
      const elapsed = elapsedSeconds(pomo.started_at, now);
      const remaining = Math.max(0, total - elapsed);
      const overtime = elapsed > total;
      return {
        label: overtime ? `+${formatMSS(elapsed - total)}` : formatMSS(remaining),
        sub: overtime ? "Tempo extra — encerre para registrar" : "Concentração ativa",
        progress: Math.min(100, (elapsed / total) * 100),
        active: true,
        pomodoro: true,
      };
    }
    if (timer) {
      return {
        label: formatHMS(elapsedSeconds(timer.started_at, now)),
        sub: "Cronômetro contínuo",
        progress: null,
        active: true,
        pomodoro: false,
      };
    }
    return {
      label: formatMSS(preset * 60),
      sub: "Pronto para começar",
      progress: 0,
      active: false,
      pomodoro: false,
    };
  }, [pomo, timer, now, preset]);

  const onStartPomo = () => {
    startPomo.mutate({
      taskId: taskId === "none" ? null : taskId,
      planned: preset,
      breakMinutes: preset >= 50 ? 10 : 5,
    });
  };

  const onStartTimer = () => {
    if (taskId === "none") return;
    startTimer.mutate({ taskId });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <TimerIcon className="h-3.5 w-3.5" /> Modo foco
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Pomodoro & cronômetro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trabalhe em blocos. O timer fica salvo no servidor e sincroniza entre suas abas e dispositivos.
        </p>
      </header>

      <FocusTimerDisplay
        display={display}
        taskId={taskId}
        startPomoPending={startPomo.isPending}
        startTimerPending={startTimer.isPending}
        stopPomoPending={stopPomo.isPending}
        stopTimerPending={stopTimer.isPending}
        onStartPomo={onStartPomo}
        onStartTimer={onStartTimer}
        onStopPomo={(completed) => stopPomo.mutate(completed)}
        onStopTimer={() => stopTimer.mutate()}
      />

      {!display.active && (
        <FocusSettings
          preset={preset}
          onPresetChange={setPreset}
          taskId={taskId}
          onTaskChange={setTaskId}
          tasks={tasks ?? []}
        />
      )}

      <section className="mt-8 rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Sons ambientes</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Toque em um som para começar. Volume e seleção persistem entre sessões.
        </p>
        <AmbientPlayer />
      </section>

      <FocusStats today={today} />
      <FocusWeeklyChart />
    </div>
  );
}
