# Oxy Growth OS — Guia para Claude

> Este arquivo é carregado automaticamente em toda sessão Claude Code dentro deste repositório. Leia-o por completo antes de tocar em qualquer arquivo. Em caso de conflito entre este guia e qualquer outro documento, **este aqui ganha**.

---

## 1. Identidade do produto

- **Nome:** Oxy Growth OS
- **Owner:** O2 Inc. (uso interno + planos comerciais públicos)
- **One-liner:** TickTick + Ekyte adaptados para o time de Growth da O2 — produtividade, gestão de mídias sociais, workload, IA Gênio e analytics num único cockpit.
- **Status:** Roadmap 43/43 entregue (ver `mem/roadmap.md`). Foco atual: **polimento, consistência, qualidade e go-to-market** para virar a melhor plataforma de gestão de tarefas do mercado.
- **Idioma único:** **Português brasileiro** em UI, copy, mensagens de erro, seeds e comentários. `es-ES` e `en-US` apenas como idiomas alternativos do app.

### Regras de ouro (NÃO QUEBRAR)

1. **PROIBIDO** usar a palavra "consultoria" em qualquer lugar (UI, schema, copy, comentários, commits). Use "assessoria", "atendimento", "serviço" ou "acompanhamento".
2. **Multi-tenant obrigatório** — toda tabela tem `tenant_id`; toda query passa pelo tenant atual; **RLS sempre habilitado**.
3. **Realtime via Broadcast** com triggers — **NÃO** use Postgres Changes. Canal: `tenant:{id}`.
4. **Postgres**: toda função usa `set search_path = public`; `security definer` só quando estritamente necessário; em policies use `(select auth.uid())` e não `auth.uid()` direto.
5. **Mobile-first**: `Sheet` no mobile, `Dialog` no desktop. PWA, sem app nativo.
6. **Tom**: pt-BR, sempre tratar usuário por **"você"** (nunca "tu" nem "vós").
7. **Backend**: apenas **Lovable Cloud / Supabase** (`project_id = dboftogzjobfvtjaoifh`). Nada de outro provider de banco.
8. **Lovable é a fonte de verdade do backend.** Este repo é o **frontend** do produto. As pastas `supabase/migrations/` e `supabase/functions/` aparecem aqui como **espelho de leitura** — são geridas no Lovable Cloud. **NÃO edite SQL ou Edge Functions diretamente neste repo.** Se algo backend precisar mudar, o CTO registra no `backlog.md` com tag `[lovable]` e o ajuste é feito depois no editor Lovable. Migrações e funções editadas aqui não vão para produção.
9. Termine cada resposta perguntando se o usuário quer ajustar algo antes de prosseguir — convenção do produto.

---

## 2. Stack travada

| Camada            | Tecnologia                                                                       |
|-------------------|----------------------------------------------------------------------------------|
| Build             | Vite 5 + `@vitejs/plugin-react-swc`                                              |
| Linguagem         | TypeScript 5.8 (strict ligado em `tsconfig.app.json`)                            |
| Runtime           | React 18.3                                                                       |
| Roteamento        | `react-router-dom@6` com `BrowserRouter`                                         |
| Estado servidor   | `@tanstack/react-query@5` (1 `QueryClient` em `App.tsx`)                         |
| Estado cliente    | `zustand@5` (ex: `src/stores/timerStore.ts`)                                     |
| UI                | `shadcn/ui` (style `default`, baseColor `slate`) + `Radix` primitives + `lucide-react` + `sonner` |
| Forms             | `react-hook-form@7` + `zod@3` (via `@hookform/resolvers`)                        |
| Drag&drop         | `@dnd-kit/core` + `@dnd-kit/sortable`                                            |
| Editor rich-text  | `@tiptap/react` + starter-kit + task-list/task-item                              |
| Datas             | `date-fns@3` + `chrono-node` (NLP pt-BR p/ Quick Add)                            |
| Charts            | `recharts`                                                                       |
| PDF/XLSX          | `jspdf` + `jspdf-autotable` + `xlsx`                                             |
| Backend           | Supabase (Lovable Cloud), `@supabase/supabase-js@2`                              |
| Edge Functions    | Deno (TypeScript) em `supabase/functions/*`                                      |
| Tema              | `next-themes` + CSS vars HSL (`src/index.css`)                                   |
| i18n              | Provider próprio em `src/lib/i18n/` (pt-BR, en-US, es-ES)                        |
| Testes            | `vitest@3` + `jsdom` + `@testing-library/react` + `@testing-library/jest-dom`    |
| Lint              | `eslint@9` flat config + `typescript-eslint@8`                                   |
| Package manager   | **Bun** (lockfile `bun.lockb` é a fonte de verdade) — `npm install` também funciona, mas mantenha consistência |

