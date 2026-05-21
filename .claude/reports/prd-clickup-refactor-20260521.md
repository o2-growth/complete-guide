# PRD — Refatoração ClickUp-like (Oxy Growth OS)

**Data:** 2026-05-21  
**Status:** Fase 1 implementada no código (aguarda deploy + validação visual)

## Decisões do usuário

| # | Decisão |
|---|---------|
| 1 | Landing autenticada = **Início** com Meu trabalho (como prints) |
| 2 | Espaços **editáveis**; seed: Banco de Projetos, Team IA, Team Expansão |
| 3 | **Sem sheet lateral** — detalhe em `/app/tarefas/:id` página cheia |
| 4 | Pipefy → espaço **Banco de Projetos** |
| 5 | Escopo **completo** (sidebar + início + lista + modal + página tarefa) |

## Entregue nesta sessão

### UX
- `ClickUpSidebar` — Início, Caixa, Comentários, Minhas tarefas ▾, Espaços (árvore)
- `InicioPage` — dashboard Meu trabalho + Recentes + Agenda
- `MyWorkPage` + `MyWorkPanel` — Pendente/Feito/Delegado, grupos Hoje/Atraso/Próximo
- `CreateTaskModal` — criar tarefa com seletor de lista
- `TaskDetailPage` — página cheia; `TaskDetailSheet` só redireciona
- `ListByStatusView` — lista agrupada por status (print 16.04)
- Default lista em projeto = modo **Lista** (ClickUp)

### Backend
- `seed_clickup_spaces()` + chamada em `ensure_user_workspace`
- Pipefy sync: `kind=list`, `squad_id` = Banco de Projetos

### Rotas
- `/app/inicio` (default)
- `/app/minhas-tarefas`, `/app/minhas-tarefas/hoje-atrasadas`
- `/app/lista-pessoal`, `/app/tarefas/:id`

## Próximo polish (Fase 2)
- Página tarefa 2 colunas (detalhe + atividade fixa à direita)
- Comentários atribuídos dedicados (não smart list genérica)
- Toolbar Quadro/Calendário/Tabela/Gantt unificada no header do nó
- Mobile: bottom nav alinhada ao ClickUp
