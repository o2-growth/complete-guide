# Auditoria de Coerência Sistêmica — Oxy Growth OS

**Autor:** Aria (architect) sob coordenação CTO
**Data:** 2026-05-04
**Escopo:** validar se as entidades do sistema conversam entre si com lógica consistente, com foco em **gestão de tempo/carga vs criação de tarefas**.

---

## 1. Mapa de relacionamentos

### 1.1 Diagrama de domínio (com FKs reais)

```
auth.users (Supabase Auth)
   ├─ profiles  (1:1, FK profiles.id → auth.users.id; trigger handle_new_user)
   │     └─ preferences JSONB (guarda tenant_id "atual" + inbox_project_id)
   │
   └─ tenant_members  (N:N, role: admin|manager|specialist|requester)
         └─ tenants
              ├─ squads  (kind: ia|marketing|expansao|custom)
              │     └─ squad_members (FK squad_id, FK user_id, role_in_squad: lead|specialist, capacity_hours_week)
              │
              ├─ projects  (FK tenant_id; FK squad_id NULLABLE; parent_id auto-ref para hierarquia 6B)
              │     └─ project_members (role: owner|editor|commenter|viewer)
              │     └─ tasks  (FK project_id NOT NULL)
              │           ├─ parent_task_id  (auto-ref, até 3 níveis — validado em código)
              │           ├─ assignee_id     (FK auth.users — NÃO valida tenant_membership)
              │           ├─ status_id       (FK task_statuses)
              │           ├─ type_id         (FK task_types)
              │           ├─ estimate_minutes / spent_minutes / progress_pct
              │           ├─ persona_id / audience_id  (estratégia)
              │           ├─ campaign_id / social_channel / publish_state
              │           ├─ time_entries  (1 ativo/usuário; trigger atualiza spent_minutes em stop_timer)
              │           ├─ pomodoros     (1 ativo/usuário)
              │           ├─ comments      (mentions UUID[] → notify_comment_mentions)
              │           ├─ attachments / task_assets / task_embeddings
              │           └─ activities    (trigger tg_audit_task)
              │
              ├─ task_types       (com default_estimate_minutes — definido mas NÃO consumido)
              ├─ task_statuses    (com is_done flag)
              ├─ assignment_matrix (project_id, type_id, status_id → assignee_id; trigger tg_auto_assign no UPDATE de status)
              ├─ user_capacity    (hours_per_week, daily_hours, workdays[])
              ├─ time_off         (vacation|sick|holiday|personal|other; status pending|approved|rejected)
              ├─ skills + user_skills + skill_endorsements
              ├─ saved_filters    (legado v1)
              ├─ saved_views      (v2 — usado pela sidebar)
              ├─ notifications    (kind enum incluindo task_assigned mas SEM TRIGGER de fato)
              └─ mv_workload_by_user  (refresh pg_cron 5min)
```

### 1.2 Hooks principais e o que cada um lê

| Hook | Lê de | Observações |
|---|---|---|
| `useWorkspace` | `profiles.preferences` + RPC `ensure_user_workspace` | Resolve `tenant_id` + `inbox_project_id` (self-heal) |
| `useTasks(list)` | `tasks` filtrado por `inbox/today/next7/overdue/assigned` | Inbox = `project_id = inboxProjectId` |
| `useKanbanTasks` | `tasks` por tenant (até 500) | |
| `useQuickAdd` | INSERT em `tasks` com `project_id = inboxProjectId` | Sempre cai no Inbox; ignora `default_estimate_minutes` |
| `useUpdateTask` | UPDATE genérico (qualquer campo) | Usado para mudar status/prioridade/datas; **não há UI exposta para mudar assignee** |
| `useTaskTypes` | `task_types` por tenant | Carrega `default_estimate_minutes` mas nada o aplica |
| `useTenantMembers` (2 versões) | `tenant_members` + `profiles` | Existe duplicada em `useTenantMembers.tsx` e `useSquads.tsx` e `useWorkload.tsx` |
| `useSquads` | `squads + squad_members + projects + statuses` | Calcula KPIs com até 3× N+1 queries (loop por squad) |
| `useWorkloadTasks(from,to)` | `tasks` com `due_at not null` no range | Heatmap |
| `useCapacityData` | `user_capacity + time_off + tenant_members + profiles` | |
| `useAssignmentMatrix` | `assignment_matrix` | CRUD |
| `useSkillsMatrix` | `skills + user_skills` | Sem ligação com `tasks` |
| `useNotifications` | `notifications` (Broadcast) | Realtime via `tenant:{id}:notifications` |
| `useSavedViews` | `saved_views` | Sidebar mostra pinned |

