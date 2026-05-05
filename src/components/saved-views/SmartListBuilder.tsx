import { useState, useMemo } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjects } from "@/hooks/useProjects";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import { useTaskStatuses } from "@/hooks/useTasks";
import type {
  FilterField,
  Rule,
  RuleGroup,
  Operator,
} from "@/lib/smart-list-query";

const FIELDS: { value: FilterField; label: string }[] = [
  { value: "list", label: "Projeto" },
  { value: "tag", label: "Tag" },
  { value: "assignee", label: "Responsável" },
  { value: "priority", label: "Prioridade" },
  { value: "status", label: "Status" },
  { value: "due_at", label: "Data limite" },
  { value: "keyword", label: "Palavra-chave" },
  { value: "done", label: "Concluída" },
];

const PRIORITIES: { value: string; label: string }[] = [
  { value: "urgent", label: "P0 — Urgente" },
  { value: "high", label: "P1 — Alta" },
  { value: "medium", label: "P2 — Média" },
  { value: "low", label: "P3 — Baixa" },
  { value: "none", label: "Sem prioridade" },
];

function defaultRuleFor(field: FilterField): Rule {
  switch (field) {
    case "list":
    case "tag":
    case "assignee":
    case "priority":
    case "status":
      return { field, operator: "in", value: [] };
    case "due_at":
      return { field, operator: "before", value: "" };
    case "keyword":
      return { field, operator: "contains", value: "" };
    case "done":
      return { field, operator: "is", value: false };
  }
}

export interface SmartListBuilderProps {
  initial?: RuleGroup;
  onSubmit: (group: RuleGroup, name: string) => void | Promise<void>;
  onCancel?: () => void;
  initialName?: string;
}

export function SmartListBuilder({
  initial,
  onSubmit,
  onCancel,
  initialName,
}: SmartListBuilderProps) {
  const [name, setName] = useState(initialName ?? "");
  const [group, setGroup] = useState<RuleGroup>(
    initial ?? { combinator: "and", rules: [] },
  );

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSubmit(group, name.trim());
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="smart-list-name">Nome da smart list</Label>
        <Input
          id="smart-list-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Urgente do João"
        />
      </div>

      <div className="rounded-lg border bg-muted/20 p-3">
        <RuleGroupEditor group={group} onChange={setGroup} depth={0} />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button onClick={handleSave} disabled={!name.trim() || group.rules.length === 0}>
          Salvar smart list
        </Button>
      </div>
    </div>
  );
}

