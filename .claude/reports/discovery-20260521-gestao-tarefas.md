# Discovery — Gestão de tarefas (IA + Extensão)

**Data:** 2026-05-21  
**Solicitante:** usuário (via Cursor)  
**Objetivo:** README no GitHub + análise do código vs requisitos operacionais.

---

## Requisitos declarados

1. Dois workspaces: time IA e time Extensão  
2. Coordenação do trabalho do time  
3. Tempo por tarefa + data de entrega  
4. Gantt, calendário e visões afins  
5. Vincular produtos do pipeline e gerir tarefas dentro deles  
6. ICE Score para priorização de demandas  
7. Matriz Eisenhower para urgências  
8. Pomodoro para foco  

---

## Diagnóstico do código (estado atual)

### Stack e saúde

| Métrica | Valor |
|---------|-------|
| Páginas React (`.tsx` em `src`) | ~387 |
| Migrations SQL | 58 |
| Testes Vitest | 78 passando |
| TypeScript | strict (`tsconfig.app.json`) |

Arquitetura madura: React Query para servidor, Zustand para timer global, Supabase com RLS multi-tenant, 30+ Edge Functions.

### Cobertura por requisito

| # | Requisito | Implementação | Evidência |
|---|-----------|---------------|-----------|
| 1 | 2 times | **Squads** `ia` + `expansao` OU **2 tenants** | `SquadsPage.tsx`, `WorkspacesPage.tsx`, seed em `mem/index.md` |
| 2 | Coordenação | Lista, Kanban, Hoje, Atribuídas, Squads KPIs | `ProjectDetailPage`, `SquadsPage`, hooks `useTasks` |
| 3 | Tempo + prazo | `time_entries`, `due_at`, timesheet | `useTimeTracking`, `TimesheetPage`, `TaskTimerPanel` |
| 4 | Gantt + calendário | Timeline + Calendar | `TimelinePage.tsx` (`gantt-task-react`), `CalendarPage` |
| 5 | Pipeline produtos | **Social pipeline** (posts); projetos = “produto” operacional | `SocialPipelinePage`; sem CRM/deal pipeline |
| 6 | ICE Score | **Ausente** | Nenhuma migration/campo/tela ICE; custom fields permitem workaround |
| 7 | Eisenhower | Completo com DnD | `EisenhowerPage.tsx` — priority ↔ quadrantes |
| 8 | Pomodoro | Completo | `FocusPage.tsx`, `pomodoros` table, `timerStore` |

### Gaps para “funcional agora” do pedido do usuário

1. **ICE Score nativo** — prioridade P0 para o fluxo de demandas  
2. **Pipeline de produtos genérico** — hoje é projeto+kanban ou pipeline social; se “pipe” = funil comercial, precisa modelagem nova (`products` / `pipeline_stages`)  
3. **README** — era stub Lovable; corrigido nesta sessão  
4. **Hierarquia ClickUp** (Espaço→Pasta→Lista) — PRD em `.lovable/plan.md`, Gantt na sidebar ainda marcado “fase futura” no PRD mas **Timeline já implementada**

---

## Recomendação operacional imediata (sem código)

### Setup em 30 minutos

1. **Um tenant** “O2 Growth” (ou usar existente).  
2. Criar squads **IA & Automação** (`kind: ia`) e **Expansão** (`kind: expansao`).  
3. Por squad, criar projetos = “produtos” ou iniciativas do pipe.  
4. Rotina diária: `/app/hoje` + `/app/eisenhower` + `/app/foco`.  
5. Planejamento: `/app/timeline` + `/app/calendario`.  
6. Demandas externas: `/app/demandas` → formulário `/solicitar/:slug`.  
7. ICE provisório: 3 custom fields rating na tarefa/demanda.

### Se precisar isolamento total entre times

Dois workspaces em `/app/workspaces` — cada um com squads e projetos próprios. Trade-off: sem visão unificada de carga.

---

## Proposta de implementação (fase CTO — aguarda aprovação)

### Fase A — ICE Score (2–3 dias dev)

- Migration: `tasks.ice_impact`, `ice_confidence`, `ice_ease` (smallint 1–10) + coluna gerada `ice_score`  
- UI: aba “Priorização” em `DemandsPage` ou página `/app/priorizacao` com tabela ordenável  
- Fórmula: `(impact * confidence) / NULLIF(ease, 0)` (padrão growth)

### Fase B — Pipeline de produtos (3–5 dias)

- Tabelas: `pipeline_products` (tenant, squad_id, name, stage) + FK opcional em `tasks.product_id`  
- View kanban por estágio do produto (reuso `@dnd-kit`)

### Fase C — Polish hierárquia ClickUp

- Conforme `.lovable/plan.md` — sidebar `WorkspaceTreeSidebar`

---

## Decisão

- **README + package.json** — entregues nesta sessão.  
- **Features ICE / pipeline genérico** — requerem aprovação do usuário/CEO antes de delegar Dex/Dara.
