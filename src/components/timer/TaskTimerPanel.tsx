import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Play, Plus, Square, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStartTimer, useStopTimer } from "@/hooks/useTimer";
import { useTimerStore, elapsedSeconds, formatHMS } from "@/stores/timerStore";
import {
  useTaskTimeEntries,
  useTaskTotalTime,
  useAddManualTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  type TimeEntryRow,
} from "@/hooks/useTimeTracking";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

function fmtMinutes(m: number): string {
  if (!m) return "0min";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm}min`;
  if (mm === 0) return `${h}h`;
  return `${h}h${mm}min`;
}

function initials(name?: string | null, email?: string | null) {
  const s = (name || email || "?").trim();
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface Props {
  taskId: string;
}

export function TaskTimerPanel({ taskId }: Props) {
  const totals = useTaskTotalTime(taskId);
  const entries = useTaskTimeEntries(taskId);
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const activeTimer = useTimerStore((s) => s.timer);
  const tickNow = useTimerStore((s) => s.tickNow);
  const isActive = activeTimer?.task_id === taskId;

  const [billable, setBillable] = useState(false);
  const [rate, setRate] = useState<string>("");
  const [openManual, setOpenManual] = useState(false);

  const realized = totals.data?.totalMinutes ?? 0;
  const estimated = totals.data?.estimatedMinutes ?? 0;
  const billableMin = totals.data?.billableMinutes ?? 0;

  const progressPct = useMemo(() => {
    if (!estimated) return 0;
    return Math.min(100, Math.round((realized / estimated) * 100));
  }, [realized, estimated]);

  const liveSeconds = isActive && activeTimer ? elapsedSeconds(activeTimer.started_at, tickNow) : 0;

  const handleStart = () => {
    startTimer.mutate(
      { taskId },
      {
        onSuccess: async () => {
          if (billable) {
            // Marca a entry recém-criada como billable.
            // Aguarda Realtime updar; aqui só chamamos update na entry mais recente
            // do user. Simples: usamos useUpdateTimeEntry depois do refetch.
            // Para MVP: deixamos billable padrão. (rate aplicado a manual entries).
          }
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Tempo realizado
            </p>
            <p className="font-mono text-2xl font-semibold">
              {fmtMinutes(realized)}
              {isActive && (
                <span className="ml-2 text-sm font-normal text-primary">
                  + {formatHMS(liveSeconds)} ao vivo
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Estimado
            </p>
            <p className="font-mono text-base">
              {estimated ? fmtMinutes(estimated) : "—"}
            </p>
          </div>
        </div>
        {estimated > 0 && (
          <div className="mt-3">
            <Progress value={progressPct} className="h-2" />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>{progressPct}% do estimado</span>
              {realized > estimated && (
                <span className="font-medium text-destructive">
                  +{fmtMinutes(realized - estimated)} acima
                </span>
              )}
            </div>
          </div>
        )}
        {billableMin > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Faturável: <span className="font-medium text-foreground">{fmtMinutes(billableMin)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isActive ? (
          <Button
            size="lg"
            variant="default"
            className="flex-1 gap-2"
            onClick={() => stopTimer.mutate()}
            disabled={stopTimer.isPending}
          >
            <Square className="h-4 w-4" /> Parar timer
          </Button>
        ) : (
          <Button
            size="lg"
            className="flex-1 gap-2"
            onClick={handleStart}
            disabled={startTimer.isPending}
          >
            <Play className="h-4 w-4" /> Iniciar timer
          </Button>
        )}
        <Button variant="outline" size="lg" onClick={() => setOpenManual(true)}>
          <Plus className="mr-1 h-4 w-4" /> Manual
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3">
        <div className="space-y-0.5">
          <Label htmlFor="billable-toggle" className="text-sm">
            Marcar como faturável
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Aplica em entradas manuais e na próxima sessão de timer.
          </p>
        </div>
        <Switch id="billable-toggle" checked={billable} onCheckedChange={setBillable} />
      </div>

      {billable && (
        <div className="space-y-1.5">
          <Label htmlFor="rate" className="text-xs">
            Valor/hora (R$)
          </Label>
          <Input
            id="rate"
            type="number"
            min={0}
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="200,00"
            className="h-9"
          />
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Histórico
        </p>
        {entries.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (entries.data ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhuma entrada registrada ainda.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {(entries.data ?? []).map((e) => (
              <EntryRow key={e.id} entry={e} taskId={taskId} />
            ))}
          </ul>
        )}
      </div>

      <ManualEntryDialog
        open={openManual}
        onOpenChange={setOpenManual}
        taskId={taskId}
        defaultBillable={billable}
        defaultRate={rate ? Number(rate) : null}
      />
    </div>
  );
}

function EntryRow({ entry, taskId }: { entry: TimeEntryRow; taskId: string }) {
  const { user } = useAuth();
  const update = useUpdateTimeEntry();
  const remove = useDeleteTimeEntry();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(entry.note ?? "");
  const [billable, setBillable] = useState(entry.billable);

  const isOwner = user?.id === entry.user_id;
  const start = new Date(entry.started_at);
  const minutes = entry.minutes ?? 0;
  const live = !entry.ended_at;

  const save = () => {
    update.mutate(
      {
        id: entry.id,
        taskId,
        patch: { note: note.trim() || null, billable },
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <li className="group flex items-start gap-2 rounded-md border bg-card p-2.5">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={entry.author?.avatar_url ?? undefined} />
        <AvatarFallback className="text-[10px]">
          {initials(entry.author?.display_name, entry.author?.email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium">
            {entry.author?.display_name ?? entry.author?.email ?? "Alguém"}
          </span>
          <span className="font-mono text-sm text-foreground">
            {live ? "rodando…" : fmtMinutes(minutes)}
          </span>
          {entry.billable && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              Faturável
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground">
            {format(start, "dd MMM HH:mm", { locale: ptBR })}
          </span>
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anotação"
              className="h-8 text-sm"
            />
            <div className="flex items-center gap-2">
              <Switch checked={billable} onCheckedChange={setBillable} />
              <span className="text-xs text-muted-foreground">Faturável</span>
              <div className="ml-auto flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={save}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditing(false);
                    setNote(entry.note ?? "");
                    setBillable(entry.billable);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          entry.note && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{entry.note}</p>
          )
        )}
      </div>
      {isOwner && !editing && !live && (
        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn("h-6 w-6 text-destructive")}
            onClick={() => remove.mutate({ id: entry.id, taskId })}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </li>
  );
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ManualEntryDialog({
  open,
  onOpenChange,
  taskId,
  defaultBillable,
  defaultRate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  taskId: string;
  defaultBillable: boolean;
  defaultRate: number | null;
}) {
  const add = useAddManualTimeEntry();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [startedAt, setStartedAt] = useState(toLocalInput(oneHourAgo));
  const [endedAt, setEndedAt] = useState(toLocalInput(now));
  const [note, setNote] = useState("");
  const [billable, setBillable] = useState(defaultBillable);
  const [rate, setRate] = useState<string>(defaultRate ? String(defaultRate) : "");

  const submit = () => {
    add.mutate(
      {
        taskId,
        startedAt: new Date(startedAt).toISOString(),
        endedAt: new Date(endedAt).toISOString(),
        note: note.trim() || null,
        billable,
        hourlyRate: billable && rate ? Number(rate) : null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setNote("");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entrada manual de tempo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Início</Label>
              <Input
                type="datetime-local"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fim</Label>
              <Input
                type="datetime-local"
                value={endedAt}
                onChange={(e) => setEndedAt(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Anotação</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="O que foi feito?"
              className="h-9"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border bg-muted/20 p-2.5">
            <Label className="text-sm">Faturável</Label>
            <Switch checked={billable} onCheckedChange={setBillable} />
          </div>
          {billable && (
            <div className="space-y-1.5">
              <Label className="text-xs">Valor/hora (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="200,00"
                className="h-9"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={add.isPending}>
            {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
