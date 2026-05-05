# Feature Gap Analysis — Oxy Growth OS vs TickTick + Ekyte

> Gerado em 2026-05-04. Baseado em:
> - Tour autenticado Ekyte via Playwright (`competitive-analysis/ekyte/` + 23 screenshots).
> - Pesquisa OSS profunda do TickTick (`competitive-analysis/ticktick/` — 4 arquivos, 28 fontes).
> - Estado atual do Oxy: `CLAUDE.md` raiz + `mem/roadmap.md` (48/48).

---

## 1. Killer features que faltam (priorizadas por impacto × esforço)

| # | Feature | Origem | Lib OSS pronta | Esforço | Prioridade |
|---|---------|--------|----------------|--------:|-----------:|
| KF-01 | **Slash command "/" no editor** (TipTap suggestion plugin estilo Notion) | gap único: nem TickTek nem Ekyte tem; vira diferencial competitivo | `@tiptap/suggestion` (já temos `@tiptap/react`) + lista custom | M | **P0** |
| KF-02 | **Hierarquia de pastas multi-nível** na sidebar (Folder > List > Sublist) | TickTick (3 níveis); Ekyte tem só 2 níveis | `react-arborist` (3.6k★, MIT, TS, virtualização + DnD inline) | M | **P0** |
| KF-03 | **Eisenhower Matrix view** (drag entre 4 quadrantes urgência×importância) | TickTick exclusivo | `@dnd-kit` (já temos) — só layout grid 2x2 | S | **P0** |
| KF-04 | **Habit tracker completo** (60+ pré-definidos, frequência custom, streaks, heatmap visual) | TickTick exclusivo | `react-activity-calendar` ou `shadcn calendar-heatmap` + tabela `habits` (já existe no schema) | M | **P1** |
| KF-05 | **Plan Your Day** (daily review guiado one-by-one: reschedule/complete/delete) | TickTick exclusivo, ritual matinal | custom (sem lib específica) | S | **P1** |
| KF-06 | **Smart Lists builder visual com filtros AND/OR compostos** | TickTick avançado | custom (saved_filters já existe — falta builder UI) | M | **P1** |
| KF-07 | **Recorrência RRULE-completa** (custom rules: "toda 3ª terça do mês", "exceto feriados") | TickTick rico; Ekyte simples | `rrule.js` (3.7k★, MIT, TS) + tabela `recurrences` (já existe) | S | **P1** |
| KF-08 | **Timeline/Gantt view** (subtarefas como barras filhas, drag de start/due) | TickTick exclusivo | `gantt-task-react` (1.1k★, MIT, TS nativo) | M | **P2** |
| KF-09 | **@mention rica em comentários e descrições** | ambos | `@tiptap/extension-mention` | S | **P1** |
| KF-10 | **Pomodoro com white noises (17 sons) + estatísticas de foco** | TickTick exclusivo | custom + assets de áudio (Howler.js opcional) | S | **P2** |
| KF-11 | **Status bar % de progresso** (slider 0-100% por gesto) | TickTick exclusivo | custom (campo `progress_pct` na tabela `tasks` — vai pro Lovable) | S | **P2** |
| KF-12 | **Countdown mode** (toggle data → "3d restantes") | TickTick exclusivo | custom (1 toggle no preferences) | XS | **P3** |
| KF-13 | **Suggested Tasks IA proativo** (análise de padrões + recomendação diária) | TickTick exclusivo (lançado dez/2025) | custom Edge Function (vai pro Lovable, reusa Lovable AI Gateway) | M | **P2** |
| KF-14 | **Two-way Google Calendar sync** (eventos GCal ↔ tasks Oxy) | TickTick (lançado 2025) | OAuth do Google (já temos `oauth_connections`) + Edge Function nova | L | **P2** |

### Ekyte-específicos (mais sobre escopo de produto que UX)

