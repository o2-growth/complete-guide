import { useMemo, useState } from "react";
import { CalendarRange, Plane, Stethoscope, Calendar as CalIcon, Coffee, Sparkles, Trash2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  useCapacityData,
  useUpsertCapacity,
  useCreateTimeOff,
  useUpdateTimeOffStatus,
  useDeleteTimeOff,
  computeAvailableHours,
  TimeOffKind,
  MemberLite,
} from "@/hooks/useCapacity";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const KIND_META: Record<TimeOffKind, { label: string; icon: typeof Plane; color: string }> = {
  vacation: { label: "Férias", icon: Plane, color: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  sick: { label: "Atestado", icon: Stethoscope, color: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  holiday: { label: "Feriado", icon: CalIcon, color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  personal: { label: "Pessoal", icon: Coffee, color: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  other: { label: "Outro", icon: Sparkles, color: "bg-muted text-muted-foreground" },
};

function initials(p: MemberLite) {
  return (p.display_name || p.full_name || p.email || "?")
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

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

  // form state
  const [hoursWeek, setHoursWeek] = useState<number>(myCap?.hours_per_week ?? 40);
  const [dailyHours, setDailyHours] = useState<number>(myCap?.daily_hours ?? 8);
  const [workdays, setWorkdays] = useState<number[]>(myCap?.workdays ?? [1, 2, 3, 4, 5]);
  const [notes, setNotes] = useState<string>(myCap?.notes ?? "");

  // sync when capacity loads
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

  // 30-day projection per member
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

        {/* TEAM */}
        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disponibilidade — próximos 30 dias</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {projection.map(({ member, cap, calc, fullHours, utilization }) => (
                <div key={member.id} className="flex items-center gap-4 py-3">
                  <Avatar className="h-9 w-9">
                    {member.avatar_url && <AvatarImage src={member.avatar_url} alt="" />}
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(member)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{member.display_name || member.full_name || member.email}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {calc.availableHours.toFixed(0)}h / {fullHours.toFixed(0)}h
                        {calc.offDays > 0 && <span className="ml-2 text-amber-600 dark:text-amber-400">· {calc.offDays}d fora</span>}
                      </span>
                    </div>
                    <Progress value={utilization} className="mt-1.5 h-1.5" />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {cap ? `${cap.hours_per_week}h/sem · ${cap.daily_hours}h/dia` : "Sem configuração — usando padrão 40h/sem"}
                    </p>
                  </div>
                </div>
              ))}
              {projection.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhum membro ainda no workspace.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ME */}
        <TabsContent value="me" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Minha capacidade semanal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="hpw">Horas por semana</Label>
                  <Input
                    id="hpw"
                    type="number"
                    min={0}
                    max={168}
                    value={hoursWeek}
                    onChange={(e) => setHoursWeek(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dh">Horas por dia útil</Label>
                  <Input
                    id="dh"
                    type="number"
                    min={0}
                    max={24}
                    step={0.5}
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dias de trabalho</Label>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((lbl, idx) => {
                    const active = workdays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={cn(
                          "h-9 w-9 rounded-md border text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-muted",
                        )}
                        aria-pressed={active}
                        aria-label={`Dia ${idx}`}
                      >
                        {lbl}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">D=Domingo · S=Sábado</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Ex: trabalho remoto às sextas, evitar reuniões antes das 10h..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={() =>
                  upsert.mutate({
                    hours_per_week: hoursWeek,
                    daily_hours: dailyHours,
                    workdays,
                    notes: notes || null,
                  })
                }
                disabled={upsert.isPending}
              >
                Salvar capacidade
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIME OFF */}
        <TabsContent value="off" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Solicitar ausência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={offKind} onValueChange={(v) => setOffKind(v as TimeOffKind)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(KIND_META) as TimeOffKind[]).map((k) => (
                        <SelectItem key={k} value={k}>{KIND_META[k].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Início</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fim</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button
                    className="w-full"
                    onClick={() => createOff.mutate({ kind: offKind, start_date: startDate, end_date: endDate, reason })}
                    disabled={createOff.isPending}
                  >
                    Solicitar
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: viagem programada" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ausências registradas</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {data.timeOff.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma ausência registrada ainda.</p>
              )}
              {data.timeOff.map((off) => {
                const meta = KIND_META[off.kind];
                const Icon = meta.icon;
                const member = data.members.find((m) => m.id === off.user_id);
                const isMine = off.user_id === user?.id;
                const isPending = off.status === "pending";
                return (
                  <div key={off.id} className="flex items-center gap-3 py-3">
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-md", meta.color)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {meta.label} · {fmtDate(off.start_date)} → {fmtDate(off.end_date)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {member?.display_name || member?.full_name || member?.email || "—"}
                        {off.reason && <span className="ml-2 italic">"{off.reason}"</span>}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        off.status === "approved" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        off.status === "rejected" && "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
                        off.status === "pending" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                        off.status === "cancelled" && "border-muted text-muted-foreground",
                      )}
                    >
                      {off.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {isPending && (
                        <>
                          <Button size="icon" variant="ghost" aria-label="Aprovar" onClick={() => updateStatus.mutate({ id: off.id, status: "approved" })}>
                            <Check className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button size="icon" variant="ghost" aria-label="Recusar" onClick={() => updateStatus.mutate({ id: off.id, status: "rejected" })}>
                            <X className="h-4 w-4 text-rose-600" />
                          </Button>
                        </>
                      )}
                      {isMine && (
                        <Button size="icon" variant="ghost" aria-label="Remover" onClick={() => removeOff.mutate(off.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}