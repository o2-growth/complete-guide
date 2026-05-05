import { useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Download, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useUserTimesheet, type TimesheetDayRow } from "@/hooks/useTimeTracking";
import { SEO } from "@/components/SEO";

type RangeKind = "week" | "month" | "custom";

function fmtMinutes(m: number): string {
  if (!m) return "0min";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm}min`;
  if (mm === 0) return `${h}h`;
  return `${h}h${mm}min`;
}

function fmtMoney(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function toDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function csvEscape(v: string): string {
  if (v.includes(",") || v.includes("\"") || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function downloadCsv(rows: TimesheetDayRow[]) {
  const header = ["Dia", "Total (min)", "Faturável (min)", "Valor (R$)", "Tarefas"].join(",");
  const lines = rows.map((r) =>
    [
      csvEscape(format(new Date(r.day + "T00:00:00"), "dd/MM/yyyy")),
      r.total_minutes,
      r.billable_minutes,
      r.total_amount.toFixed(2),
      r.task_count,
    ].join(","),
  );
  const blob = new Blob([[header, ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `timesheet-${format(new Date(), "yyyyMMdd")}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function TimesheetPage() {
  const { user } = useAuth();
  // `today` é congelado por sessão de página — evita re-render infinito em useMemo.
  const today = useMemo(() => new Date(), []);
  const [range, setRange] = useState<RangeKind>("week");
  const [customStart, setCustomStart] = useState(toDateInput(startOfWeek(today, { locale: ptBR })));
  const [customEnd, setCustomEnd] = useState(toDateInput(endOfWeek(today, { locale: ptBR })));

  const { start, end } = useMemo(() => {
    if (range === "month") {
      return { start: startOfMonth(today), end: addDays(endOfMonth(today), 1) };
    }
    if (range === "custom") {
      return {
        start: new Date(customStart + "T00:00:00"),
        end: addDays(new Date(customEnd + "T00:00:00"), 1),
      };
    }
    return {
      start: startOfWeek(today, { locale: ptBR }),
      end: addDays(endOfWeek(today, { locale: ptBR }), 1),
    };
  }, [range, customStart, customEnd, today]);

  const userId = user?.id ?? null;
  const query = useUserTimesheet(userId, start, end);
  const rows = useMemo(() => query.data ?? [], [query.data]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        total: acc.total + r.total_minutes,
        billable: acc.billable + r.billable_minutes,
        amount: acc.amount + r.total_amount,
      }),
      { total: 0, billable: 0, amount: 0 },
    );
  }, [rows]);

  const chartData = useMemo(
    () =>
      [...rows]
        .reverse()
        .map((r) => ({
          day: format(new Date(r.day + "T00:00:00"), "dd/MM"),
          horas: Math.round((r.total_minutes / 60) * 100) / 100,
          faturavel: Math.round((r.billable_minutes / 60) * 100) / 100,
        })),
    [rows],
  );

  return (
    <>
      <SEO title="Timesheet — Oxy Growth OS" />
      <div className="space-y-6 p-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Timesheet</h1>
              <p className="text-sm text-muted-foreground">
                Suas horas trabalhadas e horas faturáveis por período.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => downloadCsv(rows)} disabled={!rows.length}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </header>

        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="space-y-1">
              <Label className="text-xs">Período</Label>
              <Select value={range} onValueChange={(v) => setRange(v as RangeKind)}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana atual</SelectItem>
                  <SelectItem value="month">Mês atual</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {range === "custom" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">De</Label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Até</Label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-9"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Total" value={fmtMinutes(totals.total)} />
          <SummaryCard label="Faturável" value={fmtMinutes(totals.billable)} />
          <SummaryCard label="Valor faturável" value={fmtMoney(totals.amount)} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Horas por dia</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {chartData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sem dados no período.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="horas" fill="hsl(var(--primary))" name="Total (h)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="faturavel" fill="hsl(var(--accent))" name="Faturável (h)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhamento</CardTitle>
          </CardHeader>
          <CardContent>
            {query.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum registro de tempo no período.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Faturável</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Tarefas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.day}>
                      <TableCell>
                        {format(new Date(r.day + "T00:00:00"), "EEE, dd MMM", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {fmtMinutes(r.total_minutes)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {fmtMinutes(r.billable_minutes)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {r.total_amount > 0 ? fmtMoney(r.total_amount) : "—"}
                      </TableCell>
                      <TableCell className="text-right">{r.task_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-mono text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
