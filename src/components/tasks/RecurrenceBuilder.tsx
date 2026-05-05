import { useEffect, useMemo, useState } from "react";
import { RRule, Frequency, Weekday } from "rrule";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export interface RecurrenceBuilderProps {
  value: string | null;
  onChange: (rule: string | null) => void;
  dtstart?: Date;
  className?: string;
}

type PresetId =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "weekdays"
  | "custom";

const PRESETS: Array<{ id: PresetId; label: string }> = [
  { id: "none", label: "Sem repetição" },
  { id: "daily", label: "Todo dia" },
  { id: "weekly", label: "Toda semana" },
  { id: "monthly", label: "Todo mês" },
  { id: "yearly", label: "Todo ano" },
  { id: "weekdays", label: "Dias úteis (seg-sex)" },
  { id: "custom", label: "Personalizado" },
];

const WEEKDAYS: Array<{ id: number; label: string; short: string; rr: Weekday }> = [
  { id: 0, label: "Segunda", short: "S", rr: RRule.MO },
  { id: 1, label: "Terça", short: "T", rr: RRule.TU },
  { id: 2, label: "Quarta", short: "Q", rr: RRule.WE },
  { id: 3, label: "Quinta", short: "Q", rr: RRule.TH },
  { id: 4, label: "Sexta", short: "S", rr: RRule.FR },
  { id: 5, label: "Sábado", short: "S", rr: RRule.SA },
  { id: 6, label: "Domingo", short: "D", rr: RRule.SU },
];

const FREQ_LABEL: Record<number, string> = {
  [RRule.DAILY]: "dia",
  [RRule.WEEKLY]: "semana",
  [RRule.MONTHLY]: "mês",
  [RRule.YEARLY]: "ano",
};

const FREQ_LABEL_PLURAL: Record<number, string> = {
  [RRule.DAILY]: "dias",
  [RRule.WEEKLY]: "semanas",
  [RRule.MONTHLY]: "meses",
  [RRule.YEARLY]: "anos",
};

const SETPOS_LABEL: Record<number, string> = {
  1: "primeira",
  2: "segunda",
  3: "terceira",
  4: "quarta",
  [-1]: "última",
};

interface CustomState {
  freq: Frequency;
  interval: number;
  byweekday: number[];
  monthlyMode: "bymonthday" | "bysetpos";
  bymonthday: number;
  bysetpos: number;
  bysetposWeekday: number;
  endMode: "never" | "count" | "until";
  count: number;
  until: Date | null;
}

function detectPreset(rule: string | null): PresetId {
  if (!rule) return "none";
  try {
    const r = RRule.fromString(rule.startsWith("RRULE:") ? rule : `RRULE:${rule}`);
    const o = r.origOptions;
    const interval = o.interval ?? 1;
    const hasEnd = o.count != null || o.until != null;
    if (interval !== 1 || hasEnd) return "custom";
    if (o.freq === RRule.DAILY && !o.byweekday) return "daily";
    if (o.freq === RRule.WEEKLY && !o.byweekday) return "weekly";
    if (o.freq === RRule.MONTHLY && !o.byweekday && !o.bymonthday && !o.bysetpos)
      return "monthly";
    if (o.freq === RRule.YEARLY && !o.byweekday) return "yearly";
    if (
      o.freq === RRule.WEEKLY &&
      Array.isArray(o.byweekday) &&
      o.byweekday.length === 5
    ) {
      // assume seg-sex
      return "weekdays";
    }
    return "custom";
  } catch {
    return "custom";
  }
}

