
# PRD/SPEC — Gestão hierárquica de tarefas e projetos (estilo ClickUp + identidade O2)

## 1. Visão
Reorganizar a plataforma em torno de uma **hierarquia navegável Espaço → Pasta → Lista → Tarefa**, com visibilidade estrita por squad/projeto e três modos pessoais de trabalho. Tudo acessível pela sidebar, com breadcrumb e múltiplas views por nó. Pré-requisito: pacote de identidade visual O2 já aplicado.

## 2. Conceitos de domínio (mapping)

| ClickUp        | Oxy/O2 (existente)                      | Mudança |
|----------------|------------------------------------------|---------|
| Workspace      | `tenants` (O2 Inc.)                      | — |
| Space          | `squads` (IA / Marketing / Expansão)     | virar nó raiz da árvore; ganhar `icon`, `is_private` |
| Folder         | `projects.parent_id != null`             | já existe (Fase 6B) — promover como "Pasta" no UI |
| List           | `projects.parent_id` = folder (folha)    | mesma tabela; campo `is_list bool` (folha = lista) |
| Task           | `tasks`                                  | — |
| Personal Inbox | projetos `Inbox de {user}`               | manter; reforçar visibilidade só-do-dono |

Decisões travadas:
- **Tarefa pessoal = sem projeto vinculado** → mora na Inbox pessoal. Não criar coluna `is_private` em `tasks`.
- **Visibilidade de projetos = membros do projeto OU do squad dono**. Admin/Manager do tenant veem tudo.
- **Squads viram Spaces** com membros próprios; projetos herdam visibilidade do squad por padrão.

## 3. Modelo de visibilidade (regra única)

Um usuário **vê uma tarefa** quando:
1. é admin/manager do tenant, OU
2. é `assignee_id` / `reporter_id` / `created_by` da tarefa, OU
3. é membro do `project_members` do projeto da tarefa, OU
4. é membro do `squad_members` do squad dono do projeto E o squad/projeto não está marcado como `is_private`.

A mesma regra vale para `projects` (sem o item 2). Inbox pessoal (`projects.kind='inbox'`) é visível só para o `created_by`.

Implementação: nova SQL helper `can_see_project(_project uuid)` + `can_see_task(_task uuid)` (SECURITY DEFINER, `set search_path=public`). Policies de SELECT em `projects`, `tasks`, `comments`, `attachments`, `time_entries`, `task_assets`, `pomodoros` reescritas para usar esses helpers. INSERT/UPDATE continuam exigindo membership ativa.

## 4. Vistas pessoais padrão (sidebar topo)

| Item            | Filtro server-side |
|-----------------|--------------------|
| **Caixa de entrada** | tasks da Inbox pessoal do usuário |
| **Minhas tarefas**   | `assignee_id = me` (todos os projetos visíveis) |
| **Atribuídas por mim** | `reporter_id = me AND assignee_id <> me` |
| **Compartilhadas comigo** | `assignee_id = me OR me ∈ project_members` agrupado por projeto |
| **Hoje / Próximas / Atrasadas** | já existem — passam pelas novas RLS automaticamente |

Cada uma usa o mesmo `useTasks({ filter })` parametrizado.

## 5. Sidebar hierárquica (UI)

```text
┌─ Header: workspace switcher + busca ⌘K + avatar
├─ Vistas pessoais (Caixa, Minhas, Atribuídas, Compartilhadas)
├─ Planejado · Hoje · Próximas · Atrasadas · Calendário
├─ ── Favoritos (drag-to-reorder, já existe)
├─ ── Espaços (squads)
│   └─ ▸ Espaço "Marketing"   [+ pasta/lista]
│        └─ ▸ Pasta "Campanhas Q3"
│             └─ ☰ Lista "Lançamento X" (badge contagem)
│             └─ ☰ Lista "Conteúdo orgânico"
│        └─ ☰ Lista "Backlog rápido"
├─ + Novo Espaço
└─ Footer: convidar · personalizar · ajuda
```

- Substitui o `ProjectTreeSidebar` por `WorkspaceTreeSidebar` com 3 níveis (Espaço/Pasta/Lista) usando o mesmo `react-arborist`.
- DnD entre nós muda `parent_id` + `sort_order` (já suportado).
- Context-menu por nó: Renomear, Duplicar, Cor/Ícone, Mover, Arquivar, Privacidade.
- Collapsed mode: ícones do espaço + tooltip; clique abre popover com filhos.

## 6. Vistas por nó (centro)

Toda Lista, Pasta ou Espaço abre com tabs no topo (estado salvo por nó em `saved_views`):

- **Lista** (default) — grouping por status, com colunas customizáveis (já temos custom fields).
- **Quadro** (Kanban) — reaproveita `KanbanBoard` passando `nodeId`.
- **Calendário** — `due_at` no mês.
- **Gantt** — fase futura; placeholder.
- **+ Visualização** — cria saved view com filtros + grouping + colunas.

