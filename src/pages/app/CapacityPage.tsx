import { useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCapacityData,
  useUpsertCapacity,
  useCreateTimeOff,
  useUpdateTimeOffStatus,
  useDeleteTimeOff,
  computeAvailableHours,
  TimeOffKind,
} from "@/hooks/useCapacity";
import { useAuth } from "@/hooks/useAuth";
import { CapacityTeamView } from "./_components/capacity/CapacityTeamView";
import { CapacityMeForm } from "./_components/capacity/CapacityMeForm";
import { CapacityTimeOff } from "./_components/capacity/CapacityTimeOff";

export default function CapacityPage() {
  const { data, isLoading } = useCapacityData();
  const { user } = useAuth();
  const upsert = useUpsertCapacity();
  const createOff = useCreateTimeOff();
  const updateStatus = useUpdateTimeOffStatus();
  const removeOff = useDeleteTimeOff();

  const myCap = useMemo(
    () => data?.capacities.find((c) => c.user_id === user?.id),
    [data, user],
  );

  const [hoursWeek, setHoursWeek] = useState<number>(myCap?.hours_per_week ?? 40);
  const [dailyHours, setDailyHours] = useState<number>(myCap?.daily_hours ?? 8);
  const [workdays, setWorkdays] = useState<number[]>(myCap?.workdays ?? [1, 2, 3, 4, 5]);
  const [notes, setNotes] = useState<string>(myCap?.notes ?? "");

  useMemo(() => {
    if (myCap) {
      setHoursWeek(myCap.hours_per_week);
      setDailyHours(myCap.daily_hours);
      setWorkdays(myCap.workdays);
      setNotes(myCap.notes ?? "");
    }
  }, [myCap]);

  const [offKind, setOffKind] = useState<TimeOffKind>("vacation");
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState("");

  const projection = useMemo(() => {
    if (!data) return [];
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 29);
    return data.members.map((m) => {
      const cap = data.capacities.find((c) => c.user_id === m.id);
      const offs = data.timeOff.filter((t) => t.user_id === m.id);
      const calc = computeAvailableHours(cap, offs, from, to);
      const fullHours = calc.workdays * (cap?.daily_hours ?? 8);
      const utilization = fullHours > 0 ? (calc.availableHours / fullHours) * 100 : 0;
      return { member: m, cap, offs, calc, fullHours, utilization };
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!data) return null;

  const toggleDay = (d: number) =>
    setWorkdays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <header>
        <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
          <CalendarRange className="mr-1.5 h-3 w-3" /> Capacity Planning · Fase 2 · Passo 18
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Planejamento de Capacidade</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina horas semanais, dias de trabalho e ausências. A equipe vê quanto cada pessoa tem disponível nos próximos 30 dias.
        </p>
      </header>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Visão da equipe</TabsTrigger>
          <TabsTrigger value="me">Minha capacidade</TabsTrigger>
          <TabsTrigger value="off">Ausências</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          <CapacityTeamView projection={projection} />
        </TabsContent>

        <TabsContent value="me" className="mt-4">
          <CapacityMeForm
            hoursWeek={hoursWeek}
            dailyHours={dailyHours}
            workdays={workdays}
            notes={notes}
            saving={upsert.isPending}
            onChangeHoursWeek={setHoursWeek}
            onChangeDailyHours={setDailyHours}
            onToggleDay={toggleDay}
            onChangeNotes={setNotes}
            onSave={() =>
              upsert.mutate({
                hours_per_week: hoursWeek,
                daily_hours: dailyHours,
                workdays,
                notes: notes || null,
              })
            }
          />
        </TabsContent>

        <TabsContent value="off" className="mt-4">
          <CapacityTimeOff
            offKind={offKind}
            startDate={startDate}
            endDate={endDate}
            reason={reason}
            creating={createOff.isPending}
            members={data.members}
            timeOff={data.timeOff}
            currentUserId={user?.id}
            onChangeOffKind={setOffKind}
            onChangeStart={setStartDate}
            onChangeEnd={setEndDate}
            onChangeReason={setReason}
            onCreate={() => createOff.mutate({ kind: offKind, start_date: startDate, end_date: endDate, reason })}
            onUpdateStatus={(id, status) => updateStatus.mutate({ id, status })}
            onDelete={(id) => removeOff.mutate(id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
