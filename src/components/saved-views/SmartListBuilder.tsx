import { useMemo, useState, useEffect } from "react";
import { QueryBuilder, formatQuery } from "react-querybuilder";
import type { Field, RuleGroupType } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.css";
import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjects } from "@/hooks/useProjects";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import { useTaskStatuses } from "@/hooks/useTasks";
import {
  applySmartListFilters,
  collectTagIds,
  countLeafRules,
  type RuleGroup,
} from "@/lib/smart-list-query";
import { toast } from "sonner";

const PRIORITIES: { name: string; label: string }[] = [
  { name: "urgent", label: "P0 — Urgente" },
  { name: "high", label: "P1 — Alta" },
  { name: "medium", label: "P2 — Média" },
  { name: "low", label: "P3 — Baixa" },
  { name: "none", label: "Sem prioridade" },
];

/**
 * Operadores customizados em pt-BR. Os values são os identificadores que o
 * adapter `smart-list-query.ts` entende.
 */
const STRING_OPERATORS = [
  { name: "=", label: "é igual a" },
  { name: "!=", label: "é diferente de" },
  { name: "contains", label: "contém" },
  { name: "doesNotContain", label: "não contém" },
  { name: "beginsWith", label: "começa com" },
  { name: "endsWith", label: "termina com" },
  { name: "null", label: "está vazio" },
  { name: "notNull", label: "não está vazio" },
];

const MULTI_OPERATORS = [
  { name: "in", label: "em" },
  { name: "notIn", label: "não em" },
  { name: "null", label: "está vazio" },
  { name: "notNull", label: "não está vazio" },
];

const NUMBER_OPERATORS = [
  { name: "=", label: "=" },
  { name: "!=", label: "≠" },
  { name: "<", label: "<" },
  { name: ">", label: ">" },
  { name: "<=", label: "≤" },
  { name: ">=", label: "≥" },
  { name: "between", label: "entre" },
  { name: "notBetween", label: "fora de" },
  { name: "null", label: "está vazio" },
  { name: "notNull", label: "não está vazio" },
];

const DATE_OPERATORS = [
  { name: "<", label: "antes de" },
  { name: ">", label: "depois de" },
  { name: "<=", label: "até" },
  { name: ">=", label: "a partir de" },
  { name: "=", label: "igual a" },
  { name: "between", label: "entre" },
  { name: "notBetween", label: "fora de" },
  { name: "null", label: "sem data" },
  { name: "notNull", label: "tem data" },
];

const BOOLEAN_OPERATORS = [{ name: "=", label: "é" }];

const COMBINATORS = [
  { name: "and", label: "E" },
  { name: "or", label: "OU" },
];

const TRANSLATIONS = {
  fields: { title: "Campos", placeholderName: "—", placeholderLabel: "—" },
  operators: { title: "Operadores" },
  value: { title: "Valor", editorPlaceholder: "" },
  removeRule: { label: "✕", title: "Remover condição" },
  removeGroup: { label: "✕", title: "Remover grupo" },
  addRule: { label: "+ Condição", title: "Adicionar condição" },
  addGroup: { label: "+ Grupo", title: "Adicionar grupo aninhado" },
  combinators: { title: "Combinador" },
  notToggle: { label: "Não", title: "Inverter este grupo (NOT)" },
  cloneRule: { label: "⎘", title: "Duplicar condição" },
  cloneRuleGroup: { label: "⎘", title: "Duplicar grupo" },
  shiftActionUp: { label: "↑", title: "Mover para cima" },
  shiftActionDown: { label: "↓", title: "Mover para baixo" },
  dragHandle: { label: "⋮⋮", title: "Arrastar" },
  lockRule: { label: "🔒", title: "Travar" },
  lockGroup: { label: "🔒", title: "Travar grupo" },
  lockRuleDisabled: { label: "🔓", title: "Destravar" },
  lockGroupDisabled: { label: "🔓", title: "Destravar grupo" },
  valueSourceSelector: { title: "Fonte do valor" },
};

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
  const [query, setQuery] = useState<RuleGroupType>(
    () =>
      (initial as unknown as RuleGroupType) ?? {
        combinator: "and",
        rules: [],
      },
  );
  const fields = useFieldsConfig();

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSubmit(query as unknown as RuleGroup, name.trim());
  };

  const total = countLeafRules(query as unknown as RuleGroup);

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

      <div className="rounded-lg border bg-muted/20 p-3 smart-list-qb">
        <QueryBuilder
          fields={fields}
          query={query}
          onQueryChange={setQuery}
          combinators={COMBINATORS}
          translations={TRANSLATIONS}
          showCombinatorsBetweenRules={false}
          showNotToggle
          showCloneButtons
          showShiftActions
          resetOnFieldChange
          resetOnOperatorChange
          controlClassnames={{
            queryBuilder: "qb-root",
            ruleGroup: "qb-group",
            combinators: "qb-combinator",
            addRule: "qb-add-rule",
            addGroup: "qb-add-group",
            removeRule: "qb-remove",
            removeGroup: "qb-remove",
            rule: "qb-rule",
            fields: "qb-field",
            operators: "qb-operator",
            value: "qb-value",
            notToggle: "qb-not",
            cloneRule: "qb-clone",
            cloneGroup: "qb-clone",
            shiftActions: "qb-shift",
          }}
        />
      </div>

      <PreviewMatches query={query as unknown as RuleGroup} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <ImportJsonButton onImport={(g) => setQuery(g as unknown as RuleGroupType)} />
          <ExportJsonButton query={query} />
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button onClick={handleSave} disabled={!name.trim() || total === 0}>
            Salvar smart list
          </Button>
        </div>
      </div>

      <SmartListBuilderStyles />
    </div>
  );
}