---

## 2. Coerência por área

### 2.1 Tarefas <-> Projetos — **CHECK parcial**

- **Toda task tem `project_id`?** Sim. Coluna `project_id UUID NOT NULL REFERENCES projects(id)` no schema (`migration 20260429220549`). FK obrigatória.
- **Quick Add vai pra Inbox?** Sim. `useQuickAdd` (linhas 200-219 de `useTasks.tsx`) injeta `project_id: inboxProjectId` lido de `useWorkspace`.
- **Inbox por tenant?** **CHECK** — RPC `ensure_user_workspace` cria 1 projeto Inbox por usuário e salva em `profiles.preferences.inbox_project_id`. Cada usuário tem o próprio Inbox dentro do tenant.
- **Task pode mudar de projeto via UI?** **GAP**. `TaskDetailSheet` (linhas 220-302) expõe apenas Status / Prioridade / Vencimento. Nenhum `<Select>` para `project_id`. `useUpdateTask` aceita o patch, mas a UI não oferece o campo. O usuário fica preso ao projeto onde a task foi criada.
- **Subtarefa herda projeto da pai?** **CHECK**. `useTaskDetail.tsx` linha 227 — `useCreateSubtask` faz `INSERT { project_id: parentTask.project_id, parent_task_id: parentTask.id, ... }`. Profundidade até 3 níveis é validada apenas no PRD; nenhum check em DB.

**Severidade do GAP de troca de projeto:** média. Trabalha-se em torno arrastando no Kanban — mas Kanban não exibe projetos diferentes do filtro atual.

---

### 2.2 Squads <-> Equipes <-> Membros — **CHECK com observação**

- **`squads.kind`?** **CHECK**. Enum em `useSquads.tsx`: `"ia" | "marketing" | "expansao" | "custom"` — alinhado com `mem/schema.md`.
- **`squad_members.role_in_squad`?** **CHECK**. Enum `"lead" | "specialist"`.
- **Membro em múltiplos squads?** **CHECK**. `squad_members` é tabela N:N sem UNIQUE em `(squad_id, user_id)` aparente; capacity_hours_week é somada no `useTenantMembers` (`useWorkload.tsx:58-61` faz `cur + capacity` para cada squad em que está) — comportamento correto se a intenção for "8h/dia distribuídas em N squads".
- **Departamento separado?** **GAP de modelagem leve**. Não há tabela `departments`. Squad é o único agrupamento humano. Decisão implícita: **squad = departamento operacional**. Documente no `mem/schema.md` para evitar dúvidas futuras.

**Inconsistência:** existem **três** implementações de `useTenantMembers` com shapes diferentes:
- `src/hooks/useTenantMembers.tsx` — retorna `{ id, display_name, full_name, email, avatar_url }`
- `src/hooks/useSquads.tsx` — `MemberProfile` mesmo shape mas re-implementado
- `src/hooks/useWorkload.tsx` — `MemberLite` com `{ user_id, ..., role, capacity_minutes_day }`

Risco baixo (cada um serve um caso diferente), mas confunde manutenção. Severidade baixa.

---

### 2.3 Atribuição de tarefas — **GAP CRÍTICO**

- **UI para atribuir?** **GAP alto**. `TaskDetailSheet.tsx` **não tem campo de assignee**. Procurei `assignee_id.*Select`, `AssigneePicker`, `onAssign` em todo `src/components/tasks/` e `src/components/kanban/` — zero ocorrência. O único `AssigneePicker` está em `SmartListBuilder.tsx` (filtro), não para atribuir tarefa. **Atribuição manual hoje só acontece via Quick Add (`assignee_id: user.id` automático), via `useReassignTask` no heatmap (drag), ou via `tg_auto_assign` em mudança de status.**
- **Validação se user é membro do squad/projeto?** **GAP**. `tasks.assignee_id` referencia `auth.users` direto, não há FK ou trigger validando que o assignee pertence ao tenant. Pode atribuir qualquer UUID válido.
- **`assignment_matrix` é usada onde?** **CHECK parcial**. Trigger `tg_auto_assign` (em `auto_assign_on_status_change`) consulta a matriz **apenas no UPDATE de `status_id`**. Não consulta no INSERT (Quick Add). Página `/app/workload` aba "Matriz" expõe CRUD via `AssignmentMatrixPanel`.
- **Auto-atribuição cross-squad?** Não há proteção; a matriz pode definir um assignee de qualquer squad/tenant — o trigger não valida.

---

### 2.4 Tempo e capacidade — **CRÍTICO: 4 GAPs concentrados**