> **Não adicione novas dependências** sem alinhar com o CTO (ver §10). Antes de propor um pacote, confira se já existe alternativa instalada (`package.json`).

---

## 3. Estrutura do repositório

```
complete-guide/
├── CLAUDE.md                  ← este arquivo
├── README.md                  ← stub (preenchido pelo Lovable)
├── index.html                 ← entrypoint, PWA meta tags, fontes Inter/JetBrains Mono
├── package.json | bun.lockb   ← deps + scripts
├── tailwind.config.ts         ← tokens, cores marca, animações
├── components.json            ← config shadcn (alias @/components, @/lib, @/hooks)
├── vite.config.ts             ← alias @ → ./src, port 8080, lovable-tagger em dev
├── vitest.config.ts           ← jsdom + setupFiles src/test/setup.ts
├── tsconfig.{json,app,node}   ← TS configs
├── eslint.config.js           ← flat config
├── postcss.config.js          ← tailwind + autoprefixer
├── public/                    ← assets estáticos servidos como /
│
├── mem/                       ← memória interna do projeto (LER SEMPRE)
│   ├── index.md               ← entrypoint da memória
│   ├── roadmap.md             ← 43 fases, status, decisões (34KB!)
│   ├── schema.md              ← 25+ tabelas, triggers, RLS helpers
│   ├── edge-functions.md      ← 14+ funções planejadas
│   ├── ai-genio.md            ← features IA + prompts-mestre
│   └── task-types-seed.md     ← 9 tipos default obrigatórios
│
├── src/
│   ├── main.tsx               ← bootstrap React
│   ├── App.tsx                ← QueryClientProvider + ThemeProvider + I18nProvider + AuthProvider + Routes
│   ├── App.css | index.css    ← tokens HSL, classes utilitárias, reduced-motion
│   ├── vite-env.d.ts
│   ├── assets/                ← imagens, logo
│   ├── components/
│   │   ├── ui/                ← shadcn primitives (NÃO editar manualmente — regerar com CLI)
│   │   ├── layout/            ← AppLayout, Sidebar, Topbar, MobileBottomNav
│   │   ├── kanban/            ← board, column, card com dnd-kit
│   │   ├── calendar/          ← month/week/day/agenda views
│   │   ├── tasks/             ← TaskRow, TaskList, TaskDetailSheet, QuickAdd
│   │   ├── ai/                ← Copilot, Genius chat, suggestions
│   │   ├── social/            ← editor de post, previews IG/LinkedIn/Email
│   │   ├── previews/          ← templates ig_feed/story/reel/linkedin/email
│   │   ├── timer/             ← timer global + Pomodoro (sincroniza via Realtime)
│   │   ├── workload/          ← heatmap, matriz de alocação
│   │   ├── skills/            ← matriz de skills + endossos
│   │   ├── sla/               ← badges + políticas
│   │   ├── approvals/         ← workflows multi-etapa
│   │   ├── presence/          ← <PresenceAvatars> realtime
│   │   ├── onboarding/        ← OnboardingChecklist, GuidedTour
│   │   ├── feedback/          ← toasts, confetti, empty state
│   │   ├── skeletons/         ← shimmer loaders
│   │   ├── dashboard/         ← cards, charts wrappers
│   │   ├── EmptyState.tsx ErrorBoundary.tsx NavLink.tsx ProtectedRoute.tsx SEO.tsx
│   ├── hooks/                 ← 60+ hooks customizados (useAuth, useTasks, useGenius, ...)
│   ├── pages/
│   │   ├── Index.tsx Auth.tsx NotFound.tsx Onboarding.tsx AppHome.tsx
│   │   ├── app/               ← 60+ páginas autenticadas (dentro de /app/*)
│   │   └── public/            ← /solicitar/:slug, /aprovar/:token, /bio/:slug, /precos, /checkout, /aceitar-convite
│   ├── lib/
│   │   ├── utils.ts           ← cn(), formatadores
│   │   ├── exports/           ← gerador PDF/Excel
│   │   └── i18n/              ← dicionários e provider
│   ├── integrations/
│   │   └── supabase/          ← client.ts (createClient), types.ts (gerados)
│   ├── sdk/                   ← OxyClient TS público (consumidor da REST /api-public)
│   │   ├── index.ts README.md __tests__/
│   ├── stores/                ← zustand (timerStore.ts)
│   └── test/                  ← setup.ts (jest-dom + matchMedia mock)
│
└── supabase/
    ├── config.toml            ← project_id = dboftogzjobfvtjaoifh; verify_jwt off em api-public/webhook-dispatcher/bio-redirect
    ├── functions/             ← 30 Edge Functions Deno (ai-*, social-*, cron-*, exec-*, webhook-*, ...)
    │   └── _shared/           ← utilitários compartilhados (CORS, auth)
    └── migrations/            ← 36 migrations YYYYMMDDHHMMSS_*.sql (em ordem cronológica)
```

