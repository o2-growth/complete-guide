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
23. ✅ Templates de projeto recorrentes (tabela project_templates + RPCs save/apply, página /app/templates, clone com 1 clique)
24. ✅ Audit log navegável (página /app/audit com filtros por tipo/pessoa/projeto, agrupamento por dia, busca textual)

## Fase 3 — Mídias sociais
25. ✅ Pacote completo de mídias sociais — campanhas (social_campaigns), biblioteca de assets com bucket público (media_assets + storage), vínculo task↔asset (task_assets), campos sociais nas tasks (canal/estado/agendamento/legenda/campanha), aprovação pública por token (social_approval_requests + RPCs anon get/decide), páginas /app/social (calendário editorial mês), /app/campanhas (KPIs por campanha), /app/biblioteca (upload/busca/tags) e página pública /aprovar-midia/:token. Próximo (v25.1): integrar SocialMediaPanel ao TaskDetailSheet.
26. ✅ Mega-pacote de produção social — aba "Social" na TaskDetailSheet (canal/estado/agendamento/legenda + snippets/hashtags/IA + métricas), biblioteca reutilizável de legendas (caption_snippets) e grupos de hashtags (hashtag_groups) com página /app/snippets, geração de 3 variações de legenda via Lovable AI, pipeline visual /app/social/pipeline (kanban por publish_state com mover entre estados), analytics /app/social/analytics (alcance/impressões/likes/comments/saves/shares/clicks/seguidores, gráficos por dia e canal), tabela post_metrics, trigger auto-promote de tarefa ao aprovar link público, trigger de log no audit ao publicar, campo stage_checklists em campanhas. Sidebar reorganizada com grupo "Mídias sociais" dedicado.
27. ✅ OAuth + Studio + Inteligência integrados — schema social_integrations (tokens criptografados, modo "mock" funciona sem credenciais), scheduled_publishes (fila com retries/erros/external_url), content_briefs (pautas IA com ângulos+hooks JSON), competitors+competitor_posts (tracking manual). Trigger enqueue_scheduled_publish dispara quando task vai para 'scheduled'. Edge functions: social-publish (mock automático sem secrets, real com Meta Graph v21 + LinkedIn UGC quando META_APP_ID/SECRET ou LINKEDIN_CLIENT_ID/SECRET presentes), schedule-publisher-tick (varre fila e dispara), ai-content-brief (gera pauta JSON estruturada com Gemini Pro), ai-generate-image (Nano Banana base64). Páginas: /app/social/studio (gerar imagem IA + 3 variações de legenda + previews multi-canal lado a lado IG feed/story/reel/LinkedIn + salvar na biblioteca), /app/social/intel (3 abas: pautas IA / melhor horário baseado em métricas próprias / concorrentes com posts), /app/configuracoes/integracoes (conectar contas em modo mock, ver fila com botão "Publicar agora", processar fila on-demand).
28. ✅ Operação social end-to-end — Inbox unificada (DMs/comentários/menções) com sentimento, sugestão de resposta IA e conversão para tarefa via RPC `convert_inbox_item_to_task`; relatório de campanha (`campaign_report` RPC + página /app/campanhas/:id) com 10 KPIs, gráficos por canal e evolução temporal, top posts e export PDF (print); cadência semanal heatmap 7×24 por canal sobreposta com "melhor horário" das próprias métricas; edge functions `collect-social-metrics` (mock determinístico por hash, real-ready) e `social-inbox-poll` (gera mocks variados por sentimento). Tabelas: `social_inbox_items` (kind/sentimento/status/handled), `posting_cadence` (slot único por dow+hour+canal). Sidebar ganha "Inbox social" e "Cadência".
29. ✅ Pacote final Fase 3 (UGC + Link-in-bio + Boosts/ROAS) — Creators (`creators`), contratos com janela de direitos (`creator_contracts`), biblioteca UGC (`ugc_assets` com `rights_ok`/`rights_until` + RPC `repost_ugc` que cria task draft já vinculada ao asset). Link-in-bio: `bio_pages` (slug, theme json, view counter) + `bio_links` (UTMs por link, janela de ativação, contador de cliques) com policies `anon read active` para servir páginas públicas. Tracking via edge `bio-redirect` (lê link, monta URL final com UTMs, registra `link_clicks` com UA/referer/country e devolve 302). Boost manager: `ad_boosts` (budget/spent/revenue/objetivo/status), RPC `campaign_roas` (calcula spent/revenue/ROAS/clicks/CPC por campanha) e RPC `recommend_boosts` (top engajamento orgânico dos últimos 30d sem boost ativo). Páginas: /app/social/creators (Creators + UGC tabs com repost de 1 clique), /app/social/bio (CRUD de pages, lista de links com clicks ao vivo, gerador de UTM standalone), /app/social/boosts (KPIs Budget/Gasto/Receita/ROAS, sugestões de boost da IA, lista com barra de progresso de budget). Página pública /bio/:slug com tema customizado por tenant e botões cabeados pro redirect. Sidebar passa a 11 itens em Mídias sociais.

Fase 3 concluída (25-29). Próximo bloco: Fase 4 (32-36 → relatórios avançados + IA).

## Fase 4 — Relatórios avançados + IA
30. ✅ Warehouse + Report Builder + Anomaly Detection — schema OLAP-lite (`dim_date`, `fact_tasks_daily`, `fact_posts_daily`) populado pela RPC `refresh_warehouse(tenant)` que reagrupa últimos 90d de tarefas (squad/projeto/assignee/tipo) e posts (canal/campanha). `saved_reports` (source tasks|posts, métricas/dimensões/filtros como JSONB, chart_type bar|line|pie|table, favoritos) + `report_schedules` (cadência+recipients+next_run). RPC `run_report` monta SQL dinâmico com whitelist rígida de colunas e devolve linhas+chart_type. `metric_anomalies` (severity info|warning|critical, expected/observed/delta_pct, status open|ack|dismissed) alimentada pela RPC `detect_anomalies` que compara últimos 7d vs média de 30d em done_count, overdue_count e engajamento social. Edge functions: `refresh-warehouse` (rebuild por tenant) e `detect-anomalies` (roda RPC + IA Gemini Flash escreve `explanation` curta acionável em PT-BR para cada anomalia aberta). Páginas: `/app/reports` (3 colunas — lista de salvos / builder com source+gráfico+filtros de data + chips de métricas e dimensões / preview ao vivo bar/line/pie/table com recharts e botão Atualizar warehouse) e `/app/anomalias` (3 abas open/ack/dismissed, cards coloridos por severidade com setinha down/up, badge de delta, bloco IA destacado, ações Reconhecer/Dispensar). Sidebar Insights ganha "Report Builder" e "Anomalias IA".

Fases agrupadas: 1-15 = Fase 1 (núcleo TickTick), 16-24 = Fase 2 (Ekyte), 25-29 = Fase 3 (mídias), 30-36 = Fase 4 (relatórios+IA), 37-43 = Fase 5 (polish).
