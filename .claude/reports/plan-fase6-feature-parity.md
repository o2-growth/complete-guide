# Plano Fase 6 — Feature Parity TickTick + Ekyte

> Autor: CTO. Data: 2026-05-04. Status: **execução autônoma autorizada**.
>
> Base: `feature-gap-analysis.md` + `competitive-analysis/{ticktick,ekyte}/`. Roadmap atual 48/48 + 4 fases CTO concluídas. Fase 6 é o salto de qualidade pra "matar TickTick + Ekyte numa só ferramenta".

## Critérios de saída global da Fase 6

- [ ] 100% das features P0 entregues e testadas via E2E
- [ ] 80%+ das features P1 entregues
- [ ] Smoke test E2E continua 0 rotas quebradas
- [ ] Bundle ≤ +200 KB gzip vs estado atual (4.1 MB total)
- [ ] Cobertura de testes ≥ 50% nos hooks novos
- [ ] axe-core 0 novos issues críticos
- [ ] CLAUDE.md raiz atualizado com novas convenções (slash commands, folder tree)
- [ ] mem/roadmap.md ganha itens 49-55

---

## Sub-fase 6A — Slash command "/" + @mention rico

**Owner**: Dex + Aria (parceria)
**Tempo estimado**: 2 dias
**Risco**: baixo (TipTap já instalado)

### Tasks
- [ ] T1 — Instalar `@tiptap/suggestion` (já vem com `@tiptap/react`, conferir versão)
- [ ] T2 — Criar `src/components/tasks/RichEditor/slash-commands.ts` com lista de comandos:
  - `/heading` `/bullet` `/checklist` `/divider` `/quote` `/code`
  - `/date` (abre date picker inline)
  - `/assign` (abre user picker — usa `useTenantMembers`)
  - `/tag` (abre tag picker — usa `useTags`)
  - `/priority` (P0-P3)
  - `/duedate` `/reminder` `/estimate`
  - `/template` (insere template de checklist)
  - `/embed` (cola URL e expande para card)
- [ ] T3 — Criar `SlashCommandList` componente com keyboard nav (↑↓ Enter Esc)
- [ ] T4 — Integrar em `RichEditor.tsx` (`src/components/tasks/RichEditor.tsx`)
- [ ] T5 — Instalar `@tiptap/extension-mention` (lib oficial)
- [ ] T6 — Configurar @mention em comentários (`useRichComments.tsx`) com lista de membros do tenant
- [ ] T7 — Notificar mentioned users via `notify_comment_mentions` trigger (já existe? verificar)
- [ ] T8 — Testes vitest pra slash command list e mention parser
- [ ] T9 — E2E playwright: digitar `/`, navegar com setas, escolher comando, ver inserção

### Critério de saída
- Slash command funciona em todos os campos rich-text (descrição, comentário, snippet)
- @mention dispara notificação no canal correto
- 5 testes unitários + 1 E2E passando

---

## Sub-fase 6B — Folder hierarchy + Smart Lists builder

**Owner**: Aria + Dex
**Tempo estimado**: 3 dias
**Risco**: médio (mexe em sidebar + schema)

### Tasks
- [ ] T1 — `bun add react-arborist`
- [ ] T2 — Migration `[lovable]`: adicionar `parent_id uuid REFERENCES projects(id)` em `projects` (já tem? verificar). Permite até 3 níveis (validar em código).
- [ ] T3 — Refatorar sidebar (`src/components/layout/Sidebar.tsx`) substituindo lista plana de projetos por `<Tree>` do react-arborist. DnD pra reorganizar, rename inline, virtualização.
- [ ] T4 — Hook `useProjectTree(tenantId)` que monta árvore a partir de `useProjects` flat.
- [ ] T5 — Smart Lists: novo componente `<SmartListBuilder>` em `src/components/saved-views/` com builder visual de filtros AND/OR (campos: lista, tag, assignee, prioridade, data, status, keyword).
- [ ] T6 — Integrar em `/app/buscar` aba "Saved views" + dialog "Nova view".
- [ ] T7 — Testes do builder + E2E criando view composta.

