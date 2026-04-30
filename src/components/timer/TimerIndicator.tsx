import { useNavigate } from "react-router-dom";
import { Play, Square, Timer as TimerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimerStore, elapsedSeconds, formatHMS, formatMSS } from "@/stores/timerStore";
import { useStartTimer, useStopTimer, useStopPomodoro } from "@/hooks/useTimer";
import { cn } from "@/lib/utils";

/**
 * Indicador global de timer/pomodoro no Topbar.
 * Mostra HH:MM:SS para timer comum, ou contagem regressiva para pomodoro.
 */
export function TimerIndicator() {
  const navigate = useNavigate();
  const timer = useTimerStore((s) => s.timer);
  const pomo = useTimerStore((s) => s.pomodoro);
  const now = useTimerStore((s) => s.tickNow);
  const stopTimer = useStopTimer();
  const stopPomo = useStopPomodoro();

  if (!timer && !pomo) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs text-muted-foreground"
        onClick={() => navigate("/app/foco")}
      >
        <TimerIcon className="h-3.5 w-3.5" />
        Foco
      </Button>
    );
  }

  if (pomo) {
    const total = pomo.planned_minutes * 60;
    const elapsed = elapsedSeconds(pomo.started_at, now);
    const remaining = Math.max(0, total - elapsed);
    const overtime = elapsed > total;
    return (
      <div
        className={cn(
          "flex items-center gap-1 rounded-md border bg-primary/10 px-2 py-1",
          overtime && "bg-destructive/10",
        )}
      >
        <button
          onClick={() => navigate("/app/foco")}
          className="flex items-center gap-1.5 text-xs font-mono font-semibold text-primary"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          {overtime ? `+${formatMSS(elapsed - total)}` : formatMSS(remaining)}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => stopPomo.mutate(!overtime ? false : true)}
          aria-label="Parar pomodoro"
        >
          <Square className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Timer comum
  const elapsed = elapsedSeconds(timer!.started_at, now);
  return (
    <div className="flex items-center gap-1 rounded-md border bg-accent/15 px-2 py-1">
      <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        {formatHMS(elapsed)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => stopTimer.mutate()}
        aria-label="Parar timer"
      >
        <Square className="h-3 w-3" />
      </Button>
    </div>
  );
}

/**
 * Botão compacto para iniciar/parar timer em uma tarefa específica.
 */
export function TaskTimerButton({ taskId, size = "sm" }: { taskId: string; size?: "sm" | "icon" }) {
  const timer = useTimerStore((s) => s.timer);
  const stop = useStopTimer();
  const startTimer = useStartTimer();
  const isActive = timer?.task_id === taskId;

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) stop.mutate();
    else startTimer.mutate({ taskId });
  };

  if (size === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-7 w-7", isActive && "text-primary")}
        onClick={onClick}
        aria-label={isActive ? "Parar timer" : "Iniciar timer"}
        data-no-open
      >
        {isActive ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
    );
  }

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      className="h-8 gap-1.5"
      onClick={onClick}
      data-no-open
    >
      {isActive ? (
        <>
          <Square className="h-3.5 w-3.5" /> Parar
        </>
      ) : (
        <>
          <Play className="h-3.5 w-3.5" /> Iniciar timer
        </>
      )}
    </Button>
  );
}