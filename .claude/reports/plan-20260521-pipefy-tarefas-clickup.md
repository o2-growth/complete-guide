# Plano — Painel de tarefas + Pipefy + lista ClickUp

**Data:** 2026-05-21  
**Status:** Fase 1 implementada no código (aguarda sync Lovable + `PIPEFY_TOKEN`)

---

## Diagnóstico (auditoria)

| Pedido do usuário | Antes | Depois (esta entrega) |
|-------------------|-------|------------------------|
| Projetos do pipe em `/app/projetos` | Integração existia mas UI sem destaque | Aba **Pipefy**, badge, CTA de configuração |
| Lista estilo ClickUp | Só `TaskListGrouped` (linhas) | **`TaskTableView`** com colunas editáveis |
| Vincular produto na tarefa | Só `project_id` implícito, sem picker | **`TaskProjectLinker`** + **`ProjectPicker`** |
| Relações extras | Não existia | Tabela **`task_project_links`** |
| ICE na tarefa | Já existia | Mantido no sheet + coluna ICE na tabela |

---

## Fluxo operacional

```mermaid
flowchart LR
  Pipefy[Pipefy pipe] -->|sync 15min| Projects[projects com pipefy_card_id]
  Projects --> ProjetosPage[/app/projetos]
  ProjetosPage --> ProjectDetail[/app/projetos/:id]
  ProjectDetail --> TaskTable[TaskTableView]
  TaskTable --> TaskSheet[TaskDetailSheet]
  TaskSheet --> Links[task_project_links]
```

1. Admin configura pipe em `/app/configuracoes/integracoes/pipefy` + secret `PIPEFY_TOKEN` no Lovable.
2. Edge `pipefy-sync` cria/atualiza `projects` (read-only).
3. Time abre projeto → aba **Lista** → modo **Tabela**.
4. Na tarefa: **Produto/projeto** (lista principal + produtos relacionados do pipe).

---

## Arquivos entregues

- `supabase/migrations/20260521170000_task_project_links.sql`
- `src/hooks/useTaskProjectLinks.tsx`
- `src/components/tasks/ProjectPicker.tsx`
- `src/components/tasks/TaskProjectLinker.tsx`
- `src/components/tasks/TaskTableView.tsx`
- Ajustes: `ProjectsPage`, `ProjectDetailPage`, `TaskDetailSheet`, `QuickAdd`, `useTasks`, `useProjects`, `LinkedItemCommand`

---

## Gate de aceite (CTO)

- [ ] Migration aplicada no Lovable Cloud
- [ ] `PIPEFY_TOKEN` configurado; sync manual retorna cards
- [ ] `/app/projetos` → aba Pipefy lista cards importados
- [ ] Abrir projeto → Lista → Tabela → editar status/prioridade/produto inline
- [ ] Abrir tarefa → vincular produto relacionado; link persiste após reload
- [ ] `bun run test` + `bunx tsc --noEmit` verdes

---

## Fase 2 (backlog — não nesta PR)

- Sidebar hierárquica ClickUp completa (`.lovable/plan.md` 6B)
- Campo custom `relation` nativo
- Sync bidirecional Pipefy (hoje read-only por design)
- Vista tabela na página global `/app/hoje` e smart lists
