import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Play, Square, Coffee, Timer as TimerIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const PRESETS: { label: string; minutes: number }[] = [
  { label: "Pomodoro 25/5", minutes: 25 },
  { label: "Curto 15/3", minutes: 15 },
  { label: "Foco profundo 50/10", minutes: 50 },
  { label: "Maratona 90/15", minutes: 90 },
];

export default function FocusPage() {
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  const [taskId, setTaskId] = useState<string>("none");
  const [preset, setPreset] = useState<number>(25);

  const startPomo = useStartPomodoro();
  const stopPomo = useStopPomodoro();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const pomo = useTimerStore((s) => s.pomodoro);
  const timer = useTimerStore((s) => s.timer);
  const now = useTimerStore((s) => s.tickNow);

  // tarefas atribuídas a mim, ativas
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

  // estatísticas de hoje
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

  // auto-stop ao chegar em 0 e tocar bipe
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
    <>
      <Helmet>
        <title>Foco — Pomodoro & Cronômetro | Oxy Growth OS</title>
        <meta
          name="description"
          content="Sessões de foco com Pomodoro e cronômetro contínuo, sincronizados em tempo real entre dispositivos."
        />
      </Helmet>

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

        {/* Display principal */}
        <section
          className={cn(
            "relative overflow-hidden rounded-2xl border bg-card p-8 text-center shadow-sm",
            display.active && "ring-2 ring-primary/30",
          )}
        >
          {display.progress !== null && (
            <div
              className="absolute inset-x-0 top-0 h-1 bg-primary transition-[width] duration-1000"
              style={{ width: `${display.progress}%` }}
            />
          )}
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {display.sub}
          </p>
          <p className="mt-2 font-mono text-7xl font-bold tabular-nums sm:text-8xl">
            {display.label}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {!display.active && (
              <>
                <Button size="lg" onClick={onStartPomo} disabled={startPomo.isPending}>
                  <Play className="mr-2 h-4 w-4" /> Iniciar Pomodoro
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onStartTimer}
                  disabled={taskId === "none" || startTimer.isPending}
                >
                  <TimerIcon className="mr-2 h-4 w-4" /> Cronômetro contínuo
                </Button>
              </>
            )}
            {display.active && display.pomodoro && (
              <>
                <Button
                  size="lg"
                  variant="default"
                  onClick={() => stopPomo.mutate(true)}
                  disabled={stopPomo.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Concluir
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => stopPomo.mutate(false)}
                  disabled={stopPomo.isPending}
                >
                  <Square className="mr-2 h-4 w-4" /> Cancelar
                </Button>
              </>
            )}
            {display.active && !display.pomodoro && (
              <Button
                size="lg"
                variant="default"
                onClick={() => stopTimer.mutate()}
                disabled={stopTimer.isPending}
              >
                <Square className="mr-2 h-4 w-4" /> Parar e registrar
              </Button>
            )}
          </div>
        </section>

        {/* Configurações */}
        {!display.active && (
          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Duração
              </p>
              <Select value={String(preset)} onValueChange={(v) => setPreset(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.minutes} value={String(p.minutes)}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tarefa em foco
              </p>
              <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem tarefa específica</SelectItem>
                  {(tasks ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.code ? `${t.code} · ` : ""}
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>
        )}

        {/* Stats hoje */}
        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Pomodoros concluídos"
            value={today?.completed ?? 0}
          />
          <StatCard
            icon={<TimerIcon className="h-4 w-4" />}
            label="Sessões iniciadas"
            value={today?.pomosToday ?? 0}
          />
          <StatCard
            icon={<Coffee className="h-4 w-4" />}
            label="Tempo registrado"
            value={
              today?.totalMin
                ? today.totalMin >= 60
                  ? `${Math.floor(today.totalMin / 60)}h ${today.totalMin % 60}m`
                  : `${today.totalMin}m`
                : "0m"
            }
          />
        </section>
      </div>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span className="uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}