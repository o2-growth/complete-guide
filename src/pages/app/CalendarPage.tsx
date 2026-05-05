import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  rangeForView,
  shiftAnchor,
  fmt,
  type CalendarView,
} from "@/components/calendar/calendar-utils";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { AgendaView } from "@/components/calendar/AgendaView";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { useRescheduleTask, useTasksInRange } from "@/hooks/useTasks";

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [openId, setOpenId] = useState<string | null>(null);

  const { from, to } = useMemo(() => rangeForView(view, anchor), [view, anchor]);
  const { data: tasks, isLoading, error } = useTasksInRange(from, to);
  const reschedule = useRescheduleTask();

  const handleDrop = (taskId: string, target: Date, currentDueAt: string) => {
    // Em mês/agenda mantemos o horário; em semana/dia o target já tem hora.
    const keepTime = view === "month";
    reschedule.mutate({ taskId, newDate: target, keepTime, currentDueAt });
  };

  const headerLabel =
    view === "month"
      ? fmt(anchor, "MMMM 'de' yyyy")
      : view === "week"
        ? `${fmt(rangeForView("week", anchor).from, "d MMM")} – ${fmt(rangeForView("week", anchor).to, "d MMM yyyy")}`
        : view === "day"
          ? fmt(anchor, "EEEE, d 'de' MMMM 'de' yyyy")
          : `Agenda · próximos 30 dias`;

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">Calendário editorial</h1>
            <p className="text-sm text-muted-foreground capitalize">{headerLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Período anterior"
              onClick={() => setAnchor((a) => shiftAnchor(view, a, -1))}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setAnchor(new Date())}>
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Próximo período"
              onClick={() => setAnchor((a) => shiftAnchor(view, a, 1))}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
            <TabsList>
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="day">Dia</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        {error ? (
          <Card className="border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            Erro ao carregar calendário: {(error as Error).message}
          </Card>
        ) : isLoading || !tasks ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : view === "month" ? (
          <MonthView anchor={anchor} tasks={tasks} onOpenTask={setOpenId} onDropTask={handleDrop} />
        ) : view === "week" ? (
          <WeekView anchor={anchor} tasks={tasks} onOpenTask={setOpenId} onDropTask={handleDrop} />
        ) : view === "day" ? (
          <WeekView anchor={anchor} tasks={tasks} onOpenTask={setOpenId} onDropTask={handleDrop} singleDay />
        ) : (
          <AgendaView anchor={anchor} tasks={tasks} onOpenTask={setOpenId} />
        )}
      </div>

      <TaskDetailSheet taskId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  );
}