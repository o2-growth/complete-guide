import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { useRescheduleTask, useTasksInRange } from "@/hooks/useTasks";

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [openId, setOpenId] = useState<string | null>(null);

  const { from, to } = useMemo(() => rangeForView(view, anchor), [view, anchor]);
  const { data: tasks, isLoading, error, refetch } = useTasksInRange(from, to);
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
      <PageHeader
        icon={CalendarDays}
        title="Calendário editorial"
        description={headerLabel}
        actions={
          <>
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
          </>
        }
      />

      <div className="min-h-0 flex-1">
        {error ? (
          <ErrorState
            title="Não foi possível carregar o calendário"
            description={(error as Error).message}
            onRetry={() => refetch()}
          />
        ) : isLoading || !tasks ? (
          <ListSkeleton rows={6} />
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