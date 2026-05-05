/**
 * Smart-list filter tree → Supabase query builder.
 *
 * Estrutura aceita em `saved_views.filters` (JSONB):
 *
 *   { combinator: "and" | "or", rules: Array<Rule | RuleGroup> }
 *
 *   Rule       = { field: FilterField, operator: Operator, value: unknown }
 *   RuleGroup  = { combinator, rules }
 *
 * `field` válidos: list, tag, assignee, priority, status, due_at, keyword, done.
 *
 * O retorno de `applySmartListFilters(supabase, group, baseQuery)` aplica os
 * filtros sobre uma query Supabase já iniciada (`from("tasks").select(...)`)
 * e devolve a query encadeada. Para grupos com combinator "or" usamos o
 * filtro PostgREST `or(...)` traduzindo cada regra simples para a forma
 * `field.op.value`. Grupos AND aplicam regras em sequência.
 */

export type Operator =
  | "in"
  | "eq"
  | "contains"
  | "before"
  | "after"
  | "between"
  | "is";

export type FilterField =
  | "list"
  | "tag"
  | "assignee"
  | "priority"
  | "status"
  | "due_at"
  | "keyword"
  | "done";

export interface Rule {
  field: FilterField;
  operator: Operator;
  value: unknown;
}

export interface RuleGroup {
  combinator: "and" | "or";
  rules: Array<Rule | RuleGroup>;
}

export function isRuleGroup(node: Rule | RuleGroup): node is RuleGroup {
  return (node as RuleGroup).combinator !== undefined;
}

/**
 * Converte um nó simples em fragmento PostgREST `field.op.value(s)` usado
 * dentro de `.or(...)`. Para `between` em datas geramos dois fragmentos
 * unidos por `,` (PostgREST aceita `gte.X,lte.Y` direto na expressão).
 */
export function ruleToPostgrestFragment(rule: Rule): string {
  const v = rule.value;
  switch (rule.field) {
    case "list": {
      const ids = Array.isArray(v) ? v : [v];
      return `project_id.in.(${ids.map(quoteIfNeeded).join(",")})`;
    }
    case "assignee": {
      const ids = Array.isArray(v) ? v : [v];
      return `assignee_id.in.(${ids.map(quoteIfNeeded).join(",")})`;
    }
    case "priority": {
      const arr = Array.isArray(v) ? v : [v];
      return `priority.in.(${arr.map(quoteIfNeeded).join(",")})`;
    }
    case "status": {
      const ids = Array.isArray(v) ? v : [v];
      return `status_id.in.(${ids.map(quoteIfNeeded).join(",")})`;
    }
    case "keyword": {
      // ilike PostgREST usa `*` no lugar de `%` e exige escape de vírgulas.
      const term = String(v ?? "").replace(/,/g, "\\,");
      return `title.ilike.*${term}*`;
    }
    case "due_at": {
      if (rule.operator === "before") return `due_at.lt.${String(v)}`;
      if (rule.operator === "after") return `due_at.gt.${String(v)}`;
      if (rule.operator === "between" && Array.isArray(v) && v.length === 2) {
        // Para representar AND dentro de OR usamos "and(...)" como elemento.
        return `and(due_at.gte.${String(v[0])},due_at.lte.${String(v[1])})`;
      }
      return `due_at.eq.${String(v)}`;
    }
    case "done": {
      // boolean → `done_at` not null / null
      return v ? "done_at.not.is.null" : "done_at.is.null";
    }
    case "tag": {
      // Caso especial: tag mora em task_tags (M:N). Usamos a coluna
      // `task_tags!inner(tag_id)` no PostgREST. Como o filtro PostgREST não
      // alcança junções aninhadas dentro de `or`, devolvemos uma expressão
      // que o aplicador converte via `applySmartListFilters` para .in() em
      // pre-fetch (ver tagPreFilterIds). Aqui retornamos placeholder.
      const ids = Array.isArray(v) ? v : [v];
      return `__tag__:${ids.join("|")}`;
    }
    default:
      return "";
  }
}

function quoteIfNeeded(v: unknown): string {
  const s = String(v);
  if (/^[a-zA-Z0-9_-]+$/.test(s)) return s;
  return `"${s.replace(/"/g, '\\"')}"`;
}

export interface QueryLike {
  in: (col: string, vals: readonly unknown[]) => QueryLike;
  eq: (col: string, val: unknown) => QueryLike;
  ilike: (col: string, val: string) => QueryLike;
  gte: (col: string, val: unknown) => QueryLike;
  lte: (col: string, val: unknown) => QueryLike;
  lt: (col: string, val: unknown) => QueryLike;
  gt: (col: string, val: unknown) => QueryLike;
  is: (col: string, val: unknown) => QueryLike;
  not: (col: string, op: string, val: unknown) => QueryLike;
  or: (filters: string) => QueryLike;
}

