/**
 * Smart-list filter tree → Supabase query builder.
 *
 * Estrutura aceita em `saved_views.filters` (JSONB):
 *
 *   { combinator: "and" | "or", rules: Array<Rule | RuleGroup>, not?: boolean }
 *
 *   Rule       = { field: FilterField, operator: Operator, value: unknown }
 *   RuleGroup  = { combinator, rules, not? }
 *
 * Compatível com o formato de `react-querybuilder` (mesmas chaves), com nesting
 * infinito. Mantém retrocompat com schemas antigos: campos legados (`list`,
 * `assignee`, `tag`, `status`) são normalizados para os nomes novos
 * (`project_id`, `assignee_id`, `tag_id`, `status_id`) e operadores legados
 * (`is`, `before`, `after`, `contains` simples) seguem funcionando.
 */

export type Operator =
  // numéricos / string genéricos
  | "="
  | "!="
  | "<"
  | ">"
  | "<="
  | ">="
  | "in"
  | "notIn"
  | "between"
  | "notBetween"
  | "contains"
  | "doesNotContain"
  | "beginsWith"
  | "endsWith"
  | "null"
  | "notNull"
  // legados (Fase 6B) — aceitos por retrocompat
  | "eq"
  | "is"
  | "before"
  | "after";

/**
 * Campos novos exigidos pela Fase 7G + aliases legados (Fase 6B).
 * O adapter normaliza antes de aplicar a query.
 */
export type FilterField =
  // novos
  | "priority"
  | "status"
  | "project_id"
  | "assignee_id"
  | "tag_id"
  | "due_at"
  | "created_at"
  | "priority_score"
  | "done"
  | "keyword"
  // legados (mantidos para saved_views já criados)
  | "list"
  | "assignee"
  | "tag";

export interface Rule {
  field: FilterField;
  operator: Operator;
  value: unknown;
}

export interface RuleGroup {
  combinator: "and" | "or";
  rules: Array<Rule | RuleGroup>;
  not?: boolean;
}

export function isRuleGroup(node: Rule | RuleGroup): node is RuleGroup {
  return (node as RuleGroup).combinator !== undefined;
}

/**
 * Mapa de campo → coluna real no Postgres. Os nomes legados são apelidos
 * dos novos nomes para manter retrocompat sem migration.
 */
function columnFor(field: FilterField): string {
  switch (field) {
    case "list":
    case "project_id":
      return "project_id";
    case "assignee":
    case "assignee_id":
      return "assignee_id";
    case "status":
    case "status_id" as FilterField:
      return "status_id";
    case "tag":
    case "tag_id":
      return "tag_id";
    case "keyword":
      return "title";
    case "done":
      return "done_at";
    case "priority":
      return "priority";
    case "due_at":
      return "due_at";
    case "created_at":
      return "created_at";
    case "priority_score":
      return "priority_score";
    default:
      return String(field);
  }
}

/**
 * Converte um nó simples em fragmento PostgREST `field.op.value(s)` usado
 * dentro de `.or(...)`. Para `between` em datas geramos dois fragmentos
 * unidos por `,` (PostgREST aceita `gte.X,lte.Y` direto na expressão).
 */