function RuleGroupEditor({
  group,
  onChange,
  depth,
}: {
  group: RuleGroup;
  onChange: (g: RuleGroup) => void;
  depth: number;
}) {
  const update = (patch: Partial<RuleGroup>) => onChange({ ...group, ...patch });

  const addRule = (combinator: "and" | "or") => {
    if (combinator !== group.combinator && group.rules.length > 0) {
      // Quando misturar combinators no mesmo grupo, encapsula tudo em
      // sub-grupo do combinator atual e troca o externo.
      const wrapped: RuleGroup = { combinator: group.combinator, rules: group.rules };
      onChange({
        combinator,
        rules: [wrapped, defaultRuleFor("priority")],
      });
      return;
    }
    update({ combinator, rules: [...group.rules, defaultRuleFor("priority")] });
  };

  const updateRule = (idx: number, next: Rule | RuleGroup) => {
    const copy = [...group.rules];
    copy[idx] = next;
    update({ rules: copy });
  };

  const removeRule = (idx: number) => {
    update({ rules: group.rules.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="uppercase">
          {group.combinator === "and" ? "E (todas)" : "OU (qualquer)"}
        </Badge>
        {depth > 0 && (
          <span className="text-xs text-muted-foreground">subgrupo nível {depth}</span>
        )}
      </div>

      <div className="space-y-2">
        {group.rules.map((r, idx) => {
          if ((r as RuleGroup).combinator !== undefined) {
            return (
              <div key={idx} className="rounded border border-dashed bg-background p-2">
                <div className="mb-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeRule(idx)}
                    aria-label="Remover subgrupo"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <RuleGroupEditor
                  group={r as RuleGroup}
                  onChange={(g) => updateRule(idx, g)}
                  depth={depth + 1}
                />
              </div>
            );
          }
          return (
            <RuleEditor
              key={idx}
              rule={r as Rule}
              onChange={(next) => updateRule(idx, next)}
              onRemove={() => removeRule(idx)}
            />
          );
        })}
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={() => addRule("and")}>
          <Plus className="mr-1 h-3 w-3" /> E (AND)
        </Button>
        <Button variant="outline" size="sm" onClick={() => addRule("or")}>
          <Plus className="mr-1 h-3 w-3" /> OU (OR)
        </Button>
      </div>
    </div>
  );
}

function RuleEditor({
  rule,
  onChange,
  onRemove,
}: {
  rule: Rule;
  onChange: (r: Rule) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded border bg-background p-2">
      <Select
        value={rule.field}
        onValueChange={(v) => onChange(defaultRuleFor(v as FilterField))}
      >
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FIELDS.map((f) => (
            <SelectItem key={f.value} value={f.value} className="text-xs">
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <OperatorSelect rule={rule} onChange={onChange} />
      <ValueEditor rule={rule} onChange={onChange} />

      <Button
        variant="ghost"
        size="icon"
        className="ml-auto h-7 w-7"
        onClick={onRemove}
        aria-label="Remover condição"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function OperatorSelect({ rule, onChange }: { rule: Rule; onChange: (r: Rule) => void }) {
  const ops = operatorsFor(rule.field);
  if (ops.length <= 1) {
    return <span className="text-xs text-muted-foreground">{ops[0]?.label ?? ""}</span>;
  }
  return (
    <Select
      value={rule.operator}
      onValueChange={(v) => onChange({ ...rule, operator: v as Operator })}
    >
      <SelectTrigger className="h-8 w-[120px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ops.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function operatorsFor(field: FilterField): { value: Operator; label: string }[] {
  switch (field) {
    case "due_at":
      return [
        { value: "before", label: "antes de" },
        { value: "after", label: "depois de" },
        { value: "between", label: "entre" },
      ];
    case "keyword":
      return [{ value: "contains", label: "contém" }];
    case "done":
      return [{ value: "is", label: "é" }];
    default:
      return [{ value: "in", label: "em" }];
  }
}

function ValueEditor({ rule, onChange }: { rule: Rule; onChange: (r: Rule) => void }) {
  switch (rule.field) {
    case "priority":
      return (
        <MultiPicker
          value={(rule.value as string[]) ?? []}
          options={PRIORITIES}
          onChange={(vs) => onChange({ ...rule, value: vs })}
          placeholder="Prioridades"
        />
      );
    case "status":
      return <StatusPicker rule={rule} onChange={onChange} />;
    case "list":
      return <ProjectPicker rule={rule} onChange={onChange} />;
    case "assignee":
      return <AssigneePicker rule={rule} onChange={onChange} />;
    case "tag":
      return <TagPicker rule={rule} onChange={onChange} />;
    case "keyword":
      return (
        <Input
          value={String(rule.value ?? "")}
          onChange={(e) => onChange({ ...rule, value: e.target.value })}
          placeholder="termo"
          className="h-8 w-[200px] text-xs"
        />
      );
    case "due_at":
      if (rule.operator === "between") {
        const v = (Array.isArray(rule.value) ? rule.value : ["", ""]) as [string, string];
        return (
          <div className="flex gap-1">
            <Input
              type="date"
              value={v[0] ?? ""}
              onChange={(e) => onChange({ ...rule, value: [e.target.value, v[1]] })}
              className="h-8 w-[140px] text-xs"
            />
            <Input
              type="date"
              value={v[1] ?? ""}
              onChange={(e) => onChange({ ...rule, value: [v[0], e.target.value] })}
              className="h-8 w-[140px] text-xs"
            />
          </div>
        );
      }
      return (
        <Input
          type="date"
          value={String(rule.value ?? "")}
          onChange={(e) => onChange({ ...rule, value: e.target.value })}
          className="h-8 w-[140px] text-xs"
        />
      );
    case "done":
      return (
        <Select
          value={String(rule.value ?? false)}
          onValueChange={(v) => onChange({ ...rule, value: v === "true" })}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true" className="text-xs">Sim</SelectItem>
            <SelectItem value="false" className="text-xs">Não</SelectItem>
          </SelectContent>
        </Select>
      );
    default:
      return null;
  }
}

function MultiPicker({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string[];
  options: { value: string; label: string }[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };
  const labelText = value.length
    ? options
        .filter((o) => value.includes(o.value))
        .map((o) => o.label)
        .join(", ")
    : placeholder;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {options.map((o) => {
        const active = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`rounded border px-2 py-0.5 text-[11px] transition-colors ${
              active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            }`}
            aria-pressed={active}
          >
            {o.label}
          </button>
        );
      })}
      <span className="sr-only">{labelText}</span>
    </div>
  );
}

function ProjectPicker({ rule, onChange }: { rule: Rule; onChange: (r: Rule) => void }) {
  const { data } = useProjects();
  const opts = useMemo(
    () => (data ?? []).map((p) => ({ value: p.id, label: p.name })),
    [data],
  );
  return (
    <MultiPicker
      value={(rule.value as string[]) ?? []}
      options={opts}
      onChange={(vs) => onChange({ ...rule, value: vs })}
      placeholder="Projetos"
    />
  );
}

function AssigneePicker({ rule, onChange }: { rule: Rule; onChange: (r: Rule) => void }) {
  const { data } = useTenantMembers();
  const opts = useMemo(
    () =>
      (data ?? []).map((m) => ({
        value: m.id,
        label: m.display_name || m.full_name || m.email || m.id.slice(0, 6),
      })),
    [data],
  );
  return (
    <MultiPicker
      value={(rule.value as string[]) ?? []}
      options={opts}
      onChange={(vs) => onChange({ ...rule, value: vs })}
      placeholder="Responsáveis"
    />
  );
}

function StatusPicker({ rule, onChange }: { rule: Rule; onChange: (r: Rule) => void }) {
  const { data } = useTaskStatuses();
  const opts = useMemo(
    () => (data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [data],
  );
  return (
    <MultiPicker
      value={(rule.value as string[]) ?? []}
      options={opts}
      onChange={(vs) => onChange({ ...rule, value: vs })}
      placeholder="Status"
    />
  );
}

function TagPicker({ rule, onChange }: { rule: Rule; onChange: (r: Rule) => void }) {
  const { tenantId } = useWorkspace();
  const { data } = useQuery({
    queryKey: ["tags-list", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name")
        .eq("tenant_id", tenantId!);
      if (error) throw error;
      return data ?? [];
    },
  });
  const opts = useMemo(
    () => (data ?? []).map((t) => ({ value: t.id, label: t.name })),
    [data],
  );
  return (
    <MultiPicker
      value={(rule.value as string[]) ?? []}
      options={opts}
      onChange={(vs) => onChange({ ...rule, value: vs })}
      placeholder="Tags"
    />
  );
}