/**
 * Aplica um grupo simples (combinator AND no topo) em uma query Supabase.
 * Para grupos OR aninhados usa `or(...)` de PostgREST.
 *
 * Limitação consciente: filtro de `tag` não vai dentro de OR — se aparecer
 * dentro de OR, é ignorado naquela ramificação. Para AND-tag o aplicador
 * resolve fazendo um pré-fetch de `task_tags` e usa `.in("id", [...])`.
 */
export function applySmartListFilters<Q extends QueryLike>(
  query: Q,
  group: RuleGroup,
  // Lista de task ids pré-filtrada por tag (calculada externamente).
  tagFilteredTaskIds?: readonly string[],
): Q {
  if (group.combinator === "and") {
    let q = query;
    for (const rule of group.rules) {
      if (isRuleGroup(rule)) {
        if (rule.combinator === "or") {
          const fragment = ruleGroupToOrString(rule);
          if (fragment) q = q.or(fragment) as Q;
        } else {
          q = applySmartListFilters(q, rule, tagFilteredTaskIds);
        }
        continue;
      }
      q = applySingleRule(q, rule, tagFilteredTaskIds) as Q;
    }
    return q;
  }
  // grupo OR no topo
  const fragment = ruleGroupToOrString(group);
  if (fragment) return query.or(fragment) as Q;
  return query;
}

function applySingleRule<Q extends QueryLike>(
  q: Q,
  rule: Rule,
  tagFilteredTaskIds?: readonly string[],
): Q {
  const v = rule.value;
  switch (rule.field) {
    case "list":
      return q.in("project_id", Array.isArray(v) ? v : [v]) as Q;
    case "assignee":
      return q.in("assignee_id", Array.isArray(v) ? v : [v]) as Q;
    case "priority":
      return q.in("priority", Array.isArray(v) ? v : [v]) as Q;
    case "status":
      return q.in("status_id", Array.isArray(v) ? v : [v]) as Q;
    case "keyword":
      return q.ilike("title", `%${String(v ?? "")}%`) as Q;
    case "due_at": {
      if (rule.operator === "before") return q.lt("due_at", v) as Q;
      if (rule.operator === "after") return q.gt("due_at", v) as Q;
      if (rule.operator === "between" && Array.isArray(v) && v.length === 2) {
        return q.gte("due_at", v[0]).lte("due_at", v[1]) as Q;
      }
      return q.eq("due_at", v) as Q;
    }
    case "done":
      return v ? (q.not("done_at", "is", null) as Q) : (q.is("done_at", null) as Q);
    case "tag": {
      if (tagFilteredTaskIds && tagFilteredTaskIds.length) {
        return q.in("id", tagFilteredTaskIds) as Q;
      }
      // Sem ids resolvidos: aplica filtro impossível pra retornar vazio em vez
      // de ignorar silenciosamente a regra.
      return q.in("id", ["__no_match__"]) as Q;
    }
    default:
      return q;
  }
}

function ruleGroupToOrString(group: RuleGroup): string {
  const parts: string[] = [];
  for (const r of group.rules) {
    if (isRuleGroup(r)) {
      if (r.combinator === "and") {
        const inner = r.rules
          .map((rr) => (isRuleGroup(rr) ? "" : ruleToPostgrestFragment(rr)))
          .filter(Boolean);
        if (inner.length) parts.push(`and(${inner.join(",")})`);
      } else {
        const inner = ruleGroupToOrString(r);
        if (inner) parts.push(`or(${inner})`);
      }
    } else {
      const f = ruleToPostgrestFragment(r);
      if (f && !f.startsWith("__tag__:")) parts.push(f);
    }
  }
  return parts.join(",");
}

/**
 * Coleta todos os ids de tag mencionados no nó (recursivo) em qualquer
 * combinator. Usado pelo aplicador pra fazer pré-fetch em `task_tags`.
 */
export function collectTagIds(group: RuleGroup): string[] {
  const acc: string[] = [];
  for (const r of group.rules) {
    if (isRuleGroup(r)) {
      acc.push(...collectTagIds(r));
    } else if (r.field === "tag") {
      const v = r.value;
      if (Array.isArray(v)) acc.push(...(v as string[]));
      else if (v) acc.push(String(v));
    }
  }
  return Array.from(new Set(acc));
}
