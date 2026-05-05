import { Play, Square, Timer as TimerIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DisplayState {
  label: string;
  sub: string;
  progress: number | null;
  active: boolean;
  pomodoro: boolean;
}

interface Props {
  display: DisplayState;
  taskId: string;
  startPomoPending: boolean;
  startTimerPending: boolean;
  stopPomoPending: boolean;
  stopTimerPending: boolean;
  onStartPomo: () => void;
  onStartTimer: () => void;
  onStopPomo: (completed: boolean) => void;
  onStopTimer: () => void;
}

export function FocusTimerDisplay({
  display,
  taskId,
  startPomoPending,
  startTimerPending,
  stopPomoPending,
  stopTimerPending,
  onStartPomo,
  onStartTimer,
  onStopPomo,
  onStopTimer,
}: Props) {
  return (
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
            <Button size="lg" onClick={onStartPomo} disabled={startPomoPending}>
              <Play className="mr-2 h-4 w-4" /> Iniciar Pomodoro
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onStartTimer}
              disabled={taskId === "none" || startTimerPending}
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
              onClick={() => onStopPomo(true)}
              disabled={stopPomoPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Concluir
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onStopPomo(false)}
              disabled={stopPomoPending}
            >
              <Square className="mr-2 h-4 w-4" /> Cancelar
            </Button>
          </>
        )}
        {display.active && !display.pomodoro && (
          <Button
            size="lg"
            variant="default"
            onClick={onStopTimer}
            disabled={stopTimerPending}
          >
            <Square className="mr-2 h-4 w-4" /> Parar e registrar
          </Button>
        )}
      </div>
    </section>
  );
}
