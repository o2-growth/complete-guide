# Oxy Growth OS

Plataforma de gestão de tarefas e operação de Growth da O2 — combina produtividade (estilo TickTick), gestão de projetos (estilo Ekyte/ClickUp), timer/Pomodoro, calendário, Gantt, matriz Eisenhower, squads por time e integração com pipeline de mídias.

> **Idioma:** pt-BR na interface. Stack: React 18 + TypeScript + Vite + Supabase (Lovable Cloud).

---

## O que este repositório é

| Item | Detalhe |
|------|---------|
| **Produto** | Oxy Growth OS (uso interno O2 + planos comerciais) |
| **Backend** | Supabase — `project_id` em `supabase/config.toml` |
| **Estado** | Roadmap 43/43 fases entregues; foco em polimento e go-to-market |
| **Documentação técnica** | `CLAUDE.md` (regras do repo) + pasta `mem/` (schema, roadmap, IA) |

---

## Setup rápido

### Pré-requisitos

- [Bun](https://bun.sh) (recomendado) ou Node 20+
- Conta no [Lovable Cloud](https://lovable.dev) com o projeto Supabase vinculado

### Instalação

```bash
git clone <url-do-repo>
cd complete-guide
bun install
```

### Variáveis de ambiente

Crie `.env.local` na raiz (não commitar):

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```

Valores no painel Lovable Cloud → Settings → API.

### Desenvolvimento

```bash
bun run dev      # http://localhost:8080
bun run test     # Vitest (78 testes)
bun run lint
bunx tsc --noEmit
bun run build
```

---

## Modelo para dois times (IA + Extensão)

Há **duas formas** de separar os times. Escolha conforme isolamento desejado:

### Opção recomendada: 1 workspace + 2 Squads

Dentro do **mesmo tenant** (workspace O2), use **Squads** como “espaços” de cada time:

| Squad | Tipo no sistema | Cor |
|-------|-----------------|-----|
| Time de IA | `ia` — IA & Automação | Roxo |
| Time de Extensão | `expansao` — Expansão | Verde |

**Como configurar**

1. Acesse `/app/squads` e crie (ou use) os squads **IA & Automação** e **Expansão**.
2. Em `/app/projetos`, vincule cada projeto ao `squad_id` correspondente.
3. Tarefas do projeto herdam o squad; use **Workload** (`/app/workload`) para ver carga por pessoa.

Vantagem: visão executiva única, Eisenhower/Gantt/Calendário no mesmo tenant.

### Opção alternativa: 2 workspaces (tenants)

Se precisar **isolamento total** (dados, convites, billing):

1. `/app/workspaces` → **Novo workspace** para cada time.
2. Troque de workspace pelo seletor no topo da sidebar.
3. Cada time tem seu próprio conjunto de projetos, tarefas e membros.

---

## Funcionalidades que você pediu × rotas

| Necessidade | Status | Onde usar |
|-------------|--------|-----------|
| Coordenar o que o time faz | ✅ | `/app/hoje`, `/app/atribuidas`, `/app/squads`, `/app/projetos/:id` (Lista + Kanban) |
| Tempo por tarefa | ✅ | Timer na `TaskDetailSheet`, `/app/timesheet`, indicador global no topbar |
| Data de entrega | ✅ | Campo `due_at` em tarefas; vistas Hoje / Atrasadas / Próximas |
| Gantt | ✅ | `/app/timeline` (drag para reagendar) |
| Calendário | ✅ | `/app/calendario` |
| Matriz Eisenhower | ✅ | `/app/eisenhower` (drag entre quadrantes) |
| Pomodoro / foco | ✅ | `/app/foco` (25/5 min, stats do dia, som ambiente) |
| Pipeline de posts (mídia) | ✅ | `/app/social/pipeline` (kanban por estado de publicação) |
| **Produtos do Pipefy** | ✅ | `/app/configuracoes/integracoes/pipefy` → sync → `/app/projetos` (aba Pipefy) |
| Lista ClickUp (tabela) | ✅ | Dentro do projeto: aba Lista → modo **Tabela** |
| Vincular produto na tarefa | ✅ | Sheet da tarefa → **Produto/projeto** + relações extras |
| Demandas externas | ✅ | `/app/demandas` + formulário público `/solicitar/:slug` |
| **ICE Score** | ✅ | Colunas `ice_*` na tarefa + editor no sheet + coluna na tabela |

---

## Pipefy (produtos do pipe)

1. Configure o token `PIPEFY_TOKEN` no Lovable Cloud (secret).
2. Acesse `/app/configuracoes/integracoes/pipefy` e adicione o link do pipe.
3. Clique em **Sincronizar agora** (ou aguarde o cron de 15 min).
4. Os cards aparecem em `/app/projetos` → aba **Pipefy**.
5. Abra um card → **Lista** → **Tabela** → crie/edite tarefas e vincule produtos no sheet.

## ICE Score (priorização)

No detalhe da tarefa e na coluna **ICE** da tabela: Impacto × Confiança × Facilidade (1–10 cada). O score é calculado automaticamente no banco.

---

## Estrutura do repositório

```
complete-guide/
├── src/
│   ├── pages/app/     # Páginas autenticadas (/app/*)
│   ├── components/    # UI, kanban, calendar, timer, tasks…
│   ├── hooks/         # React Query + Supabase
│   └── integrations/supabase/
├── supabase/
│   ├── migrations/    # Schema PostgreSQL + RLS
│   └── functions/     # Edge Functions (IA, social, cron…)
├── mem/               # Memória do projeto (schema, roadmap)
└── e2e/               # Playwright
```

---

## Rotas principais (`/app/*`)

| Bloco | Exemplos |
|-------|----------|
| **Visões** | `hoje`, `proximos`, `atrasadas`, `atribuidas`, `calendario`, `kanban`, `foco`, `eisenhower`, `timeline` |
| **Trabalho** | `projetos`, `squads`, `demandas`, `workload`, `timesheet`, `aprovacoes` |
| **Mídias** | `social`, `social/pipeline`, `campanhas`, `social/studio` |
| **Insights** | `dashboard`, `reports`, `okrs`, `genio` (IA) |
| **Sistema** | `workspaces`, `configuracoes`, `ajuda` |

Lista completa em `src/App.tsx`.

---

## Hierarquia de dados

```
Tenant (workspace)
 └── Squad (IA / Marketing / Expansão)
      └── Projeto (pode ter subpastas)
           └── Tarefa (subtarefas até 3 níveis)
                ├── time_entries (cronômetro)
                ├── pomodoros
                └── comentários, anexos, tags
```

- **Multi-tenant:** toda tabela tem `tenant_id` + RLS.
- **Realtime:** Broadcast no canal `tenant:{id}` (não Postgres Changes).

---

## Testes e CI

```bash
bun run test           # 78 testes unitários
bunx tsc --noEmit      # TypeScript strict
bun run lint
```

GitHub Actions (`.github/workflows/ci.yml`): install → test → typecheck em PRs na `main`.

---

## Deploy

- **Frontend:** build Vite (`bun run build`) — hospedagem via Lovable.
- **Backend:** migrations em `supabase/migrations/` sincronizam automaticamente com Lovable Cloud ao fazer push no GitHub.
- **Edge Functions:** `supabase/functions/*` — mesma sincronização.

---

## Regras importantes (contribuidores)

1. **Nunca** usar a palavra “consultoria” — use assessoria, atendimento, serviço ou acompanhamento.
2. UI e copy em **pt-BR**, tratando o usuário por **“você”**.
3. Nova migration: `YYYYMMDDHHMMSS_descricao.sql`, idempotente, RLS habilitado.
4. Não editar `src/integrations/supabase/types.ts` à mão (gerado).
5. Orquestração de features grandes: skill CTO em `.claude/skills/cto/`.

---

## Licença e propriedade

Uso interno **O2 Inc.** — código proprietário. Não redistribuir sem autorização.

---

## Links úteis

| Recurso | Caminho |
|---------|---------|
| Guia de desenvolvimento | `CLAUDE.md` |
| Schema do banco | `mem/schema.md` |
| Roadmap (43 fases) | `mem/roadmap.md` |
| Features de IA | `mem/ai-genio.md` |