export function ruleToPostgrestFragment(rule: Rule): string {
  const v = rule.value;
  const col = columnFor(rule.field);

  // tag mora em task_tags (M:N). Não consegue ir direto em or() — placeholder.
  if (rule.field === "tag" || rule.field === "tag_id") {
    const ids = Array.isArray(v) ? v : [v];
    return `__tag__:${ids.join("|")}`;
  }

  if (rule.field === "done") {
    if (rule.operator === "null") return "done_at.is.null";
    if (rule.operator === "notNull") return "done_at.not.is.null";
    return v ? "done_at.not.is.null" : "done_at.is.null";
  }

  if (rule.field === "keyword") {
    const term = String(v ?? "").replace(/,/g, "\\,");
    switch (rule.operator) {
      case "beginsWith":
        return `title.ilike.${term}*`;
      case "endsWith":
        return `title.ilike.*${term}`;
      case "doesNotContain":
        return `title.not.ilike.*${term}*`;
      case "=":
      case "eq":
        return `title.eq.${quoteIfNeeded(term)}`;
      case "!=":
        return `title.neq.${quoteIfNeeded(term)}`;
      case "null":
        return "title.is.null";
      case "notNull":
        return "title.not.is.null";
      case "contains":
      default:
        return `title.ilike.*${term}*`;
    }
  }

  // datas e numéricos
  if (
    rule.field === "due_at" ||
    rule.field === "created_at" ||
    rule.field === "priority_score"
  ) {
    switch (rule.operator) {
      case "<":
      case "before":
        return `${col}.lt.${String(v)}`;
      case ">":
      case "after":
        return `${col}.gt.${String(v)}`;
      case "<=":
        return `${col}.lte.${String(v)}`;
      case ">=":
        return `${col}.gte.${String(v)}`;
      case "=":
      case "eq":
        return `${col}.eq.${String(v)}`;
      case "!=":
        return `${col}.neq.${String(v)}`;
      case "between":
        if (Array.isArray(v) && v.length === 2) {
          return `and(${col}.gte.${String(v[0])},${col}.lte.${String(v[1])})`;
        }
        return "";
      case "notBetween":
        if (Array.isArray(v) && v.length === 2) {
          return `or(${col}.lt.${String(v[0])},${col}.gt.${String(v[1])})`;
        }
        return "";
      case "null":
        return `${col}.is.null`;
      case "notNull":
        return `${col}.not.is.null`;
      default:
        return `${col}.eq.${String(v)}`;
    }
  }

  // multiselect / string id (priority, status, project_id, assignee_id)
  const arr = Array.isArray(v) ? v : v == null || v === "" ? [] : [v];
  switch (rule.operator) {
    case "=":
    case "eq":
      return `${col}.eq.${quoteIfNeeded(arr[0] ?? v)}`;
    case "!=":
      return `${col}.neq.${quoteIfNeeded(arr[0] ?? v)}`;
    case "notIn":
      return `${col}.not.in.(${arr.map(quoteIfNeeded).join(",")})`;
    case "null":
      return `${col}.is.null`;
    case "notNull":
      return `${col}.not.is.null`;
    case "in":
    default:
      return `${col}.in.(${arr.map(quoteIfNeeded).join(",")})`;
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
  neq?: (col: string, val: unknown) => QueryLike;
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
 * Aplica um grupo (qualquer profundidade) em uma query Supabase.
 *
 * Estratégia:
 * - Combinator AND no nível raiz: aplica regra a regra encadeando filtros.
 * - Combinator OR (ou subgrupo OR): converte para string PostgREST `or(...)`.
 * - Subgrupo AND aninhado dentro de AND: recursão simples (filtros se somam).
 * - Subgrupo AND dentro de OR: vira fragmento `and(a.b.c,d.e.f)` no PostgREST.
 *
 * `not: true` em grupos é traduzido como `not.or(...)` / `not.and(...)` quando
 * possível, ignorado caso contrário (não há `.not` genérico para grupos AND
 * raiz no PostgREST sem reescrever a árvore).
 */
export function applySmartListFilters<Q extends QueryLike>(
  query: Q,
  group: RuleGroup,
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
  const col = columnFor(rule.field);

  if (rule.field === "tag" || rule.field === "tag_id") {
    if (tagFilteredTaskIds && tagFilteredTaskIds.length) {
      return q.in("id", tagFilteredTaskIds) as Q;
    }
    return q.in("id", ["__no_match__"]) as Q;
  }

  if (rule.field === "done") {
    if (rule.operator === "null") return q.is("done_at", null) as Q;
    if (rule.operator === "notNull") return q.not("done_at", "is", null) as Q;
    return v
      ? (q.not("done_at", "is", null) as Q)
      : (q.is("done_at", null) as Q);
  }

  if (rule.field === "keyword") {
    const term = String(v ?? "");
    switch (rule.operator) {
      case "beginsWith":
        return q.ilike("title", `${term}%`) as Q;
      case "endsWith":
        return q.ilike("title", `%${term}`) as Q;
      case "doesNotContain":
        return q.not("title", "ilike", `%${term}%`) as Q;
      case "=":
      case "eq":
        return q.eq("title", term) as Q;
      case "!=":
        return q.not("title", "eq", term) as Q;
      case "null":
        return q.is("title", null) as Q;
      case "notNull":
        return q.not("title", "is", null) as Q;
      case "contains":
      default:
        return q.ilike("title", `%${term}%`) as Q;
    }
  }

  // datas / numéricos
  if (
    rule.field === "due_at" ||
    rule.field === "created_at" ||
    rule.field === "priority_score"
  ) {
    switch (rule.operator) {
      case "<":
      case "before":
        return q.lt(col, v) as Q;
      case ">":
      case "after":
        return q.gt(col, v) as Q;
      case "<=":
        return q.lte(col, v) as Q;
      case ">=":
        return q.gte(col, v) as Q;
      case "=":
      case "eq":
        return q.eq(col, v) as Q;
      case "!=":
        return q.not(col, "eq", v) as Q;
      case "between":
        if (Array.isArray(v) && v.length === 2) {
          return q.gte(col, v[0]).lte(col, v[1]) as Q;
        }
        return q;
      case "notBetween":
        if (Array.isArray(v) && v.length === 2) {
          return q.or(`${col}.lt.${String(v[0])},${col}.gt.${String(v[1])}`) as Q;
        }
        return q;
      case "null":
        return q.is(col, null) as Q;
      case "notNull":
        return q.not(col, "is", null) as Q;
      default:
        return q.eq(col, v) as Q;
    }
  }

  // priority / status / project_id / assignee_id (multi)
  const arr = Array.isArray(v) ? v : v == null || v === "" ? [] : [v];
  switch (rule.operator) {
    case "=":
    case "eq":
      return q.eq(col, arr[0] ?? v) as Q;
    case "!=":
      return q.not(col, "eq", arr[0] ?? v) as Q;
    case "notIn":
      return q.not(col, "in", `(${arr.map(quoteIfNeeded).join(",")})`) as Q;
    case "null":
      return q.is(col, null) as Q;
    case "notNull":
      return q.not(col, "is", null) as Q;
    case "in":
    default:
      return q.in(col, arr) as Q;
  }
}

function ruleGroupToOrString(group: RuleGroup): string {
  const parts: string[] = [];
  for (const r of group.rules) {
    if (isRuleGroup(r)) {
      if (r.combinator === "and") {
        const inner: string[] = [];
        for (const rr of r.rules) {
          if (isRuleGroup(rr)) {
            // sub-sub-grupo dentro de AND dentro de OR — converte recursivamente.
            const sub = ruleGroupToOrString(rr);
            if (sub) inner.push(rr.combinator === "or" ? `or(${sub})` : sub);
          } else {
            const f = ruleToPostgrestFragment(rr);
            if (f && !f.startsWith("__tag__:")) inner.push(f);
          }
        }
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
    } else if (r.field === "tag" || r.field === "tag_id") {
      const v = r.value;
      if (Array.isArray(v)) acc.push(...(v as string[]));
      else if (v) acc.push(String(v));
    }
  }
  return Array.from(new Set(acc));
}

/**
 * Conta o total de regras simples (folhas) em uma árvore qualquer.
 */
export function countLeafRules(group: RuleGroup): number {
  let n = 0;
  for (const r of group.rules) {
    if (isRuleGroup(r)) n += countLeafRules(r);
    else n += 1;
  }
  return n;
}