### Aliases (configurados em `vite.config.ts` + `tsconfig.app.json` + `components.json`)

| Alias        | Resolve para           |
|--------------|------------------------|
| `@/`         | `./src/`               |
| `@/components` | `./src/components`   |
| `@/ui`       | `./src/components/ui`  |
| `@/lib`      | `./src/lib`            |
| `@/hooks`    | `./src/hooks`          |
| `@/utils`    | `./src/lib/utils`      |

---

## 4. Modelo de domínio (visão rápida)

```
Tenant (O2 Inc., ou workspace de cliente)
 └─ Squad (IA & Automação / Marketing / Expansão)
     └─ Projeto
         └─ Tarefa (com subtarefas até 3 níveis)
             ├─ Comentários, anexos, checklist, tags
             ├─ time_entries (timer global, 1 ativo/usuário)
             ├─ pomodoros (1 ativo/usuário)
             ├─ task_assets (mídias sociais)
             └─ task_embeddings (vector halfvec 1536, busca semântica)
```

### Tabelas principais (lista resumida — ver `mem/schema.md` para completa)

`tenants`, `profiles`, `tenant_members`, `squads`, `squad_members`, `projects`, `project_members`, `task_statuses`, `task_types`, `tasks`, `assignment_matrix`, `tags`, `task_tags`, `comments`, `attachments`, `time_entries`, `pomodoros`, `habits`, `recurrences`, `reminders`, `demand_forms`, `demand_submissions`, `activities`, `notifications`, `saved_filters`, `oauth_connections`, `task_embeddings`, `ai_interactions` — mais ~50 tabelas adicionais entregues nas Fases 3-5 (mídias sociais, OKRs, automação, marketplace, etc.).

### Constraints e triggers críticos

- `uniq_active_timer_per_user` / `uniq_active_pomo_per_user` — UNIQUE parcial (`WHERE ended_at IS NULL`)
- `tasks.unique(project_id, number)` com auto-numeração via trigger (formato `MKT-123`)
- `tg_set_updated_at` genérico em todas as tabelas mutáveis
- `tg_audit_task` insere em `activities` em INSERT/UPDATE/DELETE
- `tg_auto_assign_on_status_change` consulta `assignment_matrix`
- `handle_new_user` cria `profile` ao registrar em `auth.users`

### Helpers RLS (security definer)

