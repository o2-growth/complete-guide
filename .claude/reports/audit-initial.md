# Auditoria de Baseline — Oxy Growth OS

> Gerada em 2026-05-04 pelo agente Explore na ativação inicial da estrutura CTO.
> Status: **draft** — alguns números (cobertura RLS, contagem de aria-labels) foram estimados por amostragem do agente e DEVEM ser revalidados pelo CTO antes de virarem decisão. Marcamos com `[verificar]` os pontos que exigem confirmação direta no código.

---

## 1. Resumo executivo

Oxy Growth OS é uma plataforma SaaS multi-tenant de gestão de tarefas, analytics e mídias sociais. Stack: React 18 + Vite + TS + Supabase. Atualmente: 60+ páginas em `src/pages/app/`, 60+ hooks em `src/hooks/`, 36 migrations, 30 edge functions, ~120 tabelas. Roadmap declarado 43/43 entregue.

**Riscos críticos identificados pelo Explore**:
1. Possíveis usos de `postgres_changes` em vez de Broadcast (violação CLAUDE.md §3) — `[verificar]` em `useNotifications.tsx` e `useTimer.tsx`.
2. Cobertura de RLS estimada em ~21% (26/121 tabelas) — `[verificar]` via grep `ENABLE ROW LEVEL SECURITY` em `supabase/migrations/`.
3. ~275 `useQuery` sem `staleTime`/`gcTime`/`refetchOnWindowFocus` configurados — N+1 latente em navegação.
4. Acessibilidade muito abaixo do esperado (~41 atributos `aria-*` para 2000+ elementos interativos) — `[verificar]`.
5. Edge functions com error handling fraco (timeout/retry/fallback ausentes em 14 de 29) — `[verificar]`.

**Diagnóstico geral**: produto funcional e completo de features, mas com débitos de qualidade (testes, a11y, caching, RLS) que precisam ser fechados antes de ele virar best-in-class. Nenhum bloqueador insuperável.

---

## 2. Mapa funcional (agrupado por domínio)

### Visões e triagem (7)
- `/app/hoje` — dashboard diário, tasks prioritárias, timer, pomodoro
- `/app/proximos` — tasks dos próximos 7 dias agrupadas por squad/projeto
- `/app/atrasadas` — SLA visual com indicadores
- `/app/calendario` — month/week/day/agenda com drag-drop
- `/app/kanban` — board por status (dnd-kit)
- `/app/foco` — sessão sem distração, timer, white-noise
- `/app/buscar` — busca semântica (FTS + halfvec embeddings)

### Trabalho (12)
- `/app/projetos` (CRUD), `/app/projetos/:id` (detalhe + kanban), `/app/aprovacoes` (workflow multi-etapa), `/app/slas` (políticas), `/app/templates` (clone rápido), `/app/audit` (atividade), `/app/squads` (equipes), `/app/demandas` (portal), `/app/workload` (heatmap), `/app/skills` (matriz), `/app/capacity` (planejamento), `/app/configuracoes/tipos` (task types).

### Mídias sociais (15)
- `/app/social` (calendário editorial), `/app/campanhas`, `/app/campanhas/:id` (relatório), `/app/biblioteca` (mídia), `/app/snippets` (legendas/hashtags), `/app/social/pipeline` (kanban), `/app/social/analytics`, `/app/social/studio` (editor + IA), `/app/social/intel` (concorrentes), `/app/social/inbox` (DMs), `/app/social/cadencia` (heatmap), `/app/social/creators` (UGC), `/app/social/bio` (link-in-bio), `/app/social/boosts` (ROAS), `/app/midias`.

### Insights (10)
- `/app/dashboard`, `/app/reports` (builder), `/app/anomalias`, `/app/forecast`, `/app/okrs`, `/app/exec`, `/app/copilot`, `/app/benchmarks`, `/app/simulacoes`, `/app/ia-proativa`.

### IA e automação (4)
- `/app/genio` (chat principal), `/app/automacoes` (regras visuais), `/app/automacoes/regras` (biblioteca), `/app/marketplace` (templates/integrações).