function parseToCustom(rule: string | null, dtstart?: Date): CustomState {
  const base: CustomState = {
    freq: RRule.WEEKLY,
    interval: 1,
    byweekday: dtstart ? [(dtstart.getDay() + 6) % 7] : [],
    monthlyMode: "bymonthday",
    bymonthday: dtstart ? dtstart.getDate() : 1,
    bysetpos: 1,
    bysetposWeekday: dtstart ? (dtstart.getDay() + 6) % 7 : 0,
    endMode: "never",
    count: 10,
    until: null,
  };
  if (!rule) return base;
  try {
    const r = RRule.fromString(rule.startsWith("RRULE:") ? rule : `RRULE:${rule}`);
    const o = r.origOptions;
    base.freq = (o.freq as Frequency) ?? RRule.WEEKLY;
    base.interval = o.interval ?? 1;
    if (o.byweekday) {
      const arr = Array.isArray(o.byweekday) ? o.byweekday : [o.byweekday];
      base.byweekday = arr
        .map((w) => {
          if (typeof w === "number") return w;
          if (w instanceof Weekday) return w.weekday;
          return 0;
        })
        .filter((n) => typeof n === "number");
    }
    if (o.bymonthday) {
      base.monthlyMode = "bymonthday";
      base.bymonthday = Array.isArray(o.bymonthday) ? o.bymonthday[0] : o.bymonthday;
    }
    if (o.bysetpos) {
      base.monthlyMode = "bysetpos";
      base.bysetpos = Array.isArray(o.bysetpos) ? o.bysetpos[0] : o.bysetpos;
      if (Array.isArray(o.byweekday) && o.byweekday.length === 1) {
        const w = o.byweekday[0];
        base.bysetposWeekday =
          typeof w === "number" ? w : w instanceof Weekday ? w.weekday : 0;
      }
    }
    if (o.count != null) {
      base.endMode = "count";
      base.count = o.count;
    } else if (o.until) {
      base.endMode = "until";
      base.until = o.until instanceof Date ? o.until : new Date(o.until);
    }
  } catch {
    // ignora
  }
  return base;
}

function buildPresetRule(preset: PresetId, dtstart?: Date): string | null {
  if (preset === "none") return null;
  const opts: ConstructorParameters<typeof RRule>[0] = {};
  if (dtstart) opts.dtstart = dtstart;
  switch (preset) {
    case "daily":
      opts.freq = RRule.DAILY;
      break;
    case "weekly":
      opts.freq = RRule.WEEKLY;
      break;
    case "monthly":
      opts.freq = RRule.MONTHLY;
      break;
    case "yearly":
      opts.freq = RRule.YEARLY;
      break;
    case "weekdays":
      opts.freq = RRule.WEEKLY;
      opts.byweekday = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR];
      break;
    default:
      return null;
  }
  return new RRule(opts).toString();
}

function buildCustomRule(state: CustomState, dtstart?: Date): string | null {
  const opts: ConstructorParameters<typeof RRule>[0] = {
    freq: state.freq,
    interval: Math.max(1, state.interval || 1),
  };
  if (dtstart) opts.dtstart = dtstart;

  if (state.freq === RRule.WEEKLY && state.byweekday.length > 0) {
    opts.byweekday = state.byweekday.map((d) => WEEKDAYS[d].rr);
  }

  if (state.freq === RRule.MONTHLY) {
    if (state.monthlyMode === "bymonthday") {
      opts.bymonthday = [state.bymonthday];
    } else {
      opts.bysetpos = [state.bysetpos];
      opts.byweekday = [WEEKDAYS[state.bysetposWeekday].rr];
    }
  }

  if (state.endMode === "count") {
    opts.count = Math.max(1, state.count || 1);
  } else if (state.endMode === "until" && state.until) {
    opts.until = state.until;
  }

  return new RRule(opts).toString();
}

