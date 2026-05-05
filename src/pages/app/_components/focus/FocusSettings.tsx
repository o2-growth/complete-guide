import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FOCUS_PRESETS } from "./FocusSettings.utils";

interface TaskOption {
  id: string;
  title: string;
  code: string | null;
}

interface Props {
  preset: number;
  onPresetChange: (m: number) => void;
  taskId: string;
  onTaskChange: (id: string) => void;
  tasks: TaskOption[];
}

export function FocusSettings({ preset, onPresetChange, taskId, onTaskChange, tasks }: Props) {
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border bg-card p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Duração
        </p>
        <Select value={String(preset)} onValueChange={(v) => onPresetChange(Number(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FOCUS_PRESETS.map((p) => (
              <SelectItem key={p.minutes} value={String(p.minutes)}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Tarefa em foco
        </p>
        <Select value={taskId} onValueChange={onTaskChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem tarefa específica</SelectItem>
            {tasks.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.code ? `${t.code} · ` : ""}
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