### Sistema (10)
- `/app/notificacoes`, `/app/comecar` (onboarding), `/app/conquistas` (gamificação), `/app/enterprise`, `/app/seguranca` (2FA, audit), `/app/ajuda`, `/app/atalhos`, `/app/workspaces`, `/app/developer` (API/webhooks/PWA), `/app/admin/erros`, `/app/admin/saude`.

### Configurações (9)
- `/app/configuracoes` (hub), `aparencia`, `idioma`, `dados` (import/export), `integracoes`, `integracoes-externas`, `privacidade`, `plano`, `tipos`.

### Públicas (8)
- `/`, `/auth`, `/precos`, `/checkout/:plan`, `/solicitar/:slug`, `/aprovar/:token`, `/aprovar-midia/:token`, `/bio/:slug`, `/aceitar-convite/:token`.

---

## 3. Top 10 riscos / problemas críticos `[a verificar]`

| # | Severidade | Item | Fonte (estimativa) | Ação proposta |
|---|-----------|------|---------------------|---------------|
| 1 | 🔴 alta   | `postgres_changes` em hooks de Realtime | `src/hooks/useNotifications.tsx`, `src/hooks/useTimer.tsx` | Refatorar para Broadcast em canal `tenant:{id}` |
| 2 | 🔴 alta   | Cobertura RLS ~21% (95 tabelas sem POLICY) | `supabase/migrations/*` | Migration de remediação RLS comprehensive |
| 3 | 🟠 alta   | 275 `useQuery` sem caching configurado | todos `src/hooks/*.tsx` | Centralizar profiles em `useQueryConfig.ts` |
| 4 | 🟠 alta   | Acessibilidade ~41 aria-* vs 2000+ elementos | todo `src/components`, `src/pages/app` | Axe-core no CI + remediação top 50 |
| 5 | 🟠 alta   | Edge functions sem timeout/retry/fallback (14/29) | `supabase/functions/ai-*`, `social-*` | Wrapper `withErrorBoundary()` + pino logging |
| 6 | 🟠 média  | `SECURITY DEFINER` em ~20 funcs sem `set search_path` confirmado | migrations diversos | Audit linha-a-linha + correção |
| 7 | 🟡 média  | 14 páginas >250 linhas (component bloat) | `pages/app/DeveloperHubPage.tsx` (408L), `TaskTypesPage.tsx` (391L), `CapacityPage.tsx` (364L), `FocusPage.tsx` (339L), `DemandsPage.tsx` (325L), etc. | Extrair sub-componentes |
| 8 | 🟡 média  | Cobertura de testes ~0,5% (1 arquivo de teste) | `src/sdk/__tests__/sdk.test.ts` | Iniciar com hooks críticos (useAuth, useTimer, useTasks) |
| 9 | 🟡 média  | Migrations sem testes de rollback | `supabase/migrations/*` | Documentar constraints em cada migration + workflow CI |
| 10| 🟡 baixa  | Realtime presence sem namespace de tenant | hooks com `usePresence` | Normalizar room IDs para `tenant:{id}:task:{uuid}` |

---

## 4. Top 10 oportunidades de polimento de alto impacto