Esta é a área de maior dívida arquitetural. Detalhe:

#### 2.4.1 `tasks.estimate_minutes` — **GAP**
- **Preenchimento manual?** Sim, via `useQuickAdd` (parser NLP `parseQuickAdd` em `lib/quick-add-parser`) e via TaskAIPanel (IA categoriza). 
- **Herda de `task_types.default_estimate_minutes`?** **NÃO**. Verifiquei `useQuickAdd`, `useCreateSubtask`, `useUpdateTask`, todos os fluxos de criação. **`default_estimate_minutes` está no schema, no tipo TS, exposto pela página `/app/configuracoes/tipos`, mas nenhum lugar consulta esse valor ao criar/atualizar uma tarefa.** O campo é cosmético hoje. Severidade média (não corrompe dados, mas mata feature prometida no PRD).

#### 2.4.2 `tasks.spent_minutes` atualização — **CHECK**
- RPC `stop_timer` (migration `20260430124723`) faz `UPDATE tasks SET spent_minutes = COALESCE(spent_minutes,0) + v_minutes` ao parar o timer. Funciona. Pomodoro segue o mesmo padrão.

#### 2.4.3 `capacity_settings` / `user_capacity` + `time_off` — **CHECK**
- `user_capacity` (hours_per_week, daily_hours, workdays[], notes) — tabela existe e `useCapacityData` lê.
- `time_off` (kind, status pending|approved|rejected|cancelled, start/end dates) — existe e há helper `computeAvailableHours` que desconta dias aprovados.

#### 2.4.4 `mv_workload_by_user` — **GAP de uso**
- **A view existe e tem refresh agendado** (pg_cron 5min, conforme `mem/schema.md`).
- **Quem consulta?** Procurei `mv_workload_by_user` no frontend — única ocorrência é no arquivo gerado `types.ts` (linha 6576). **Nenhum hook lê da view.** O `WorkloadHeatmap` recalcula localmente somando `tasks.estimate_minutes` por `(assignee_id, due_at-day)` em `WorkloadHeatmap.tsx:119-126`. A view materializada está pronta mas **órfã**.

#### 2.4.5 ALERTA AO ATRIBUIR TAREFA SOBRECARREGADA — **GAP CRÍTICO**

> Pergunta original: ao atribuir nova task, sistema avisa se user já está sobrecarregado?

Procurei:
- Hook tipo `useUserWorkload(userId)` que retorne `% carga`. **Não existe.**
- Componente que mostre carga ao escolher assignee no `TaskDetailSheet`. **Não existe** (nem o seletor de assignee existe).
- O heatmap em `/app/workload` mostra cor por carga (`loadColor(load, cap)` em `WorkloadHeatmap.tsx:139`), mas é uma view passiva — não impede nem alerta no momento da atribuição.

**Conclusão:** o produto tem dados (`mv_workload_by_user`, `user_capacity`, `time_off`) e tem uma página que visualiza isso, mas **a decisão de atribuição é cega**. O ciclo "criar tarefa -> atribuir -> avisar overload" está quebrado em todos os pontos onde a atribuição acontece (Kanban, TaskDetailSheet, automações, assignment_matrix).

---

### 2.5 Workload page e Capacity page — **CHECK parcial**

- **Renderiza dados de `mv_workload_by_user`?** **NÃO**. Renderiza tasks brutas de `useWorkloadTasks` (filtro por range + due_at not null + done_at null). A view materializada não é tocada.
- **Drag-drop pra realocar?** **CHECK**. `WorkloadHeatmap.tsx` tem onDragStart/onDrop por célula → `useReassignTask` (`useWorkload.tsx:117-153`) atualiza `assignee_id` + `due_at`. Funciona.
- **CapacityPage**: usa `useCapacityData` (capacity + time-off + members) e `computeAvailableHours`. Sem ligação com tarefas/estimativas. Operacional para registrar capacidade base, sem feedback ao atribuir.

**Inconsistência conceitual:** "capacity" tem **duas fontes**:
- `squad_members.capacity_hours_week` — consultado pelo `useTenantMembers` em `useWorkload.tsx`
- `user_capacity.hours_per_week` — consultado pelo `useCapacityData`

Os dois valores não estão reconciliados. Ao alterar capacidade na página `/app/capacity`, o heatmap **continua usando a soma de squad_members** (não respeita `user_capacity`). GAP de média severidade.

---

### 2.6 Skills — **GAP**

