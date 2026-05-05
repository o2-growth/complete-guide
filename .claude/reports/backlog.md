# Backlog técnico — Oxy Growth OS

Lista viva de débitos, melhorias e gaps detectados. CTO popula a partir das auditorias e dos ciclos de correção.

## Estrutura

| ID  | Título | Severidade | Origem | Status |
|-----|--------|------------|--------|--------|

Severidades: **crítica** (bloqueia release/quebra produção), **alta** (impacto direto em UX/qualidade), **média** (melhoria importante), **baixa** (polimento).

Status: `aberto` | `em-fase-N` | `resolvido` | `descartado`.

---

## Itens iniciais (do `audit-initial.md` + `audit-functional-bugs.md`)

### Funcionais (Fase 1 — frontend)

| ID    | Título | Severidade | Origem | Status |
|-------|--------|------------|--------|--------|
| FB-01 | `<a href="#">descadastrar</a>` em `EmailPreview.tsx:50` (link morto em preview) | média | functional §1 | resolvido (2026-05-04) |
| FB-02 | `console.error(e)` em produção em `AppearancePage.tsx:63` | média | functional §1 | resolvido (2026-05-04) |
| FB-03 | Upload em batch silencioso (`TaskDetailSheet.tsx:517`) — falhas por arquivo não notificadas | baixa | functional §1 | resolvido (2026-05-04) |
| FB-04 | Clipboard silencioso em `SocialMediaPanel.tsx:61` | baixa | functional §1 | resolvido (2026-05-04) |
| FB-05 | Falha de envio de convite silenciosa em `useWorkspaces.tsx:116` | baixa | functional §1 | resolvido (2026-05-04) |
| FB-06 | Dead code: `src/pages/app/Placeholder.tsx` | baixa | functional §1 | resolvido (2026-05-04 — deletado) |
| FB-07 | Texto inconsistente de "modo simulação/preview/mock" em 7 páginas — `<DemoBadge>` unificado | média | functional §4 | resolvido (2026-05-04) |
| FB-08 | Smoke test E2E executado — 73 screenshots, 62 OK, 5 bugs altos identificados | concluído | smoke-test §1 | resolvido (2026-05-04) |
| FB-09 | Inputs sem `name=""` em `SquadsPage.tsx:53` e `ProjectsPage.tsx:38,45` (a11y/testabilidade) | alta | diag-3-fluxos §A,B | resolvido (2026-05-04) |
| FB-10 | `<Badge>` aninhado dentro de `<p>` em `PlanPage.tsx:23` e `ShortcutsPage.tsx:84` (warning DOM nesting) | baixa | smoke-test §menor | resolvido (2026-05-04) |
| FB-11 | QuickAdd "amanhã" → tarefa vai pra `/proximos`, não `/hoje` (chrono `forwardDate: true`) — ajustar smoke test ou adicionar toast informativo | baixa | diag-3-fluxos §C | aberto (decisão UX pendente) |

### Backend / Lovable Cloud — `[lovable]` (descobertos no smoke test 2026-05-04)

| ID    | Título | Severidade | Origem | Status |
|-------|--------|------------|--------|--------|
| LV-01 | RPC `health_snapshot` 400 → era `RAISE EXCEPTION 'forbidden'` (user não-admin); resolvido no frontend (`useHealthSnapshot` + `AdminHealthPage` mostra empty state amigável) | alta | smoke-test | resolvido (2026-05-04) |
| LV-02 | Join relacional `tenant_members → profiles` 400 → resolvido no frontend (2 queries separadas em `useAuditActors`) | alta | smoke-test | resolvido (2026-05-04) |
| LV-03 | Edge `ai-chat` + 13 funcs de IA — secret AI Gateway configurado/validado no Lovable | alta | smoke-test | resolvido (2026-05-04) |
| LV-04 | FK `tenant_members.user_id → profiles.id` declarada via Lovable | baixa | derivado de LV-02 | resolvido (2026-05-04) |

### Backend / Lovable Cloud — segurança/qualidade (fase final)

| ID    | Título | Severidade | Origem | Status |
|-------|--------|------------|--------|--------|
| BL-01 | Hooks de Realtime migrados para Broadcast com triggers no banco — `useTimer` e `useNotifications` agora `.on("broadcast", ...)`, triggers `tg_broadcast_*` aplicadas via Lovable | crítica | audit-initial §3.1 | resolvido (2026-05-04) |
| BL-02 `[lovable]` | Cobertura RLS estimada em 21% — ~95 tabelas sem POLICY explícita | crítica | audit-initial §3.2 | aberto |
| BL-03 | 275 `useQuery` sem `staleTime`/`gcTime`/`refetchOnWindowFocus` configurado | alta | audit-initial §3.3 | aberto (fase 2 — perf) |
| BL-04 | Acessibilidade WCAG 2.1 AA — só ~41 atributos `aria-*` em 2000+ elementos interativos | alta | audit-initial §3.4 | aberto (fase 3 — qualidade) |
| BL-05 | Wrapper `withErrorBoundary` em `_shared/` aplicado nas 14 funcs de IA (timeout 25s, retry exponencial, fallback PT-BR, structured logging) | alta | audit-initial §3.5 | resolvido (2026-05-04) |
| BL-06 | Audit `SET search_path = public` em todas as funções `SECURITY DEFINER` rodado via Lovable | alta | audit-initial §3.6 | resolvido (2026-05-04) |
| BL-07 | 14 páginas >250 linhas (DeveloperHubPage 408L, TaskTypesPage 391L, CapacityPage 364L, FocusPage 339L, DemandsPage 325L, etc.) | média | audit-initial §3.7 | aberto (fase 3) |
| BL-08 | Cobertura de testes ~0,5% (apenas `src/sdk/__tests__/sdk.test.ts`) | média | audit-initial §3.8 | aberto (fase 3) |
| BL-09 `[lovable]` | Migrations sem testes de rollback / sem documentação de constraints criadas | média | audit-initial §3.9 | aberto |
| BL-10 `[lovable]` | Realtime presence sem namespace `tenant:{id}` no room ID | baixa | audit-initial §3.10 | aberto |

## Oportunidades de polimento (do `audit-initial.md` §4)

| ID    | Título | Severidade | Origem | Status |
|-------|--------|------------|--------|--------|
| OP-01 | Fragmentar 5 páginas grandes em sub-componentes | média | audit-initial §4.1 | aberto |
| OP-02 | Toast/snackbar consolidado com persistência + retry | baixa | audit-initial §4.5 | aberto |
| OP-03 | Microinterações (shimmer consistente, confetti em conclusão, animação de modais) | baixa | audit-initial §4.6 | aberto |
| OP-04 | Kanban polish (sticky headers, inline editing, keyboard nav) | média | audit-initial §4.7 | aberto |
| OP-05 | Onboarding — 5 passos → 3 passos, vídeo walkthrough timer/pomodoro | média | audit-initial §4.8 | aberto |
| OP-06 | Performance bundle (tree-shake sonner, lazy-load mais agressivo em social/*) | baixa | audit-initial §4.9 | aberto |
| OP-07 | Consistência UI em modais/sheets (padrão título/ação/cancelar) | baixa | audit-initial §4.10 | aberto |

---

> **Convenção**: ao puxar item do backlog para uma fase, mude o status para `em-fase-N` e referencie o arquivo de plano. Quando concluído, `resolvido` + nota com data e PR.