| # | Feature | Por quê importa | Esforço | Prioridade |
|---|---------|------------------|--------:|-----------:|
| EK-01 | **Módulo Atendimento** — tickets de longo prazo com SLA próprio (separado de tarefas) | DNA do Ekyte; Oxy só tem `demand_submissions` (formulário público) | L | P1 |
| EK-02 | **Pedido de Inserção (PI) + Praças** — mídia paga (ordem de compra + inventário de veículos) | Categoria-1ª do Ekyte; Oxy só cobre orgânico | L | P2 (decidir se entra no escopo) |
| EK-03 | **Personas + Públicos** — camada estratégica que vincula tarefas/posts/PIs a perfil-alvo | Estratégico em mkt; Oxy não tem | M | P2 |
| EK-04 | **Conhecimento (wiki interna)** como hub de top-nav | Procedimentos/briefings/decisões integradas | M | P1 |
| EK-05 | **Modelos de Checklist/Formulário/Mensagem** como entidades de 1ª classe (catálogo cross-módulo) | Oxy tem `templates`, `snippets`, `demand_forms` separados | M | P2 |
| EK-06 | **Top-nav horizontal por domínio** (Atendimento / Projetos / Mídia paga / Conhecimento / Configurações em cards icônicos) | UX claramente mais escaneável que sidebar densa | M | P3 (depende de redesign) |
| EK-07 | **Widget "Meus apontamentos" Ontem/Hoje vs meta 8h** | Feedback empático de carga | S | P2 |

---

## 2. Top 5 libs OSS que aceleram parity

| # | Lib | Stack alvo | Stars | Já no Oxy? | Cobre |
|---|-----|------------|------:|------------|-------|
| 1 | **`@tiptap/suggestion` + custom command list** | TipTap (já instalado) | core do TipTap | sim (parte) | KF-01 slash commands |
| 2 | **`react-arborist`** | React + TS, MIT | 3.6k | não | KF-02 folder hierarchy |
| 3 | **`rrule.js`** | TS puro, MIT | 3.7k | não | KF-07 recorrência |
| 4 | **`gantt-task-react`** | React + TS, MIT, TS nativo | 1.1k | não | KF-08 Gantt |
| 5 | **`@tiptap/extension-mention`** | TipTap (já instalado) | core do TipTap | não | KF-09 @mention |

> **Plate.js** (16.2k★) foi avaliada mas descartada: substituiria o TipTap (já temos) — re-trabalho enorme sem ganho proporcional. TipTap + suggestion plugin cobre slash commands com ~80% da experiência do Plate, sem migração.

---

## 3. Recomendação de fases (Fase 6 do CTO)

Plano detalhado em `plan-fase6-feature-parity.md`. Síntese:

| Sub-fase | Escopo | Tempo estimado | Onde |
|----------|--------|---------------:|------|
| 6A | Slash command "/" + @mention (TipTap suggestion + mention) | 2 dias | Frontend |
| 6B | Folder hierarchy (react-arborist) + Smart Lists builder visual | 3 dias | Frontend + 1 migration `[lovable]` |
| 6C | Eisenhower Matrix + Habit Tracker UI completa + Plan Your Day | 3 dias | Frontend + reuso de tabelas existentes |
| 6D | Recorrência RRULE + Pomodoro white noises + Countdown mode + Status % | 2 dias | Frontend + 1 campo novo `[lovable]` |
| 6E | Timeline/Gantt view + Suggested Tasks IA | 3 dias | Frontend + 1 Edge Function `[lovable]` |
| 6F | Ekyte parity (Atendimento + Wiki + Personas) | 5-7 dias | Frontend + schema novo `[lovable]` |
| 6G | Two-way Google Calendar sync | 2 dias | Edge Function `[lovable]` + OAuth flow frontend |

**Total estimado**: 20-22 dias de trabalho dos agentes (sem o Lovable). Ekyte parity (6F) é o maior bloco e depende de schema novo — pode ser fragmentado.

---

## 4. Anti-features (NÃO replicar)

- **Pricing pages com 3 planos confusos** do TickTick — Oxy já tem `<DemoBadge>` honesto.
- **Subscription modal pop-up agressivo** (TickTick mostra a cada 7 dias) — degrada UX.
- **Configurações fragmentadas em 12 sub-páginas** do Ekyte — manter Oxy mais consolidado.

---

## 5. Métricas de sucesso

Após implementação completa:
- 100% das features P0 e P1 da tabela KF entregues e testadas via E2E.
- Smoke test E2E continua 0 quebradas.
- Bundle final ≤ +200 KB gzip vs estado atual (limit pra não regredir performance).
- Cobertura de testes ≥ 50% nos novos hooks.
- a11y: 0 novos issues críticos no axe-core.