- **`skills` + `user_skills` + endorsements**: existem (`useSkills.tsx:39-119`).
- **Tarefa pode requerer skill?** **NÃO**. Procurei `required_skills`, `skill_id` nas tabelas `tasks`/`task_types`. Sem campo, sem tag, sem JSONB de skills exigidas. Skills é uma matriz isolada.
- **Atribuição leva skill em conta?** **NÃO**. `tg_auto_assign` consulta apenas `(project_id, type_id, status_id) → assignee_id`. Skill nunca entra na decisão.

Severidade média. É feature de Fase 2 entregue no formato "matriz visual" sem ciclo de uso. Sem fix, skills é vitrine.

---

### 2.7 Smart Lists <-> Filtros — **CHECK**

- **`SmartListBuilder` salva filtros AND/OR?** **CHECK**. Lê de `RuleGroup { combinator: "and"|"or", rules: [] }` em `lib/smart-list-query`. Editor recursivo com profundidade.
- **Filtros disponíveis?** **CHECK** — `list (projeto)`, `tag`, `assignee`, `priority`, `status`, `due_at` (before/after/between), `keyword (contains)`, `done`. Cobertura suficiente para produtividade básica.
- **Falta?** Não há filtros por `type_id`, `persona_id`, `audience_id`, `campaign_id`, `progress_pct`, `estimate_minutes`. Para um produto que vende "Eisenhower + Ekyte parity", isso é um teto baixo. Severidade baixa.
- **Saved views aparecem na sidebar?** **CHECK**. `AppSidebar.tsx:196-256` lê `useSavedViews()`, filtra `pinned`, renderiza grupo dedicado.

**Observação histórica:** existem **duas** tabelas — `saved_filters` (v1, criada em `migration 20260429220549`) e `saved_views` (v2). Apenas `saved_views` é usada hoje. `saved_filters` está órfã. Severidade baixa, mas vale dropar ou consolidar.

---

### 2.8 Notificações <-> Eventos — **GAP médio**

- **Tarefa atribuída -> notifica assignee?** **GAP**. O enum `notification_kind` tem o valor `task_assigned`, mas **não há trigger nem RPC que crie a notification**. `scan_notifications` (migration `20260430222034`) cobre apenas `anomaly_critical`, `kr_at_risk`, `deadline_near`. Nenhuma notif de assignment é gerada nem em tempo real nem em scan periódico.
- **Comentário com @user -> notifica?** **CHECK**. `notify_comment_mentions` (migration `20260501003644:110`) lê `comments.mentions UUID[]` e cria notification kind `mention`.
- **SLA pra estourar -> notifica owner?** **CHECK parcial**. `scan_notifications` cobre `deadline_near` (24h antes do due_at) e `sla_breach_soon` está no enum mas sem implementação. SLA badge funciona, alerta sistêmico não.

---

## 3. GAPs encontrados (priorizados)

| # | Nome | Severidade | Impacto | Esforço | Local |
|---|---|---|---|---|---|
| **G1** | **Atribuição cega: sem aviso de sobrecarga** | **Alta** | Gestor atribui task pra quem já está overload — quebra promessa do produto Ekyte-like | M | Frontend (novo `useUserWorkload`) + Backend (consumir `mv_workload_by_user`) |
| **G2** | **`TaskDetailSheet` sem seletor de assignee** | **Alta** | Atribuição manual só via Kanban drag ou matriz; UX trava | S | Frontend (novo `<AssigneePicker>` no Sheet) |
| **G3** | **`mv_workload_by_user` órfã** | Alta | Refresh agendado a cada 5min, custo sem retorno | S | Substituir cálculo local do heatmap pela view + criar hook |
| **G4** | **`task_types.default_estimate_minutes` não aplicado** | Média | Configurar tipo no /app/configuracoes/tipos não tem efeito real | S | Frontend (`useQuickAdd`/`useUpdateTask` ler default ao trocar `type_id`) |
| **G5** | **`task_assigned` enum existe mas trigger ausente** | Média | Assignee descobre tarefa só ao abrir o app | S | Backend `[lovable]` — trigger AFTER UPDATE de `assignee_id` |
| **G6** | **`assignee_id` aceita user fora do tenant** | Média | Vazamento potencial de cross-tenant em UPDATE direto | S | Backend `[lovable]` — CHECK ou RLS policy validando user_tenant_ids() |
| **G7** | **Capacity duplicada (squad_members vs user_capacity)** | Média | Page de capacidade não afeta heatmap; usuário acha bug | M | Decisão arquitetural: tornar `user_capacity` autoritativo, derivar squad_members ou removê-lo do cálculo |
| **G8** | **Skills sem ligação com tasks** | Média | Matriz de skills é só vitrine, não influencia atribuição | M | Schema `[lovable]`: campo `tasks.required_skills uuid[]` ou `task_types.required_skills`; UI exibir match |
| **G9** | **Mudança de projeto via UI ausente** | Média | Task fica presa no projeto onde nasceu | S | Frontend — adicionar `<ProjectPicker>` no Sheet |
| **G10** | **`saved_filters` (v1) órfã** | Baixa | Tabela morta no schema | S | Backend `[lovable]` — drop ou migrar |
| **G11** | **`useTenantMembers` triplicado** | Baixa | Manutenção confusa | S | Frontend — consolidar em um único hook com discriminadas |
| **G12** | **Filtros Smart List sem `type_id`/`persona_id`/`progress`** | Baixa | Teto baixo para power users | S | Frontend — adicionar campos no builder |
| **G13** | **Squad = departamento (sem documentação)** | Baixa | Confusão semântica | S | Doc em `mem/schema.md` |