Breadcrumb no topo: `Espaço / Pasta / Lista` (cada parte é Link).

## 7. Toolbar de tarefa (estilo print)

Acima da lista: `Status · Atribuído · Data · Prioridade · Filtros · Buscar · ⚙ · + Tarefa`. Quick Add inline ao final do grupo "+ Adicionar Tarefa".

## 8. Permissões finas (papéis)

| Ação                          | requester | specialist | manager | admin |
|-------------------------------|-----------|------------|---------|-------|
| Ver projetos do squad         | ❌        | ✅ (se membro) | ✅ | ✅ |
| Criar Espaço/Pasta/Lista      | ❌        | ✅ (membro)| ✅      | ✅    |
| Marcar Espaço privado         | ❌        | ❌         | ✅      | ✅    |
| Arquivar Espaço               | ❌        | ❌         | ❌      | ✅    |
| Convidar para Espaço          | ❌        | ❌         | ✅      | ✅    |
| Ver tarefa atribuída a si     | ✅ (via /solicitar) | ✅ | ✅ | ✅ |

## 9. Migrations necessárias

1. `squads`: add `icon text`, `is_private bool default false`, `sort_order int default 0`.
2. `projects`: add `kind text check in ('space_root','folder','list','inbox') default 'list'`, `is_private bool default false`. Backfill: inbox pessoal → `inbox`; projetos com `parent_id null` e `squad_id null` → `list`; com filhos → `folder`.
3. Helpers: `can_see_project(uuid)`, `can_see_task(uuid)`, `is_squad_member(uuid)` (SECURITY DEFINER).
4. RLS rewrite (SELECT) em: `projects`, `tasks`, `comments`, `attachments`, `time_entries`, `task_assets`, `pomodoros`, `task_custom_field_values`.
5. Trigger `tg_project_inherit_squad`: ao criar projeto filho, herda `squad_id` do pai se vazio.
6. Índices: `tasks(assignee_id, done_at)`, `tasks(reporter_id)`, `projects(squad_id, parent_id, sort_order)`.

## 10. Frontend (entregáveis)

- `useWorkspaceTree()` — retorna árvore Espaços→Pastas→Listas com contagem de tarefas abertas (RPC `workspace_tree_counts`).
- `WorkspaceTreeSidebar.tsx` — substitui `ProjectTreeSidebar`, suporta 3 níveis + DnD + context-menu.
- `AppSidebar.tsx` — nova ordem de grupos (vistas pessoais → planejado → espaços → favoritos).
- `NodeViewPage.tsx` (rota `/app/n/:id`) — recebe qualquer nó (espaço/pasta/lista) e renderiza tabs.
- `PersonalViews/` — `InboxPage`, `MyTasksPage`, `AssignedByMePage`, `SharedWithMePage` reaproveitando `useTasks`.
- `Breadcrumb.tsx` — header de node view.
- `useTaskVisibility()` — apenas leitura; a regra é server-side.

## 11. Quebras + migração de dados

- Rotas antigas `/app/projetos/:id` redirecionam para `/app/n/:id` (mantém compat).
- Sidebar antiga em `pages/app/ProjetosPage` vira fallback para listar Espaços (admin).
- Inboxes pessoais existentes recebem `kind='inbox'` no backfill — comportamento de filtro em `useProjects` (esconder outras inboxes) deixa de ser heurística por nome.

## 12. Faseamento (entrega incremental, sem big-bang)

**Fase A — Backend de visibilidade (1 migration)**
- Migrations §9.1–§9.6. Reescreve RLS. Sem mudança visual.
- Verificação: rodar smoke como specialist em squad X — não vê tarefas de squad Y.

**Fase B — Sidebar hierárquica + vistas pessoais**
- `WorkspaceTreeSidebar`, novas vistas pessoais, breadcrumb, rota `/app/n/:id`.

**Fase C — Tabs por nó (Lista, Quadro, Calendário)**
- Generalizar `KanbanBoard` e `TaskList` para aceitar nó. Saved views por nó.

**Fase D — Polimentos**
- Context-menu completo, privacidade de espaço, ícones por espaço, contadores realtime via broadcast já existente.

## 13. Critérios de aceitação

1. Specialist do squad Marketing **não vê** projetos do squad IA (a menos que adicionado).
2. Tarefa criada na Inbox pessoal **não aparece** para nenhum outro usuário.
3. Tarefa em projeto compartilhado aparece em "Minhas tarefas" do assignee E em "Compartilhadas comigo" dos membros.
4. Arrastar uma Lista entre Pastas reflete em todos os clientes em <2s (broadcast).
5. Admin sempre vê tudo.
6. Nenhuma query do cliente quebra: rotas antigas redirecionam.
7. Sidebar collapsada continua usável em mobile (Sheet).

## 14. Fora de escopo (próxima onda)

- Permissões granulares por tarefa (compartilhamento individual).
- Gantt funcional.
- Templates de Espaço.
- Convites com escopo de Espaço (hoje só tenant).