- `user_tenant_ids()` → `setof uuid`
- `user_role_in_tenant(uuid)` → `text`
- `is_project_member(uuid)` → `boolean`
- `has_tenant_role(_role text, _tenant uuid)` → `boolean`

### Materialized view

- `mv_workload_by_user` (refresh a cada 5min via `pg_cron`)

### Storage buckets

| Bucket          | Visibilidade | Tamanho máx. |
|-----------------|--------------|--------------|
| `attachments`   | privado      | 25 MB        |
| `creatives`     | privado, versionado | 50 MB |
| `avatars`       | leitura pública | 2 MB     |
| `tenant-assets` | privado      | 10 MB        |
| `exports`       | signed URL   | 100 MB       |
| `media-assets/branding/{tenant}` | privado | (logos) |

### Papéis

- **`tenant_members.role`**: `admin` | `manager` | `specialist` | `requester` (requester não tem licença, só `/solicitar` e `/aprovar`)
- **`project_members.role`**: `owner` | `editor` | `commenter` | `viewer`
- **`squad_members.role_in_squad`**: `lead` | `specialist`

---

## 5. Mapa de rotas (truncado — fonte de verdade é `src/App.tsx`)

### Públicas
- `/` Landing (`pages/Index.tsx`)
- `/auth` Login/cadastro
- `/precos`, `/checkout/:plan` Comercial
- `/solicitar/:slug` Portal de demandas (formulário público)
- `/aprovar/:token`, `/aprovar-midia/:token` Aprovações por link
- `/bio/:slug` Link-in-bio público (com tracking via Edge `bio-redirect`)
- `/aceitar-convite/:token` Onboarding por convite

### Autenticadas (`/app/*`, dentro de `<ProtectedRoute><AppLayout/>`)

| Bloco         | Rotas |
|---------------|-------|
| Visões        | `hoje`, `proximos`, `atrasadas`, `atribuidas`, `calendario`, `kanban`, `foco` |
| Trabalho      | `projetos`, `projetos/:id`, `aprovacoes`, `slas`, `templates`, `audit`, `squads`, `demandas`, `workload`, `skills`, `capacity`, `tipos` (dentro de configurações) |
| Mídias sociais | `social`, `campanhas`, `campanhas/:id`, `biblioteca`, `snippets`, `social/pipeline`, `social/analytics`, `social/studio`, `social/intel`, `social/inbox`, `social/cadencia`, `social/creators`, `social/bio`, `social/boosts`, `midias` |
| Insights      | `dashboard`, `reports`, `anomalias`, `forecast`, `okrs`, `exec`, `copilot`, `benchmarks`, `simulacoes`, `ia-proativa` |
| IA            | `genio` |
| Sistema       | `notificacoes`, `automacoes`, `automacoes/regras`, `developer`, `marketplace`, `comecar`, `conquistas`, `enterprise`, `seguranca`, `ajuda`, `atalhos`, `buscar`, `workspaces` |
| Configurações | `configuracoes`, `configuracoes/aparencia`, `configuracoes/idioma`, `configuracoes/dados`, `configuracoes/integracoes`, `configuracoes/integracoes-externas`, `configuracoes/privacidade`, `configuracoes/plano`, `configuracoes/tipos` |
| Admin         | `admin/erros`, `admin/saude` |

> Mantenha o catch-all `<Route path="*" element={<NotFound />}/>` sempre **por último**.

---

## 6. IA Gênio Growth

- **Provider preferido**: Lovable AI Gateway (`google/gemini-*`, `openai/gpt-*`).
- **Default rápido**: `google/gemini-2.5-flash`. **Pesado**: `google/gemini-2.5-pro`.
- **Rate limit**: 50 chamadas/usuário/hora — contagem em `ai_interactions`.
- **Toda chamada** registra em `ai_interactions` (`tokens_in`, `tokens_out`, `model`).
- **Tom**: pt-BR, "você", proibido "consultoria".
- **Features** (8): `ai-generate-copy`, `ai-categorize-task`, `ai-summarize-week`, `ai-breakdown`, `ai-chat`, `ai-suggest-reallocation`, `ai-efficiency-insight`, `match_tasks` (RPC, busca semântica via `halfvec(1536)` + `hnsw cosine`).
- **Edge Functions agendadas (`pg_cron` + `pg_net`)**: warehouse 03:00, anomalias hourly, krs 04:00, notifications 30min, reports 5min, webhook-dispatcher 2min.

