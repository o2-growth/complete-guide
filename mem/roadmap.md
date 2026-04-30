---
name: Roadmap Oxy Growth OS
description: Sequência de 16 prompts/passos para construir o produto, conforme PRD §14
type: feature
---

Executar UM passo por turno. Não pular. Não amontoar.

1. ✅ Setup tema O2 (cores, tokens Tailwind, types DB, cliente Supabase)
2. ✅ Migration 001_init.sql — schema completo §4
3. ✅ Auth (/login, /onboarding) + useAuth + ProtectedRoute
4. ✅ Layout shell: Sidebar + Topbar + CommandPalette + dark mode
5. ✅ Inbox + Smart Lists + Quick Add NLP pt-BR (chrono-node)
6. ✅ Detalhe de tarefa em Sheet: TipTap, comentários, anexos, checklist, subtarefas
7. ✅ Kanban view com dnd-kit + auto-assign por status — Passo atual concluído
8. ✅ Calendário (mês/semana/dia/agenda) com drag para reagendar — Passo atual concluído
9. ✅ Tipos de tarefa (seed dos 9) + UI /settings/task-types
10. ✅ Time tracking (timer global Zustand + Realtime sync) + Pomodoro
11. ✅ Workload heatmap + matriz de alocação + drag para realocar
12. ✅ Formulários públicos /solicitar/:slug + /aprovar/:token + Edge process-demand
13. ✅ Templates de preview (ig_feed/story/reel/linkedin/email) + Grid IG 3×3
14. ✅ IA Gênio Growth (Edge Functions + chat streaming + ações inline)
15. ✅ Dashboard (recharts) + relatórios PDF/Excel
16. ✅ Polish: manifest instalável (PWA-lite), i18n pt-BR/en-US, skip-link a11y, página de Configurações

## Fase 2 — Ekyte (gestão avançada de equipe)
17. ✅ Skills Matrix (catálogo + auto-avaliação 1-5 + endossos + matriz visual)
18. ✅ Capacity planning detalhado (horas/semana, dias úteis, ausências, projeção 30d)
19. ✅ Página real de Squads (criação, membros com papel/capacity, KPIs: capacity total, abertas, concluídas 30d, atrasadas)
20. ✅ Página real de Projetos (criação, lista agrupada por squad, busca, arquivar; detalhe com Lista + Kanban + progresso)
21. ✅ Aprovações multi-etapas (workflows com etapas por papel/pessoa, quórum, painel visual de progresso na tarefa)
22. ✅ SLAs + alertas automáticos por tipo de tarefa (políticas por tipo+prioridade, badge ok/warning/breached em tarefas)
23. Templates de projeto recorrentes (clone com 1 clique)
24. Audit log navegável

Fases agrupadas: 1-15 = Fase 1 (núcleo TickTick), 16-24 = Fase 2 (Ekyte), 25-31 = Fase 3 (mídias), 32-36 = Fase 4 (relatórios+IA), 37-43 = Fase 5 (polish).
