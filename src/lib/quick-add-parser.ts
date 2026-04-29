import * as chrono from "chrono-node";

export type ParsedPriority = "none" | "low" | "medium" | "high" | "urgent";

export interface ParsedQuickAdd {
  title: string;
  dueAt: Date | null;
  startAt: Date | null;
  priority: ParsedPriority;
  tags: string[];
  projectHint: string | null;
  estimateMinutes: number | null;
}

/**
 * Quick Add NLP parser para pt-BR.
 *
 * Sintaxe suportada:
 *   - Texto livre vira o título
 *   - "amanhã 14h", "sexta", "dia 30/05 às 16h"  → dueAt (chrono pt)
 *   - "!1" / "!urgente"  →  prioridade
 *   - "#tag"             →  tags
 *   - "@projeto"         →  projectHint (slug/key/nome)
 *   - "~30m" / "~2h"     →  estimateMinutes
 */
export function parseQuickAdd(input: string): ParsedQuickAdd {
  let text = input.trim();

  // 1) Tags  #algo
  const tags: string[] = [];
  text = text.replace(/(^|\s)#([a-z0-9-_áéíóúâêôãõç]+)/gi, (_m, sp, t) => {
    tags.push(t.toLowerCase());
    return sp;
  });

  // 2) Prioridade  !1..4 ou !palavra
  let priority: ParsedPriority = "none";
  const prioMap: Record<string, ParsedPriority> = {
    "1": "urgent", urgente: "urgent", urgent: "urgent",
    "2": "high", alta: "high", alto: "high", high: "high",
    "3": "medium", media: "medium", média: "medium", medio: "medium", médio: "medium", medium: "medium",
    "4": "low", baixa: "low", baixo: "low", low: "low",
  };
  text = text.replace(/(^|\s)!([a-z0-9áéíóúâêôãõç]+)/gi, (m, sp, key) => {
    const k = key.toLowerCase();
    if (prioMap[k]) {
      priority = prioMap[k];
      return sp;
    }
    return m;
  });

  // 3) Projeto  @algo
  let projectHint: string | null = null;
  text = text.replace(/(^|\s)@([a-z0-9-_]+)/gi, (_m, sp, p) => {
    projectHint = p.toLowerCase();
    return sp;
  });

  // 4) Estimativa  ~30m / ~2h / ~1h30m
  let estimateMinutes: number | null = null;
  text = text.replace(/(^|\s)~(\d+)(h|m|hr|min)?(\d+m)?/gi, (_m, sp, num, unit, extra) => {
    const n = parseInt(num, 10);
    let mins = 0;
    if (!unit || unit.toLowerCase().startsWith("m")) mins = n;
    else mins = n * 60;
    if (extra) mins += parseInt(extra, 10);
    estimateMinutes = mins;
    return sp;
  });

  // 5) Datas (chrono pt-BR)
  const refDate = new Date();
  const results = chrono.pt.parse(text, refDate, { forwardDate: true });
  let dueAt: Date | null = null;
  let startAt: Date | null = null;
  if (results.length > 0) {
    const first = results[0];
    dueAt = first.end?.date() ?? first.start.date();
    if (first.start && first.end) startAt = first.start.date();
    // remove o trecho de data do título
    text = (text.slice(0, first.index) + text.slice(first.index + first.text.length)).replace(/\s+/g, " ").trim();
  }

  // 6) Limpeza final do título
  const title = text.replace(/\s+/g, " ").trim();

  return {
    title: title || input.trim(),
    dueAt,
    startAt,
    priority,
    tags,
    projectHint,
    estimateMinutes,
  };
}