---

## 7. Comandos de desenvolvimento

```bash
# Instalar deps (preferir bun, npm também funciona)
bun install

# Dev server (porta 8080, host ::, HMR overlay desligado)
bun run dev

# Type check
bunx tsc --noEmit

# Lint
bun run lint

# Testes (vitest + jsdom)
bun run test           # one-shot
bun run test:watch     # watch

# Build prod / preview
bun run build
bun run preview
```

> O servidor de dev fica em `http://localhost:8080`. O `vite.config.ts` desabilita o overlay de HMR — erros aparecem no console.

---

## 8. Convenções obrigatórias

### Estilo de código
- Componentes em **PascalCase**, hooks em **camelCase** com prefixo `use`.
- Use **TypeScript estrito** — não introduza `any` sem justificativa.
- Imports absolutos via `@/...` quando saindo da pasta corrente.
- shadcn primitives ficam em `src/components/ui/` — **não edite à mão**, regenere via CLI quando necessário.
- Tailwind: prefira tokens semânticos (`bg-primary`, `text-foreground`) em vez de cores fixas (`bg-blue-500`). Cores marca:
  - Primary (azul Oxy) `#0EA5E9` → CSS `hsl(var(--primary))`
  - Accent (dourado) `#FCD34D` → CSS `hsl(var(--accent))`
  - Squads: IA `#7c3aed`, Marketing `#ef4444`, Expansão `#10b981` (já mapeados como `bg-squad-ia` etc.)

### Acessibilidade
- Sempre `role` e `aria-*` apropriados em componentes interativos.
- Suporte a `prefers-reduced-motion` (já tratado em `src/index.css`).
- Skip-link e foco visível obrigatórios (já implementado, manter).
- Classe `.high-contrast` ajusta border/ring para AA.

### Realtime
- Canal sempre `tenant:{id}`.
- Use **Broadcast** com triggers, não Postgres Changes.
- Componente `<PresenceAvatars room="task:UUID">` para presence; `usePresence(room)` para listas próprias.

### Mobile
- `<768px` mostra `MobileBottomNav` (4 atalhos + FAB Quick Add). `pb-[env(safe-area-inset-bottom)]` para iOS notch.
- `Sheet` no mobile, `Dialog` no desktop — use `useIsMobile()` (`hooks/use-mobile.tsx`).

### Comentários no código
- **Padrão é não comentar.** Só explique o **porquê** quando for não-óbvio (constraint escondida, workaround específico, invariante sutil).
- Não documente o **o quê** — nomes bons já fazem isso.
- Não cite tarefa/PR/issue atual em comentário — isso vai na descrição do commit.

---

## 9. Testes

- Test runner: `vitest` (jsdom). Setup em `src/test/setup.ts` (mock `matchMedia`, importa `@testing-library/jest-dom`).
- Estrutura: testes ficam ao lado do código em `__tests__/` (ver `src/sdk/__tests__/`).
- CI: `.github/workflows/ci.yml` roda `bun install && bun test && tsc --noEmit` em PR/push main.
- **Antes de marcar tarefa como concluída**: rode `bun run test`, `bun run lint` e `bunx tsc --noEmit` localmente. Se for mudança de UI, abra o app no navegador e exercite o fluxo afetado — type-check e teste verificam **correção do código**, não **correção do produto**.

---

## 10. Modelo de orquestração — CTO no comando

> A partir deste repositório, **todo trabalho de código passa pelo CTO** (skill em `.claude/skills/cto/`).