/**
 * Estilos isolados para casar o react-querybuilder com o tema shadcn.
 * Mantemos `<style>` inline pra evitar tocar em `src/components/ui/`.
 */
function SmartListBuilderStyles() {
  return (
    <style>{`
      .smart-list-qb .qb-root { font-family: inherit; }
      .smart-list-qb .qb-group {
        border: 1px solid hsl(var(--border));
        border-radius: 0.5rem;
        background: hsl(var(--background));
        padding: 0.5rem;
        margin-bottom: 0.25rem;
      }
      .smart-list-qb .qb-group .qb-group { background: hsl(var(--muted) / 0.3); }
      .smart-list-qb .qb-rule {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        padding: 0.25rem 0;
      }
      .smart-list-qb select,
      .smart-list-qb input[type="text"],
      .smart-list-qb input[type="number"],
      .smart-list-qb input[type="date"],
      .smart-list-qb .qb-field,
      .smart-list-qb .qb-operator,
      .smart-list-qb .qb-value,
      .smart-list-qb .qb-combinator {
        height: 2rem;
        border: 1px solid hsl(var(--border));
        background: hsl(var(--background));
        color: hsl(var(--foreground));
        border-radius: 0.375rem;
        padding: 0 0.5rem;
        font-size: 0.75rem;
        line-height: 1;
      }
      .smart-list-qb button {
        height: 1.75rem;
        border: 1px solid hsl(var(--border));
        background: hsl(var(--background));
        color: hsl(var(--foreground));
        border-radius: 0.375rem;
        padding: 0 0.5rem;
        font-size: 0.75rem;
        cursor: pointer;
      }
      .smart-list-qb button:hover { background: hsl(var(--muted)); }
      .smart-list-qb .qb-add-rule,
      .smart-list-qb .qb-add-group {
        background: hsl(var(--primary) / 0.1);
        color: hsl(var(--primary));
        border-color: hsl(var(--primary) / 0.3);
      }
      .smart-list-qb .qb-remove {
        background: transparent;
        border-color: transparent;
        color: hsl(var(--destructive));
        padding: 0 0.375rem;
      }
      .smart-list-qb .qb-remove:hover { background: hsl(var(--destructive) / 0.1); }
      .smart-list-qb .ruleGroup-header,
      .smart-list-qb .rule-header {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        flex-wrap: wrap;
      }
      .smart-list-qb .queryBuilder-invalid > .qb-group {
        border-color: hsl(var(--destructive) / 0.5);
      }
      .smart-list-qb .qb-not {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.7rem;
      }
      .smart-list-qb .ruleGroup-body {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-top: 0.5rem;
      }
    `}</style>
  );
}

/**
 * Configuração dos campos. Cada campo declara seu valueEditorType + operadores
 * permitidos. Para multi-select usamos `multiselect` nativo do react-querybuilder.
 */