---

## 4. Recomendações priorizadas

> 5 ações para fechar os gaps maiores. Ordem de impacto/dependência.

### R1 — Fechar o ciclo de atribuição com sinal de carga (resolve G1+G2+G3)
**Frontend + Backend.** 

Criar hook `useUserWorkload(userId, range)` que leia diretamente de `mv_workload_by_user` e devolva `{ totalMinutes, capacityMinutes, ratio, status: ok|warn|over }`. No `TaskDetailSheet`, adicionar `<AssigneePicker>` que renderize cada candidato com badge colorido pelo `ratio` da semana atual. No Kanban, mesma badge ao abrir popover de assignee. **Esforço:** M (uns 2-3 dias). **Pré-requisito:** G3 (consumir a view).

### R2 — Aplicar `default_estimate_minutes` ao escolher type_id (resolve G4)
**Só frontend.** 

No `useQuickAdd`, quando o parser sugerir um `type_id` (ou usuário escolher), preencher `estimate_minutes` com o `default_estimate_minutes` do tipo se o campo estiver vazio. Mesma lógica no `useUpdateTask` quando o usuário muda o `type_id`. **Esforço:** S (meia tarde).

### R3 — Trigger de notificação `task_assigned` (resolve G5)
**Backend `[lovable]`.** 

Criar `notify_assignee_changed` AFTER UPDATE OF `assignee_id` em `tasks` que insira `notifications(kind='task_assigned', user_id=NEW.assignee_id, ...)`. Idempotente (só dispara se `OLD.assignee_id IS DISTINCT FROM NEW.assignee_id`). **Esforço:** S. Vai pra `lovable-patches/`.

### R4 — Validar assignee dentro do tenant (resolve G6)
**Backend `[lovable]`.** 

Adicionar trigger `validate_task_assignee` BEFORE INSERT/UPDATE em `tasks`: se `NEW.assignee_id IS NOT NULL` e o user **não** está em `tenant_members` do `NEW.tenant_id`, raise. **Esforço:** S.

### R5 — Conectar skills à matriz de atribuição (resolve G8 + amplia R1)
**Schema + Frontend.** 

Adicionar `tasks.required_skills uuid[]` (ou em `task_types`). No `<AssigneePicker>` (R1), priorizar candidatos cujos `user_skills` cobrem `required_skills` com nível >= 3, com badge "match: 4/5 skills". **Esforço:** M. Schema vai pra `[lovable]`.

---

## 5. Sumário de coerência

| Área | Status |
|---|---|
| 2.1 Tarefas <-> Projetos | CHECK (com gap de UI para mudar projeto) |
| 2.2 Squads <-> Membros | CHECK (squad = departamento implícito) |
| 2.3 Atribuição de tarefas | GAP crítico |
| 2.4 Tempo e capacidade | GAP crítico |
| 2.5 Workload/Capacity pages | CHECK parcial (mv órfã, capacity duplicado) |
| 2.6 Skills | GAP — vitrine sem uso |
| 2.7 Smart Lists | CHECK |
| 2.8 Notificações | GAP médio (assignment não notifica) |

**Saúde geral:** o produto tem **toda a infraestrutura** (tabelas, views, triggers, hooks individuais) mas **falta conectar** o fluxo `criar/atribuir tarefa -> consultar carga -> avisar -> ajustar`. Esse é o coração da promessa "TickTick + Ekyte" — e hoje ele só funciona em modo passivo (heatmap) sem feedback proativo.

A prioridade de polimento deve atacar **R1 + R2 + R3** primeiro: 2-3 dias de trabalho fecham 5 dos 13 gaps e restauram a coerência do core do produto. R4/R5 são robustez e diferenciação.
