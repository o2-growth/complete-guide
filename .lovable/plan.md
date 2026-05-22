## Diagnóstico

A criação **funciona** no banco — o problema é que a **leitura quebra com 400** logo depois, então a UI nunca mostra a tarefa nova e parece que "não criou".

Causa raiz (logs de rede):
```
GET /rest/v1/tasks?select=*,task_assignees(user_id,profiles:user_id(full_name,avatar_url))
→ 400 PGRST200
"Could not find a relationship between 'task_assignees' and 'user_id'"
```
`task_assignees.user_id` não tem FK para `profiles` no schema, então o embed aninhado `profiles:user_id(...)` falha. Resultado: `useTasks` joga erro, a lista fica vazia, contador "0 tarefa(s)" persiste mesmo após inserir.

Comparando com o print: o usuário também acha a Lista visualmente pobre vs. ClickUp — colunas só com título, sem coluna de responsável, prazo, prioridade, sem hover de ações, sem badge de progresso.

## Plano

### 1. Corrigir busca de tarefas (bug bloqueante)
- `src/hooks/useTasks.tsx`
  - Trocar embed aninhado por busca em 2 passos: `tasks` + `task_assignees(user_id)`; depois carregar `profiles` (id,full_name,avatar_url) em lote via `.in('id', userIds)` e fazer merge no cliente.
  - Aplicar mesma correção em `useMyTasks` (hoje usa `tasks!inner(*)`, que está OK, mas garantir merge de assignees igual).
- Resultado esperado: criar tarefa volta a aparecer instantaneamente; sem mais 400.

### 2. Aproximar a Lista do padrão ClickUp (visual + UX)
Mantendo a identidade visual O2 (verde Lima sobre Ink).

- `src/components/tasks/TaskRow.tsx` — virar linha tipo planilha com colunas:
  - checkbox de concluir · título · tags · responsáveis (avatares empilhados) · prazo (pill colorido se atrasado) · prioridade (bandeira colorida) · #número.
  - Hover revela botões rápidos (atribuir, prazo, prioridade, abrir).
- `src/pages/app/ListPage.tsx`
  - Cabeçalho de grupo de status: cor mais sutil (faixa fina + chip), não barra inteira saturada — fica menos "carnaval" e mais ClickUp.
  - Adicionar linha-cabeçalho com rótulos das colunas (Tarefa, Responsável, Prazo, Prioridade) acima do primeiro grupo.
  - Botão "+ Nova tarefa" **dentro de cada grupo** (cria já com aquele status), além do global no rodapé.
  - Persistir colapso de grupos no `localStorage` por lista.
- `src/components/tasks/TaskSheet.tsx` — adicionar seletor de responsáveis (multi) usando `useTenantMembers` + `task_assignees` (insert/delete). Usa a mesma RPC simples de `from('task_assignees').insert/delete`.

### 3. Sanidade pós-fix
- Rodar fluxo no preview: abrir a lista atual, criar tarefa → deve aparecer sob "Pendente"; arrastar para "Em progresso" no Quadro → deve persistir; abrir sheet → trocar prioridade e atribuir alguém.
- Verificar que `useMyTasks` continua mostrando o que foi atribuído.

## Fora de escopo (próximo passo, se quiser)
- Filtros (status/prioridade/responsável), busca, ordenação por coluna, agrupamento por responsável/prioridade, atalhos de teclado, vistas Calendário/Gantt.

Quer que eu siga assim ou prefere só o **bug fix** agora e o polimento ClickUp depois?