- **Orion (CEO)** define a missão e delega ao CTO. O CEO não dá tarefa diretamente para devs deste projeto.
- **CTO** planeja, divide em fases, distribui tasks para os agentes-executores (Dex/Aria/Quinn/etc.), recebe entregas, **testa**, e só então aprova avanço de fase.
- **Devs (Dex, Aria, Uma, Dara, Gage etc.)** apenas **executam** — não decidem escopo.
- **CTO não executa** — ele verifica, testa, e se encontrar erro/inconsistência, **cria nova task de correção** e devolve ao agente responsável. Nada avança sem aprovação dele.

Para invocar o CTO neste repo:
1. Use a Skill `cto` (em `.claude/skills/cto/SKILL.md`) — ela carrega a persona completa e o protocolo de orquestração.
2. Ou abra um chat dentro deste diretório e diga "ativar CTO" / "passar pelo CTO".

Documentos vivos do CTO ficam em:
- `.claude/skills/cto/SKILL.md` — persona, regras, protocolo
- `.claude/reports/` — relatórios de auditoria, planos de fase, decision logs

---

## 11. Pegadinhas comuns

1. **Mudança de schema** → sempre nova migration em `supabase/migrations/` com timestamp atual. Nunca edite migration antiga já aplicada.
2. **Tipos do Supabase** ficam em `src/integrations/supabase/types.ts` e são **gerados** — não edite à mão.
3. **Variável de ambiente Supabase** (URL, anon key) é lida pelo client em `src/integrations/supabase/client.ts`. Se algo não conecta, confira valores no `.env.local` (não commitado).
4. **Edge functions com `verify_jwt = false`** (em `supabase/config.toml`): `api-public`, `webhook-dispatcher`, `bio-redirect`. Qualquer outra precisa de JWT — não exponha sem revisar segurança.
5. **Realtime presence** precisa de `tenant_id` no `track()` para isolamento — caso contrário você "vê" usuários de outros tenants.
6. **Lazy routes**: ao adicionar nova rota em `App.tsx`, mantenha o padrão de `lazy(() => import(...))` envolvido em `<Suspense fallback={<PageFallback/>}>`.
7. **Lovable preview**: `lovable-tagger` plugin só roda em `mode === "development"`. Não tente usá-lo em prod.
8. **Service Worker**: `public/sw.js` versão 2 (network-first em navegação, stale-while-revalidate em assets). Ao mudar app-shell, **bump da versão do SW** é obrigatório.
9. **PROIBIDO** alterar `bun.lockb` manualmente — sempre via comando.
10. **Nunca** crie arquivo `*.md` de documentação extra a menos que solicitado explicitamente. A fonte de verdade é este `CLAUDE.md` + `mem/`.

---

## 12. Onde olhar primeiro

| Você quer...                              | Comece por                                              |
|-------------------------------------------|---------------------------------------------------------|
| Entender o domínio                        | `mem/index.md` → `mem/schema.md`                        |
| Ver o que já foi entregue                 | `mem/roadmap.md` (43 fases)                             |
| Adicionar uma página nova                 | `src/App.tsx` (rota lazy) + `src/pages/app/...`         |
| Adicionar um hook de dados                | `src/hooks/useXxx.tsx` seguindo padrão React Query      |
| Mexer em IA                               | `mem/ai-genio.md` + `supabase/functions/ai-*`           |
| Criar tabela/RPC                          | nova migration em `supabase/migrations/` + atualizar `types.ts` |
| Mexer em mídia social                     | `src/components/social/` + `src/components/previews/` + `supabase/functions/social-*` |
| Customizar tema/branding                  | `src/index.css` (HSL vars) + `tailwind.config.ts` + `useBranding`  |
| Subir Edge Function nova                  | `supabase/functions/<nome>/index.ts` + (se cron) ajustar `cron-tick` |

---

## 13. Histórico vivo

Decisões arquiteturais relevantes ficam em `mem/roadmap.md` (uma linha por fase concluída). Adicione novas decisões lá, não neste arquivo. Este `CLAUDE.md` é referência **de como trabalhar**; o `roadmap.md` é referência **do que já foi feito**.

---

**Última atualização:** 2026-05-04 — bootstrap pelo Orion (CEO) ao ativar a estrutura de orquestração CTO.