### Critério de saída
- Sidebar com tree drag-drop, rename inline, expansão por chevron
- Smart Lists builder gera filtros corretos (verificar no DevTools React Query)
- Bundle não cresce > 30 KB gzip

---

## Sub-fase 6C — Eisenhower + Habit Tracker + Plan Your Day

**Owner**: Uma + Dex
**Tempo estimado**: 3 dias
**Risco**: baixo

### Tasks
- [ ] T1 — Eisenhower view em `src/pages/app/EisenhowerPage.tsx` com 4 quadrantes (DnD via dnd-kit já instalado). Rota `/app/eisenhower`. Atualiza `priority` da task ao soltar.
- [ ] T2 — `bun add react-activity-calendar` (heatmap GitHub-style)
- [ ] T3 — Refatorar `/app/conquistas` ou criar `/app/habitos` com:
  - Lista de hábitos do user (tabela `habits` já existe)
  - Botão "Marcar feito hoje" (UPSERT em `habit_checkins`)
  - Heatmap dos últimos 90 dias
  - Streak atual + recorde
  - Catálogo de 60+ hábitos pré-definidos (salvar em `src/lib/habits-catalog.ts` em pt-BR)
- [ ] T4 — `/app/plan-do-dia` (rota nova) com fluxo guiado:
  - Mostra todas tarefas overdue + due hoje (uma por vez)
  - 3 botões: "Concluir" / "Reagendar" / "Excluir"
  - Modal de reagendamento com chrono-node (já temos)
  - Ao final: "Tudo limpo. Seu dia está planejado."
- [ ] T5 — Sidebar ganha "Eisenhower", "Hábitos" e "Plano do dia"
- [ ] T6 — Testes E2E dos 3 fluxos

### Critério de saída
- 3 rotas novas funcionais
- Eisenhower atualiza prioridade no banco ao drop
- Habits inclui catálogo + heatmap
- Plan Your Day percorre todas overdue+today sem repetir

---

## Sub-fase 6D — Recorrência RRULE + Pomodoro white noise + Countdown + Status %

**Owner**: Dex
**Tempo estimado**: 2 dias
**Risco**: baixo

### Tasks
- [ ] T1 — `bun add rrule`
- [ ] T2 — Componente `<RecurrenceBuilder>` em `src/components/tasks/` com presets (diário, semanal, mensal, anual, custom) gerando string RRULE. Salvar em `recurrences` (já existe).
- [ ] T3 — Integrar no TaskDetailSheet substituindo o seletor simples atual.
- [ ] T4 — Pomodoro: adicionar 17 white noises em `public/sounds/` (chuva, lo-fi, fogo, café, vento, oceano, etc.) — usar fontes CC0 (freesound, pixabay).
- [ ] T5 — Player de áudio em `src/components/timer/AmbientPlayer.tsx` com volume, mute, troca de som ao vivo.
- [ ] T6 — Estatísticas de foco em `/app/foco` (gráfico de minutos focados por dia/lista/tag — recharts já temos).
- [ ] T7 — Countdown mode: toggle no profile preferences `due_at_format: "absolute" | "countdown"`. Em todos os lugares que renderizam due_at, ler preferência.
- [ ] T8 — Status % progresso: campo novo `progress_pct smallint DEFAULT 0` em `tasks` (`[lovable]` migration). UI: slider no TaskRow + barra de progresso.

### Critério de saída
- Recorrência custom "toda 3ª terça" funciona end-to-end
- White noises tocam, persistem entre sessões
- Countdown atualiza em real-time (refresh a cada minuto)
- Status % visível no Kanban/List

---

## Sub-fase 6E — Timeline/Gantt + Suggested Tasks IA

**Owner**: Aria + Dex
**Tempo estimado**: 3 dias
**Risco**: médio (Gantt é pesado)

