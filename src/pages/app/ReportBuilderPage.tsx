import { useMemo, useState } from "react";
import { Plus, Save, Trash2, Star, RefreshCw, FileBarChart, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useSavedReports, useUpsertReport, useDeleteReport, useRunReport,
  useRefreshWarehouse, TASK_METRICS, TASK_DIMENSIONS, POST_METRICS, POST_DIMENSIONS,
  type ReportSource, type ChartType, type SavedReport,
} from "@/hooks/useWarehouse";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#0EA5E9", "#FCD34D", "#10B981", "#F97316", "#8B5CF6", "#EC4899", "#06B6D4", "#EF4444"];

export default function ReportBuilderPage() {
  const { data: reports = [] } = useSavedReports();
  const upsert = useUpsertReport();
  const del = useDeleteReport();
  const refresh = useRefreshWarehouse();
  const [selected, setSelected] = useState<SavedReport | null>(null);

  const draft = selected ?? {
    id: undefined as string | undefined,
    name: "Novo relatório",
    source: "tasks" as ReportSource,
    metrics: ["done_count"] as string[],
    dimensions: ["d"] as string[],
    filters: {} as Record<string, string>,
    chart_type: "bar" as ChartType,
    is_favorite: false,
  };

  const [form, setForm] = useState(draft);
  const isNew = !form.id;

  // sync when selecting
  const onSelect = (r: SavedReport) => {
    setSelected(r);
    setForm({ ...r });
  };

  const onNew = () => {
    setSelected(null);
    setForm({ id: undefined, name: "Novo relatório", source: "tasks",
             metrics: ["done_count"], dimensions: ["d"], filters: {}, chart_type: "bar", is_favorite: false });
  };

  const metrics = form.source === "tasks" ? TASK_METRICS : POST_METRICS;
  const dimensions = form.source === "tasks" ? TASK_DIMENSIONS : POST_DIMENSIONS;

  const toggle = (key: string, list: string[]) =>
    list.includes(key) ? list.filter((x) => x !== key) : [...list, key];

  const { data: result, refetch, isFetching } = useRunReport(form.id ?? null);
  const rows = useMemo(() => result?.rows ?? [], [result]);

  const xKey = form.dimensions[0] ?? "d";

  return (
    <div className="space-y-4 p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileBarChart className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Report Builder</h1>
          <p className="text-sm text-muted-foreground">
            Construa relatórios escolhendo métricas, dimensões e tipo de gráfico. Salve favoritos do workspace.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`} />
          Atualizar warehouse
        </Button>
        <Button size="sm" onClick={onNew}>
          <Plus className="mr-2 h-4 w-4" />Novo
        </Button>
      </header>

      <div className="grid grid-cols-12 gap-4">
        {/* Lista */}
        <Card className="col-span-3 p-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Salvos</div>
          <div className="space-y-1 max-h-[600px] overflow-auto">
            {reports.length === 0 && <p className="text-sm text-muted-foreground">Nenhum relatório ainda.</p>}
            {reports.map((r) => (
              <button key={r.id} onClick={() => onSelect(r)}
                className={`w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-accent flex items-center gap-2 ${selected?.id === r.id ? "bg-accent" : ""}`}>
                {r.is_favorite && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                <span className="truncate flex-1">{r.name}</span>
                <Badge variant="outline" className="text-[10px]">{r.source}</Badge>
              </button>
            ))}
          </div>
        </Card>

        {/* Builder */}
        <Card className="col-span-9 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                   className="text-base font-semibold" />
            <Button variant="ghost" size="icon" onClick={() => setForm({ ...form, is_favorite: !form.is_favorite })}>
              <Star className={`h-4 w-4 ${form.is_favorite ? "fill-amber-500 text-amber-500" : ""}`} />
            </Button>
            <Button size="sm" onClick={async () => {
              const id = await upsert.mutateAsync(form);
              if (typeof id === "string") setForm({ ...form, id });
            }}>
              <Save className="mr-2 h-4 w-4" />Salvar
            </Button>
            {form.id ? (
              <Button variant="outline" size="icon" onClick={() => { if (form.id) { del.mutate(form.id); onNew(); } }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Fonte de dados</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as ReportSource, metrics: [], dimensions: ["d"] })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tasks">Tarefas (fact_tasks_daily)</SelectItem>
                  <SelectItem value="posts">Posts sociais (fact_posts_daily)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo de gráfico</Label>
              <Select value={form.chart_type} onValueChange={(v) => setForm({ ...form, chart_type: v as ChartType })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Barras</SelectItem>
                  <SelectItem value="line">Linha</SelectItem>
                  <SelectItem value="pie">Pizza</SelectItem>
                  <SelectItem value="table">Tabela</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">De</Label>
                <Input type="date" className="h-9" value={form.filters.date_from ?? ""}
                       onChange={(e) => setForm({ ...form, filters: { ...form.filters, date_from: e.target.value } })} />
              </div>
              <div>
                <Label className="text-xs">Até</Label>
                <Input type="date" className="h-9" value={form.filters.date_to ?? ""}
                       onChange={(e) => setForm({ ...form, filters: { ...form.filters, date_to: e.target.value } })} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Métricas</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {metrics.map((m) => (
                  <Badge key={m.key} variant={form.metrics.includes(m.key) ? "default" : "outline"}
                         className="cursor-pointer"
                         onClick={() => setForm({ ...form, metrics: toggle(m.key, form.metrics) })}>
                    {m.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Dimensões (agrupar por)</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {dimensions.map((d) => (
                  <Badge key={d.key} variant={form.dimensions.includes(d.key) ? "default" : "outline"}
                         className="cursor-pointer"
                         onClick={() => setForm({ ...form, dimensions: toggle(d.key, form.dimensions) })}>
                    {d.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Resultado</h3>
              <Button size="sm" variant="outline" onClick={() => refetch()} disabled={!form.id || isFetching}>
                <Play className="mr-2 h-3.5 w-3.5" />Executar
              </Button>
            </div>
            {!form.id && <p className="text-sm text-muted-foreground">Salve o relatório para executar.</p>}
            {form.id && rows.length === 0 && <p className="text-sm text-muted-foreground">Sem dados. Tente atualizar o warehouse.</p>}
            {form.id && rows.length > 0 && form.chart_type !== "table" && (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  {form.chart_type === "bar" ? (
                    <BarChart data={rows}>
                      <XAxis dataKey={xKey} fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Legend />
                      {form.metrics.map((m, i) => <Bar key={m} dataKey={m} fill={COLORS[i % COLORS.length]} />)}
                    </BarChart>
                  ) : form.chart_type === "line" ? (
                    <LineChart data={rows}>
                      <XAxis dataKey={xKey} fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Legend />
                      {form.metrics.map((m, i) => <Line key={m} type="monotone" dataKey={m} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />)}
                    </LineChart>
                  ) : (
                    <PieChart>
                      <Tooltip />
                      <Pie data={rows} dataKey={form.metrics[0] ?? "total"} nameKey={xKey} cx="50%" cy="50%" outerRadius={100} label>
                        {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
            {form.id && rows.length > 0 && form.chart_type === "table" && (
              <div className="overflow-auto max-h-72 rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {Object.keys(rows[0]).map((k) => <th key={k} className="px-3 py-2 text-left font-medium">{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t">
                        {Object.keys(rows[0]).map((k) => <td key={k} className="px-3 py-1.5">{String(r[k] ?? "")}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}