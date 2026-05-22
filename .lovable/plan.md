# Plano: Refazer o app do zero — Oxy Tasks (ClickUp-style)

Escopo confirmado: descartar as 43 fases anteriores, **DELETE** dos dados de projetos/tarefas, manter apenas identidade visual (logo, paleta lima, Montserrat/Anton, dark theme). O app vira **um gestor de tarefas focado**, sem mídias sociais, IA Gênio, OKRs, automações, marketplace, etc.

## Modelo de dados (novo, minimalista)

```text
tenants ── tenant_members (role: admin|member|guest)
   │
spaces (Espaço — ex: "Team IA & Automação")
   └─ folders (Pasta — opcional, 1 nível)
        └─ lists (Lista — onde tarefas vivem)
             └─ tasks
                  ├─ subtasks (self-FK, 3 níveis)
                  ├─ task_assignees (N:N)
                  ├─ task_tags
                  ├─ task_checklists → checklist_items
                  ├─ task_comments
                  └─ task_activity (audit)

statuses_per_list (cada Lista tem seus próprios status com cor)
```

Migration destrutiva única: `DROP` em tudo de tasks/projects/social/ai/etc no schema `public`, recria as 10 tabelas acima com RLS por tenant_id.

## Estrutura de rotas (enxuta)

| Rota | O que é |
|------|---------|
| `/auth` | Login (mantém) |
| `/app` | Home "Minhas tarefas" (Recentes + Meu trabalho + Agenda placeholder + Comentários) |
| `/app/inbox` | Caixa de entrada |
| `/app/atribuidas` | Atribuídas a mim |
| `/app/hoje` | Hoje e atrasadas |
| `/app/lista-pessoal` | Lista pessoal (privada) |
| `/app/s/:spaceId` | Espaço (agregado) |
| `/app/l/:listId` | Lista — com tabs Quadro/Lista/Calendar/Gantt/Table |
| `/app/t/:taskId` | Painel detalhe (sheet sobre a lista atual) |
| `/app/configuracoes` | Perfil, workspace, membros, aparência |

Tudo o que não estiver acima vira 404. Páginas atuais (`social`, `genio`, `okrs`, `automacoes`, `marketplace`, etc.) deletadas.

## Componentes-chave (novos)

1. **AppSidebar** — três blocos: Início (Inbox/Comentários/Minhas tarefas + filhos), Favoritos, Espaços (árvore Espaço→Pasta→Lista com contador, "+" inline, context-menu).
2. **ListHeader** — breadcrumb Espaço/Pasta/Lista + tabs de view + ações (Agentes/Automatizar/Compartilhar — só visual nesta fase).
3. **ListView** (default) — grupos colapsáveis por status com header colorido, colunas Nome/Responsável/Data/Prioridade/Status/Comentários, "+ Adicionar Tarefa" inline por grupo, "+ Novo status" no fim, BulkActionsBar inferior.
4. **BoardView** (Quadro) — Kanban dnd-kit por status.
5. **CalendarView** — mês com tarefas por dueAt.
6. **TableView** — grid densa com inline edit.
7. **GanttView** — placeholder simples (timeline horizontal por start/due).
8. **TaskSheet** — painel direito: título, status pill, datas, responsáveis, prioridade, etiquetas, descrição, Subtarefas, Checklists, Anexos, Activity, comentários.
9. **CreateTaskModal** — tabs Tarefa/Lembrete, picker de lista, chips OPEN/assignee/data/prioridade/etiqueta, botão Modelos (placeholder).
10. **HomeDashboard** — grid 2x2: Recentes, Meu trabalho (tabs Pendente/Feito/Delegado), Agenda (placeholder conectar Google/Outlook), Comentários atribuídos.

## Identidade visual preservada

- `src/index.css` (paleta lima/ink), `tailwind.config.ts`, Montserrat/Anton/JetBrains Mono, logo O2 — **intocados**.
- Todos os tokens semânticos (`bg-primary`, `text-foreground`) reutilizados.

## Limpeza de código

Deletar:
- `src/pages/app/*` (exceto novos)
- `src/components/{social,ai,automations,wiki,personas,atendimento,dashboard,calendar antigo,kanban antigo,workload,skills,sla,approvals,timer,modelos,saved-views,presence}/`
- `src/hooks/*` exceto `useAuth`, `useWorkspace`, `useTheme`, `useBranding`, `useIsMobile`, `use-toast`
- `supabase/functions/*` exceto `send-invite`, `admin-create-user`, `send-transactional-email`, `process-email-queue`, `handle-email-unsubscribe`, `handle-email-suppression`
- Rotas correspondentes em `App.tsx`

Manter:
- Auth, convites, e-mail infra, branding, layout shell (Sidebar/Topbar reescritos).

## Faseamento (build mode)

1. **F1 — Demolição + Schema**: migration destrutiva (drop + create 10 tabelas + RLS + triggers de updated_at/audit/auto-number). DELETE em dados antigos.
2. **F2 — Limpeza**: apagar pastas/arquivos listados, reescrever `App.tsx` com rotas novas, manter Auth.
3. **F3 — Sidebar + Espaços/Pastas/Listas**: hooks `useSpaces`, `useLists`, sidebar com árvore, CRUD via context-menu.
4. **F4 — ListView (lista agrupada por status)** + CreateTaskModal + TaskSheet básico.
5. **F5 — Outras views**: Quadro, Calendar, Table, Gantt (placeholder).
6. **F6 — Home + visões pessoais** (Inbox, Atribuídas, Hoje, Lista pessoal).
7. **F7 — Polimento**: realtime broadcast por tenant, atalhos, bulk actions, breadcrumbs.

## Riscos / decisões pendentes

- **Destrutivo de verdade**: vou rodar `DROP TABLE ... CASCADE` em ~80 tabelas. Sem rollback. Você confirma na migration quando ela aparecer pra aprovar.
- **Members do tenant atual são preservados** (não mexo em `auth.users` nem `tenant_members`).
- **Sem IA** nesta versão. Se quiser readicionar Gênio depois, vira módulo separado.

Quer que eu siga com essa estrutura ou prefere ajustar algo (ex: manter alguma área específica das 43 fases)?