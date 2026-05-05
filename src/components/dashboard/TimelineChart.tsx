import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Componente isolado para code-splitting: recharts só carrega quando este chunk é solicitado.
type Point = { date: string; criadas: number; concluidas: number };

export default function TimelineChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="criadas" stroke="#0EA5E9" strokeWidth={2} dot={false} name="Criadas" />
        <Line type="monotone" dataKey="concluidas" stroke="#22c55e" strokeWidth={2} dot={false} name="Concluídas" />
      </LineChart>
    </ResponsiveContainer>
  );
}