function useFieldsConfig(): Field[] {
  const { data: projects } = useProjects();
  const { data: members } = useTenantMembers();
  const { data: statuses } = useTaskStatuses();
  const { tenantId } = useWorkspace();
  const { data: tags } = useQuery({
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

  return useMemo<Field[]>(
    () => [
      {
        name: "priority",
        label: "Prioridade",
        valueEditorType: "multiselect",
        values: PRIORITIES,
        operators: MULTI_OPERATORS,
        defaultOperator: "in",
        defaultValue: [],
      },
      {
        name: "status",
        label: "Status",
        valueEditorType: "multiselect",
        values: (statuses ?? []).map((s) => ({ name: s.id, label: s.name })),
        operators: MULTI_OPERATORS,
        defaultOperator: "in",
        defaultValue: [],
      },
      {
        name: "project_id",
        label: "Projeto",
        valueEditorType: "multiselect",
        values: (projects ?? []).map((p) => ({ name: p.id, label: p.name })),
        operators: MULTI_OPERATORS,
        defaultOperator: "in",
        defaultValue: [],
      },
      {
        name: "assignee_id",
        label: "Responsável",
        valueEditorType: "multiselect",
        values: (members ?? []).map((m) => ({
          name: m.id,
          label:
            m.display_name || m.full_name || m.email || m.id.slice(0, 6),
        })),
        operators: MULTI_OPERATORS,
        defaultOperator: "in",
        defaultValue: [],
      },
      {
        name: "tag_id",
        label: "Tag",
        valueEditorType: "multiselect",
        values: (tags ?? []).map((t) => ({ name: t.id, label: t.name })),
        operators: MULTI_OPERATORS,
        defaultOperator: "in",
        defaultValue: [],
      },
      {
        name: "due_at",
        label: "Data limite",
        inputType: "date",
        operators: DATE_OPERATORS,
        defaultOperator: "<",
        defaultValue: "",
      },
      {
        name: "created_at",
        label: "Criada em",
        inputType: "date",
        operators: DATE_OPERATORS,
        defaultOperator: ">=",
        defaultValue: "",
      },
      {
        name: "priority_score",
        label: "Score de prioridade",
        inputType: "number",
        operators: NUMBER_OPERATORS,
        defaultOperator: ">=",
        defaultValue: 0,
      },
      {
        name: "done",
        label: "Concluída",
        valueEditorType: "select",
        values: [
          { name: "true", label: "Sim" },
          { name: "false", label: "Não" },
        ],
        operators: BOOLEAN_OPERATORS,
        defaultOperator: "=",
        defaultValue: "false",
      },
      {
        name: "keyword",
        label: "Palavra-chave",
        inputType: "text",
        operators: STRING_OPERATORS,
        defaultOperator: "contains",
        defaultValue: "",
      },
    ],
    [projects, members, statuses, tags],
  );
}

/**
 * Preview "X tarefas correspondem" debounced (500ms). Reexecuta a query real
 * contra Supabase com `applySmartListFilters`.
 */
function PreviewMatches({ query }: { query: RuleGroup }) {
  const { tenantId } = useWorkspace();
  const [debounced, setDebounced] = useState<RuleGroup>(query);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 500);
    return () => clearTimeout(t);
  }, [query]);

  const totalLeaves = countLeafRules(debounced);
  const { data, isFetching } = useQuery({
    queryKey: ["smart-list-preview", tenantId, JSON.stringify(debounced)],
    enabled: !!tenantId && totalLeaves > 0,
    queryFn: async () => {
      const tagIds = collectTagIds(debounced);
      let tagFilteredTaskIds: string[] | undefined;
      if (tagIds.length) {
        const { data: tt } = await supabase
          .from("task_tags")
          .select("task_id")
          .in("tag_id", tagIds);
        tagFilteredTaskIds = Array.from(
          new Set((tt ?? []).map((r) => r.task_id)),
        );
      }
      const baseQuery = supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!)
        .eq("archived", false);
      const filtered = applySmartListFilters(
        baseQuery as never,
        debounced,
        tagFilteredTaskIds,
      ) as typeof baseQuery;
      const { count, error } = await filtered;
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (totalLeaves === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Adicione pelo menos uma condição para visualizar tarefas correspondentes.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="secondary">
        {isFetching ? "Calculando…" : `${data ?? 0} tarefas correspondem`}
      </Badge>
      <span>
        {totalLeaves} {totalLeaves === 1 ? "condição" : "condições"} ativa
        {totalLeaves === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function ExportJsonButton({ query }: { query: RuleGroupType }) {
  const json = useMemo(() => formatQuery(query, { format: "json" }), [query]);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      toast.success("JSON copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-1 h-3 w-3" /> Exportar JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>JSON da smart list</DialogTitle>
        </DialogHeader>
        <Textarea readOnly value={json} className="h-64 font-mono text-xs" />
        <DialogFooter>
          <Button variant="outline" onClick={onCopy}>
            Copiar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportJsonButton({
  onImport,
}: {
  onImport: (g: RuleGroupType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const handleImport = () => {
    try {
      const parsed = JSON.parse(text);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !Array.isArray(parsed.rules) ||
        typeof parsed.combinator !== "string"
      ) {
        toast.error("JSON inválido — falta combinator/rules");
        return;
      }
      onImport(parsed);
      toast.success("JSON importado");
      setOpen(false);
      setText("");
    } catch {
      toast.error("Não foi possível parsear o JSON");
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-1 h-3 w-3" /> Importar JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar smart list de JSON</DialogTitle>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='{"combinator":"and","rules":[]}'
          className="h-64 font-mono text-xs"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!text.trim()}>
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