### Tasks
- [ ] T1 — `bun add gantt-task-react`
- [ ] T2 — `/app/timeline` rota nova com Gantt das tasks com `due_at` definido, agrupado por projeto. Drag pra ajustar datas → mutation `useRescheduleTask`.
- [ ] T3 — Edge function `[lovable]` `ai-suggest-daily` (Lovable AI Gateway) que analisa: tasks overdue, padrões de criação, due_at, históricos de reagendamento → sugere "Hoje você deveria focar em X, Y, Z" com justificativa em pt-BR.
- [ ] T4 — Integrar sugestão diária no `/app/comecar` ou `/app/ia-proativa` (já existe a rota).

### Critério de saída
- Gantt renderiza < 1s para 100 tasks
- Drag atualiza due_at + start_at no banco
- Sugestão diária aparece no /app no primeiro acesso do dia

---

## Sub-fase 6F — Ekyte parity (Atendimento + Wiki + Personas + Modelos)

**Owner**: Aria (modelagem) + Dex (UI)
**Tempo estimado**: 5-7 dias
**Risco**: alto (schema novo, escopo grande)

### Tasks (high-level — detalhar antes de iniciar)
- [ ] T1 — Schema `[lovable]`: tabelas `tickets` (id, tenant, requester, owner, sla_id, status, priority, opened_at, closed_at), `ticket_events` (atividade), `ticket_messages` (resposta).
- [ ] T2 — Schema `[lovable]`: `wiki_pages` (id, tenant, parent_id, slug, title, body markdown, updated_by), `wiki_versions` (versionamento).
- [ ] T3 — Schema `[lovable]`: `personas` (id, tenant, name, age_range, pain_points jsonb), `audiences` (id, tenant, name, persona_ids[], channels[]).
- [ ] T4 — Schema `[lovable]`: `templates_unified` substituindo `templates` + `caption_snippets` + `demand_forms` por entidade única com `kind` enum (project | task_checklist | message | form | brief).
- [ ] T5 — UI: `/app/atendimento`, `/app/conhecimento`, `/app/personas`, `/app/modelos` (rotas novas).
- [ ] T6 — Sidebar reorganizada para top-nav horizontal por domínio (Trabalho / Mídia / Atendimento / Conhecimento / Configurações).

### Critério de saída
- Atendimento funcional com SLA próprio
- Wiki suporta hierarquia + busca FTS + versionamento
- Personas vinculáveis a tasks/posts
- Templates unificados com picker rápido

---

## Sub-fase 6G — Two-way Google Calendar sync

**Owner**: Gage (Edge Function) + Dex (frontend OAuth)
**Tempo estimado**: 2 dias
**Risco**: médio (OAuth + rate limiting)

### Tasks
- [ ] T1 — `[lovable]` Edge Function `gcal-sync-pull` (cron 15min) — lê eventos GCal de cada user com OAuth conectado, cria/atualiza tasks com `external_id`.
- [ ] T2 — `[lovable]` Edge Function `gcal-sync-push` (cron 5min) — envia tasks com `due_at` definido pra calendar do user.
- [ ] T3 — UI em `/app/configuracoes/integracoes`: botão "Conectar Google Calendar" → OAuth flow (já temos `oauth_connections`).
- [ ] T4 — Toggle "Sincronizar tasks ↔ calendar" + escolha de calendar de destino.

### Critério de saída
- Mudança no GCal aparece no Oxy em ≤15min
- Mudança no Oxy aparece no GCal em ≤5min
- Sem duplicatas (idempotência via `external_id`)

---

## Ordem de execução autônoma

1. **6A** (Slash command + @mention) — disparado agora.
2. **6B** (Folder + Smart Lists) — após 6A.
3. **6C** (Eisenhower + Habits + Plan Your Day) — paralelo com tail de 6B.
4. **6D** (Recorrência + Pomodoro + Countdown + %) — após 6C.
5. **6E** (Timeline/Gantt + Suggested AI) — paralelo com 6D.
6. **6F** (Ekyte parity) — última, requer alinhamento com Andrey antes (escopo grande).
7. **6G** (GCal sync) — paralelo com 6F.

CTO valida cada sub-fase antes da próxima começar. Itens `[lovable]` enviados via `lovable-patches/` à medida que aparecem.