function describePtBR(rule: string | null): string {
  if (!rule) return "Sem repetição";
  try {
    const r = RRule.fromString(rule.startsWith("RRULE:") ? rule : `RRULE:${rule}`);
    const o = r.origOptions;
    const interval = o.interval ?? 1;
    const freq = (o.freq as Frequency) ?? RRule.WEEKLY;
    let core: string;

    if (freq === RRule.DAILY) {
      core = interval === 1 ? "Todo dia" : `A cada ${interval} dias`;
    } else if (freq === RRule.WEEKLY) {
      const days = (() => {
        if (!o.byweekday) return null;
        const arr = Array.isArray(o.byweekday) ? o.byweekday : [o.byweekday];
        if (arr.length === 0) return null;
        const labels = arr.map((w) => {
          const idx =
            typeof w === "number"
              ? w
              : w instanceof Weekday
                ? w.weekday
                : 0;
          return WEEKDAYS[idx]?.label.toLowerCase() ?? "";
        });
        if (labels.length === 5 && !labels.includes("sábado") && !labels.includes("domingo")) {
          return "dias úteis";
        }
        if (labels.length <= 2) return labels.join(" e ");
        return labels.slice(0, -1).join(", ") + " e " + labels.at(-1);
      })();
      const base = interval === 1 ? "Toda semana" : `A cada ${interval} semanas`;
      core = days ? `Toda ${days}` : base;
      if (interval > 1 && days) core = `A cada ${interval} semanas (${days})`;
    } else if (freq === RRule.MONTHLY) {
      if (o.bysetpos && o.byweekday) {
        const pos = Array.isArray(o.bysetpos) ? o.bysetpos[0] : o.bysetpos;
        const w = Array.isArray(o.byweekday) ? o.byweekday[0] : o.byweekday;
        const idx = typeof w === "number" ? w : w instanceof Weekday ? w.weekday : 0;
        const dayLabel = WEEKDAYS[idx]?.label.toLowerCase() ?? "";
        const posLabel = SETPOS_LABEL[pos as number] ?? `${pos}ª`;
        core = `Toda ${posLabel} ${dayLabel} do mês`;
      } else if (o.bymonthday) {
        const d = Array.isArray(o.bymonthday) ? o.bymonthday[0] : o.bymonthday;
        core = interval === 1
          ? `Todo mês no dia ${d}`
          : `A cada ${interval} meses no dia ${d}`;
      } else {
        core = interval === 1 ? "Todo mês" : `A cada ${interval} meses`;
      }
    } else if (freq === RRule.YEARLY) {
      core = interval === 1 ? "Todo ano" : `A cada ${interval} anos`;
    } else {
      core = `A cada ${interval} ${FREQ_LABEL_PLURAL[freq] ?? "ciclo"}`;
    }

    if (o.count != null) {
      core += `, por ${o.count} vezes`;
    } else if (o.until) {
      const u = o.until instanceof Date ? o.until : new Date(o.until);
      core += `, até ${format(u, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    return core;
  } catch {
    return "Recorrência inválida";
  }
}

export function RecurrenceBuilder({
  value,
  onChange,
  dtstart,
  className,
}: RecurrenceBuilderProps) {
  const [preset, setPreset] = useState<PresetId>(() => detectPreset(value));
  const [custom, setCustom] = useState<CustomState>(() => parseToCustom(value, dtstart));

  // Quando value muda externamente (ex: outra task abriu), re-sincroniza estado.
  useEffect(() => {
    setPreset(detectPreset(value));
    setCustom(parseToCustom(value, dtstart));
  }, [value, dtstart]);

  const onPresetChange = (next: PresetId) => {
    setPreset(next);
    if (next === "custom") {
      onChange(buildCustomRule(custom, dtstart));
    } else {
      onChange(buildPresetRule(next, dtstart));
    }
  };

  const updateCustom = (patch: Partial<CustomState>) => {
    const merged = { ...custom, ...patch };
    setCustom(merged);
    if (preset === "custom") onChange(buildCustomRule(merged, dtstart));
  };

  const preview = useMemo(() => describePtBR(value), [value]);

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <Label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Recorrência
        </Label>
        <Select value={preset} onValueChange={(v) => onPresetChange(v as PresetId)}>
          <SelectTrigger className="mt-1 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {preset === "custom" && (
        <div className="space-y-3 rounded-md border bg-muted/20 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-muted-foreground">Frequência</Label>
              <Select
                value={String(custom.freq)}
                onValueChange={(v) => updateCustom({ freq: Number(v) as Frequency })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(RRule.DAILY)}>Diária</SelectItem>
                  <SelectItem value={String(RRule.WEEKLY)}>Semanal</SelectItem>
                  <SelectItem value={String(RRule.MONTHLY)}>Mensal</SelectItem>
                  <SelectItem value={String(RRule.YEARLY)}>Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">
                A cada N {FREQ_LABEL_PLURAL[custom.freq]}
              </Label>
              <Input
                type="number"
                min={1}
                max={99}
                value={custom.interval}
                onChange={(e) => updateCustom({ interval: Number(e.target.value) || 1 })}
                className="h-8"
              />
            </div>
          </div>

          {custom.freq === RRule.WEEKLY && (
            <div>
              <Label className="text-[11px] text-muted-foreground">Dias da semana</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => {
                  const checked = custom.byweekday.includes(d.id);
                  return (
                    <label
                      key={d.id}
                      className={cn(
                        "flex h-8 w-9 cursor-pointer items-center justify-center rounded-md border text-xs",
                        checked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      <Checkbox
                        className="sr-only"
                        checked={checked}
                        onCheckedChange={(v) => {
                          const next = v
                            ? [...custom.byweekday, d.id]
                            : custom.byweekday.filter((x) => x !== d.id);
                          updateCustom({ byweekday: next });
                        }}
                      />
                      <span aria-hidden>{d.short}</span>
                      <span className="sr-only">{d.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {custom.freq === RRule.MONTHLY && (
            <div className="space-y-2">
              <RadioGroup
                value={custom.monthlyMode}
                onValueChange={(v) =>
                  updateCustom({ monthlyMode: v as CustomState["monthlyMode"] })
                }
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="rb-bymonthday" value="bymonthday" />
                  <Label htmlFor="rb-bymonthday" className="flex items-center gap-2 text-sm">
                    No dia
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={custom.bymonthday}
                      onChange={(e) =>
                        updateCustom({ bymonthday: Number(e.target.value) || 1 })
                      }
                      onClick={() => updateCustom({ monthlyMode: "bymonthday" })}
                      className="h-7 w-16"
                    />
                    do mês
                  </Label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RadioGroupItem id="rb-bysetpos" value="bysetpos" />
                  <Label htmlFor="rb-bysetpos" className="flex flex-wrap items-center gap-2 text-sm">
                    Na
                    <Select
                      value={String(custom.bysetpos)}
                      onValueChange={(v) => {
                        updateCustom({ bysetpos: Number(v), monthlyMode: "bysetpos" });
                      }}
                    >
                      <SelectTrigger className="h-7 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">primeira</SelectItem>
                        <SelectItem value="2">segunda</SelectItem>
                        <SelectItem value="3">terceira</SelectItem>
                        <SelectItem value="4">quarta</SelectItem>
                        <SelectItem value="-1">última</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={String(custom.bysetposWeekday)}
                      onValueChange={(v) =>
                        updateCustom({
                          bysetposWeekday: Number(v),
                          monthlyMode: "bysetpos",
                        })
                      }
                    >
                      <SelectTrigger className="h-7 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.label.toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    do mês
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div>
            <Label className="text-[11px] text-muted-foreground">Termina</Label>
            <RadioGroup
              value={custom.endMode}
              onValueChange={(v) => updateCustom({ endMode: v as CustomState["endMode"] })}
              className="mt-1 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id="re-never" value="never" />
                <Label htmlFor="re-never" className="text-sm">Nunca</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="re-count" value="count" />
                <Label htmlFor="re-count" className="flex items-center gap-2 text-sm">
                  Após
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={custom.count}
                    onChange={(e) => updateCustom({ count: Number(e.target.value) || 1 })}
                    onClick={() => updateCustom({ endMode: "count" })}
                    className="h-7 w-16"
                  />
                  ocorrências
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="re-until" value="until" />
                <Label htmlFor="re-until" className="flex items-center gap-2 text-sm">
                  Em
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 justify-start font-normal"
                        onClick={() => updateCustom({ endMode: "until" })}
                      >
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {custom.until
                          ? format(custom.until, "dd/MM/yyyy", { locale: ptBR })
                          : "escolher data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={custom.until ?? undefined}
                        onSelect={(d) =>
                          updateCustom({ until: d ?? null, endMode: "until" })
                        }
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Resumo:</span> {preview}
      </div>
    </div>
  );
}