1. **Fragmentar páginas grandes** (DeveloperHub, TaskTypes, Capacity, Focus, Demands) — 2 sprints, ganho enorme em testabilidade e legibilidade.
2. **Adicionar testes para hooks críticos** (useAuth, useTimer, useTasks) — 1 sprint, target 40% de coverage.
3. **Remediação WCAG 2.1 AA** — aria-labels, hierarquia de headings, validação de form, axe-core no CI. 2 sprints.
4. **Query profile centralizado** — defaults por tipo (tasks 5min, notifs 30s, projects 30min). 1 sprint.
5. **Toast/snackbar consolidado** com persistência + retry. 1-2 dias.
6. **Microinterações** — shimmer loading consistente, confetti em conclusão (já existe `useConfetti`), animação suave de modais. 3-5 dias.
7. **Kanban polish** — sticky column headers, inline editing de cards, navegação por teclado. 1 sprint.
8. **Onboarding** — reduzir 5 → 3 passos, vídeo walkthrough do timer/pomodoro. 3 dias.
9. **Performance bundle** — tree-shake sonner, lazy-load mais agressivo em rotas social/*. 2-3 dias.
10. **Consistência UI em modais/sheets** — padrão título/ação/cancelar, remover botões close customizados. 2-3 dias.

---

## 5. Cobertura de testes

| Métrica | Valor estimado |
|---------|----------------|
| Arquivos com testes | 1 (`src/sdk/__tests__/sdk.test.ts`) |
| Estimativa de cobertura | ~0,5% |
| Configuração CI | `.github/workflows/ci.yml` (vitest + tsc) |
| Tooling | vitest 3, jsdom, jest-dom, @testing-library/react |

**Gap crítico**: 0 testes em hooks, 0 em componentes, 0 em páginas. Áreas que MAIS precisam de teste: `useAuth`, `useTimer` (1 timer ativo por usuário, regra de banco), `useTasks` (regra de auto-numeração), `useNotifications` (loop de marcar lido).

---

## 6. Riscos arquiteturais

- **N+1 queries** — 275 useQuery sem cache; rota como `/app/hoje` pode disparar 20+ queries no mount.
- **Sem paginação** — listagens (tasks, notifications, audit) carregam tudo numa request. Memory leak provável em workspaces com 10k tasks.
- **Isolamento de tenant** — alguns hooks filtram por `user_id` sem confirmar `tenant_id` no escopo. Combinado com 95 tabelas sem RLS, há risco real.
- **Realtime escalabilidade** — postgres_changes no servidor mantém 1 WS por cliente; em escala (1000 usuários simultâneos), Broadcast com fan-out por canal `tenant:{id}` é mandatório.
- **Edge functions** — falhas silenciosas em `process-automations` e `schedule-publisher-tick` `[verificar]` podem mascarar problemas em produção.

---

## 7. Estado do banco

| Aspecto | Estado estimado |
|---------|------------------|
| Migrations | 36 arquivos cronológicos, sem testes de rollback documentados |
| Tabelas | ~121 |
| Triggers críticos esperados | `tg_set_updated_at`, `tg_set_task_number`, `tg_audit_task`, `tg_auto_assign_on_status_change`, `handle_new_user` — `[verificar]` linha-a-linha |
| Cobertura RLS | ~21% (estimativa) |
| Extensões | 8 obrigatórias declaradas (`uuid-ossp`, `pgcrypto`, `vector`, `pg_net`, `pg_cron`, `pgmq`, `pg_trgm`, `moddatetime`) |
| Materialized View | `mv_workload_by_user` (refresh 5min via pg_cron) |
| Buckets | `attachments` (25MB), `creatives` (50MB), `avatars` (2MB pública), `tenant-assets` (10MB), `exports` (signed 100MB), `media-assets/branding/{tenant}` |
| RPCs com `SECURITY DEFINER` | ~20, status do `set search_path = public` `[verificar]` |
| Helpers RLS | `user_tenant_ids()`, `user_role_in_tenant()`, `is_project_member()`, `has_tenant_role()` |

---

## 8. Estado das Edge Functions (30 funções)

`verify_jwt = false` (em `supabase/config.toml`): `api-public`, `webhook-dispatcher`, `bio-redirect`. Todo o resto exige JWT.

| Função | Categoria | Issue principal `[verificar]` |
|--------|-----------|-------------------------------|
| ai-breakdown, ai-categorize-task, ai-chat, ai-content-brief, ai-generate-copy, ai-generate-image | IA Gemini/OpenAI | timeout, sem retry, sem fallback |
| ai-summarize-week (`scorecard-monthly`), exec-briefing, daily-summary | IA agendado | timeout, sem retry |
| collect-social-metrics, social-inbox-poll, social-publish, schedule-publisher-tick | Social | rate limit não tratado, silent failure em scheduler |
| process-automations | Engine de regras | silent failures sem logging |
| process-demand | Workflow | timeout, sem retry |
| copilot-chat | Chat com tool-calling | stream abort missing |
| detect-anomalies, forecast-metric, what-if-simulate | Analytics IA | timeout, sem retry |
| daily-digest, send-scheduled-reports, send-invite | Email | sem retry em falha do provider |
| refresh-warehouse, scan-notifications, cron-tick | Crons | fire-and-forget |
| chat-notify | Push notifications | sem ack |
| webhook-dispatcher | Outbound webhooks | retry 3x já implementado ✅ |
| api-public | REST público | basic auth ok, falta rate limiting |
| bio-redirect | Tracking links | OK |

**Padrão proposto**: wrapper Deno `withErrorBoundary({ timeout: 25000, retries: 3, jitter: true })` + structured logging com `pino`.

---

## 9. Compliance com regras de ouro

| Regra | Status estimado |
|-------|------------------|
| Proibição da palavra "consultoria" | ✅ a confirmar com `grep -ri "consultoria" src supabase` |
| Multi-tenant + RLS | ⚠️ parcial (cobertura RLS baixa) |
| Realtime via Broadcast | ❌ violado em hooks de timer/notification `[verificar]` |
| `set search_path = public` em definer | ⚠️ não auditado |
| ProtectedRoute em rotas privadas | ✅ todas em `/app/*` |
| `src/components/ui/` intacto | ✅ |
| TypeScript strict | ✅ (`tsconfig.app.json`) |
| `any` injustificados | ⚠️ ~13 ocorrências `[verificar]` |

---

## 10. Recomendação de fases (proposta para CTO)

### Fase 1 — Segurança emergencial (Semanas 1-2, paralelo)
**Objetivo**: parar vazamentos reais e violações arquiteturais.
- Refatorar `useNotifications` + `useTimer` para Broadcast (Dex)
- Migration RLS comprehensive nas 95 tabelas faltando (Dara)
- Audit `SECURITY DEFINER` + correção de `set search_path` (Dara + Aria)
**Critério de saída**: 0 violações de regras de ouro confirmadas; CI verde.

### Fase 2 — Caching e isolamento (Semanas 2-3, sequencial após F1)
**Objetivo**: queries previsíveis e isolamento confirmado.
- `useQueryConfig.ts` central com profiles por tipo (Aria + Dex)
- Refatorar 50 hooks para usar profile (Dex)
- `useInfiniteQuery` em 5 listagens grandes (Dex + Quinn)
- Namespace `tenant:{id}` em rooms de presença (Dex)
**Critério de saída**: contagem de queries por navegação cai 60%+; teste de presence isolado.

### Fase 3 — Qualidade e testes (Semanas 3-5, paralelo)
**Objetivo**: confiança de refactoring e WCAG mínimo.
- Setup vitest fixtures + 200 testes em `useAuth`, `useTimer`, `useTasks` (Quinn)
- Refatorar 5 páginas grandes em sub-componentes (Dex)
- Axe-core no CI + remediação dos 50 issues mais frequentes (Uma)
**Critério de saída**: cobertura ≥40%; axe-core <10 violações; páginas top-5 todas <250L.

### Fase 4 — Edge functions e observability (Semanas 5-6, paralelo)
**Objetivo**: nenhuma falha silenciosa em prod.
- Wrapper `withErrorBoundary()` aplicado em todas as 14 funcs IA (Gage)
- Pino logging estruturado em todas as 30 funcs (Gage)
- Sentry integration + dashboard (Gage)
**Critério de saída**: traces visíveis no Sentry; 0 funcs com falha silenciosa; alertas configurados.

### Fase 5 (opcional) — Polimento UX (Semanas 6-8)
**Objetivo**: virar best-in-class de mercado.
- Microinterações, kanban polish, onboarding 3 passos, bundle reduction.
- Owner: Uma + Dex.

---

## 11. Próximos passos imediatos para o CTO

1. **Validar este baseline** — alguns números (RLS 21%, 275 useQuery sem cache, 41 aria-*) foram estimados; rodar greps reais antes de virar plano.
2. **Apresentar ao CEO** Fase 1 emergencial e pedir aprovação para disparar.
3. **Popular `backlog.md`** com os 10 riscos críticos como itens rastreáveis.
4. **Salvar `plan-20260504-fase1-seguranca.md`** com tasks detalhadas, owners (agentes) e critérios de aceite.

---

**FIM DO BASELINE — entregue em 2026-05-04 pelo Orion (CEO) na ativação da estrutura CTO.**
