import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { queryProfile } from "@/lib/query-config";

interface DayBucket {
  iso: string;
  label: string;
  minutes: number;
}

export function FocusWeeklyChart() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    ...queryProfile("analytics"),
    queryKey: ["focus-week", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = startOfDay(subDays(new Date(), 6));
      const { data: rows, error } = await supabase
        .from("pomodoros")
        .select("started_at, planned_minutes, completed")
        .eq("user_id", user!.id)
        .eq("completed", true)
        .gte("started_at", since.toISOString());
      if (error) throw error;
      return rows ?? [];
    },
  });

  const buckets = useMemo<DayBucket[]>(() => {
    const out: DayBucket[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      out.push({
        iso: day.toISOString().slice(0, 10),
        label: format(day, "EEE dd", { locale: ptBR }),
        minutes: 0,
      });
    }
    (data ?? []).forEach((r) => {
      if (!r.started_at) return;
      const k = startOfDay(new Date(r.started_at)).toISOString().slice(0, 10);
      const b = out.find((x) => x.iso === k);
      if (b) b.minutes += r.planned_minutes ?? 0;
    });
    return out;
  }, [data]);

  const total = buckets.reduce((s, b) => s + b.minutes, 0);

  return (
    <section className="mt-6 rounded-xl border bg-card p-4">
      <header className="mb-3 flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Minutos focados — últimos 7 dias
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {total >= 60 ? `${Math.floor(total / 60)}h ${total % 60}m` : `${total}m`}
          </p>
        </div>
        {isLoading && <span className="text-xs text-muted-foreground">Carregando…</span>}
      </header>
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--popover))",
              }}
              formatter={(value: number) => [`${value} min`, "Foco"]}
            />
            <Bar
              dataKey="minutes"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
