import { Coffee, Timer as TimerIcon, CheckCircle2 } from "lucide-react";

interface Today {
  completed: number;
  pomosToday: number;
  totalMin: number;
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

export function FocusStats({ today }: { today?: Today }) {
  return (
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
  );
}
