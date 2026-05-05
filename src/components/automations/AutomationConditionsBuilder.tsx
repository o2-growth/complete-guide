import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import {
  CONDITION_FIELDS,
  CONDITION_OPS,
  type AutomationCondition,
  type AutomationConditions,
} from "@/hooks/useAutomations";

type GroupKey = "all" | "any";

function asGroup(c: AutomationConditions): { key: GroupKey; items: AutomationCondition[] } {
  if (Array.isArray(c)) return { key: "all", items: c };
  if (c.all) return { key: "all", items: c.all };
  if (c.any) return { key: "any", items: c.any };
  return { key: "all", items: [] };
}

function toConditions(key: GroupKey, items: AutomationCondition[]): AutomationConditions {
  // Mantém formato compatível: AND simples sem regras vira array vazio.
  if (key === "all" && items.length === 0) return [];
  return key === "all" ? { all: items } : { any: items };
}

interface Props {
  value: AutomationConditions;
  onChange: (next: AutomationConditions) => void;
}

export function AutomationConditionsBuilder({ value, onChange }: Props) {
  const { key, items } = asGroup(value);

  const setItems = (next: AutomationCondition[]) => onChange(toConditions(key, next));
  const setKey = (k: GroupKey) => onChange(toConditions(k, items));

  return (
    <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/30 p-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Combinar usando</span>
        <Select value={key} onValueChange={(v) => setKey(v as GroupKey)}>
          <SelectTrigger className="h-7 w-[110px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas (E)</SelectItem>
            <SelectItem value="any">Qualquer (OU)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Sem condições — a regra dispara em todo evento.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((cond, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <Select
                value={cond.field}
                onValueChange={(v) => {
                  const next = [...items];
                  next[i] = { ...cond, field: v };
                  setItems(next);
                }}
              >
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_FIELDS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={cond.op}
                onValueChange={(v) => {
                  const next = [...items];
                  next[i] = { ...cond, op: v };
                  setItems(next);
                }}
              >
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {cond.op !== "exists" && cond.op !== "not_exists" && (
                <Input
                  className="h-8 max-w-[220px] text-xs"
                  placeholder="valor"
                  value={typeof cond.value === "string" ? cond.value : JSON.stringify(cond.value ?? "")}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...cond, value: e.target.value };
                    setItems(next);
                  }}
                />
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setItems(items.filter((_, j) => j !== i))}
                aria-label="Remover condição"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => setItems([...items, { field: "priority", op: "eq", value: "" }])}
      >
        <Plus className="mr-1 h-3 w-3" /> Adicionar condição
      </Button>
    </div>
  );
}
