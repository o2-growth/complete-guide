# ClickUp — Catálogo Completo de Features
> Referência competitiva para o projeto Oxy Growth OS
> Data de pesquisa: 2026-05-04

---

## 1. Hierarquia (The ClickUp Hierarchy)

```
Workspace
  └── Space (departamento, área de negócio)
        └── Folder (agrupamento de listas)
              └── List (coleção de tarefas)
                    └── Task
                          └── Subtask (até múltiplos níveis [a confirmar limite])
                                └── Checklist items
```

Cada nível possui:
- Permissões próprias configuráveis por nível.
- Views independentes (cada Space, Folder e List pode ter suas próprias views).
- Automations aplicáveis em qualquer nível da hierarquia.
- Templates de Space, Folder, List e Task.

Fonte: [ClickUp Features](https://clickup.com/features) | [ClickUp Overview 2025](https://www.eesel.ai/blog/clickup-overview)

---

## 2. Multi-Views (16 views confirmadas)

Cada List, Folder ou Space pode ter quantas views forem necessárias do mesmo conjunto de dados.

| View | Tipo | Descrição |
|---|---|---|
| **List** | Task | Listagem clássica com sorting, filtering e grouping |
| **Board** | Task | Kanban: colunas por status, drag-and-drop entre status |
| **Calendar** | Task | Tarefas plotadas por data, visualização mensal/semanal |
| **Gantt** | Task | Timeline com dependências, critical path analysis |
| **Timeline** | Task | Roadmaps lineares com sobreposição de tasks, boa para planejamento |
| **Workload** | Task | Visualização de capacidade e bandwidth por pessoa |
| **Box** | Task | Sprint-based; reorganização por assignee, drag-and-drop para reassign |
| **Activity** | Task | Log de ações: comentários, edições, atualizações |
| **Table** | Task | Planilha com 15+ tipos de Custom Fields por coluna |
| **Mind Map** | Task | Mapa mental hierárquico; conecta tasks a subtasks visualmente |
| **Map** | Task | Tarefas com localização geográfica em mapa interativo |
| **Docs** | Conteúdo | Páginas de documentação hierárquicas dentro do Space |
| **Whiteboard** | Conteúdo | Canvas livre para brainstorming, conecta tasks e docs |
| **Form** | Conteúdo | Formulário público que gera tasks na submissão |
| **Chat** | Comunicação | Canal de mensagens em tempo real atrelado ao Space/List |
| **Embed** | Conteúdo | Iframe de recursos externos (Figma, Google Docs, etc.) |

Fonte: [ClickUp Views](https://clickup.com/features/views) | [Intro to Views Help](https://help.clickup.com/hc/en-us/articles/6329880717719-Intro-to-views)

---

## 3. Custom Fields

ClickUp suporta 15+ tipos de Custom Fields aplicáveis a qualquer nível da hierarquia.

| Tipo | Descrição |
|---|---|
| **Text** | Texto livre |
| **Number** | Numérico com unidades customizáveis |
| **Money / Currency** | Valor monetário com símbolo de moeda |
| **Date** | Data e hora |
| **Checkbox** | Booleano |
| **Dropdown** | Seleção única com opções customizadas |
| **Labels** | Multi-select com tags coloridas |
| **Rating** | Avaliação por estrelas ou emoji |
| **Progress** | Barra de progresso numérica |
| **Email** | Campo de e-mail |
| **Phone** | Campo de telefone |
| **URL** | Link clicável |
| **File / Attachment** | Upload de arquivos |
| **People / Users** | Atribuição a membros |
| **Relationship** | Relação entre tasks de diferentes listas |
| **Rollup** | Agrega dados de tasks relacionadas |
| **Formula** | Cálculos entre campos numéricos e de data |
| **Location** | Coordenadas geográficas |
| **AI Field** | Campo preenchido automaticamente por IA (summarize, translate, create action items, get updates) |

### Private Custom Fields (2025)

- Custom Fields podem ser marcados como privados com controle de permissão por usuário/papel.
- Filtro por múltiplos valores em dropdowns dentro de automações.

Fonte: [Custom Field Types Help](https://help.clickup.com/hc/en-us/articles/6303499162647-Custom-Field-types) | [ClickUp Custom Fields Feature](https://clickup.com/features/custom-fields)

---

## 4. Time Tracking Nativo

- Timer embutido: iniciar/parar cronômetro dentro de qualquer task.
- Entrada manual de horas.
- Marcar horas como **billable** ou non-billable.
- Adicionar notas e tags às entradas de tempo.
- Editar entradas retroativamente.
- **Timesheets**: relatório de horas por pessoa, projeto ou task.
- **Widgets de dashboard**: Time Tracked, Billable vs. Non-Billable, Time Estimated vs. Time Tracked.
- Integração nativa com Google Calendar (criar, atualizar, deletar eventos via automations, 2025).
- **Limitação**: sem invoicing nativo, sem gestão de billing rates, sem relatórios de lucratividade.

Fonte: [ClickUp Time Tracking Feature](https://clickup.com/features/project-time-tracking) | [Everhour — ClickUp Time Tracking Guide](https://everhour.com/blog/clickup-time-tracking-guide/)

---

## 5. Goals e OKRs

```
Goal Folder (agrupa Goals como Sprint Cycles, OKRs, Scorecards)
  └── Goal
        └── Target (Key Result)
```

### Tipos de Target

| Tipo | Descrição |
|---|---|
| **Number** | Range numérico com acompanhamento de incremento ou decremento |
| **Monetary** | Valor financeiro com meta e acompanhamento |
| **True/False** | Meta binária (concluído ou não) |
| **Task** | Progresso baseado em conclusão de tasks vinculadas |

- Progresso da Goal atualiza automaticamente conforme Targets são atualizados.
- Targets podem ser vinculados a lists inteiras ou tasks individuais (Task Target).
- **Dashboards** de Goals: visualização de alto nível com cards KPI.
- Goals organizáveis em Folders para agrupar por OKR cycle, sprint, departamento.
- Integração com Dashboards para reporting visual.

Fonte: [ClickUp Goals Feature](https://clickup.com/features/goals) | [Use ClickUp to track goals and OKRs](https://help.clickup.com/hc/en-us/articles/6327987972119-Use-ClickUp-to-track-goals-and-OKRs)

---

## 6. Docs

- Páginas hierárquicas de documentação criáveis dentro de qualquer Space.
- Suporte a slash commands ricos: headings, bullets, toggles, callouts, tabelas, code blocks, media.
- Edição colaborativa em tempo real.
- Vinculação bidirecional com tasks: mencionar tasks em docs, mencionar docs em tasks.
- Publicação pública como knowledge base ou blog.
- AI-powered Wikis: Notion Brain pode gerar e manter wikis automaticamente.
- Templates de Doc.
- Permissões granulares por Doc.
- Busca dentro de Docs via Connected Search.

Fonte: [Create a Doc Help](https://help.clickup.com/hc/en-us/articles/14237365820695-Create-a-Doc) | [ClickUp Overview](https://www.eesel.ai/blog/clickup-overview)

---

## 7. Whiteboards

- Canvas livre e infinito para brainstorming e mapeamento de processos.
- Objetos: formas, texto, setas, sticky notes, imagens.
- Conectar tasks diretamente no canvas (tasks como cards no whiteboard).
- Conectar Docs ao whiteboard.
- Templates de whiteboard (ex.: roadmap, brainstorming, flowchart).
- Totalmente integrado ao workspace: criar tasks diretamente do canvas.
- Redesenhado em 2025 com capacidades aprimoradas.

Fonte: [ClickUp Walkthrough 2025](https://stackset.com/blog/clickup-walkthrough-2025-new-features-pro-tips-to-boost-efficiency)

---

## 8. Dashboards

- Dashboard = canvas customizável com widgets (cards) de dados do workspace.
- 50+ tipos de widgets disponíveis.

### Tipos de cards/widgets

| Categoria | Widgets |
|---|---|
| **Charts** | Bar chart, Pie/Donut chart, Line chart |
| **KPI / Calculation** | Número calculado (sum, count, avg, median, min, max, range) de tasks, sprint points, horas, custom fields |
| **Tables** | Tabela de dados de tasks ou custom fields |
| **Time Tracking** | Time Tracked total, Billable vs. Non-billable, Estimated vs. Tracked |
| **Sprint** | Sprint velocity, burndown, overview |
| **Workload** | Capacidade por pessoa |
| **Status** | Distribuição de status |
| **Assignees** | Distribuição por responsável |
| **Tags** | Distribuição por tag |
| **Priority** | Distribuição por prioridade |
| **Embed** | HTML embed de qualquer serviço externo |
| **Text block** | Bloco de rich text para contexto |
| **Chat / conversas** | Feed de comentários |

- Arrastar, redimensionar e reorganizar cards livremente.
- Dashboards compartilháveis com permissões configuráveis.
- Uso de Formula Custom Fields em cálculos de dashboard.

Fonte: [ClickUp Dashboards Feature](https://clickup.com/features/dashboards) | [Dashboards Overview Help](https://help.clickup.com/hc/en-us/articles/6312197753239-Dashboards-overview)

---

## 9. Automations

- Engine no-code de automações "if-this-then-that".
- 100+ templates pré-construídos na biblioteca.
- Aplicável em qualquer nível: Space, Folder, List.
- Planos Free: 100 automations/mês. Business: 10.000/mês. Enterprise: 250.000/mês.

### Triggers disponíveis (exemplos)

- Task criada, atualizada, completada, deletada
- Status alterado
- Assignee adicionado/removido
- Custom Field alterado (checkbox marcado, dropdown selecionado)
- Due date aproximando / passando
- Subtask completada / checklist resolvida
- Task vinculada
- Antes/depois de uma data (2025)
- Schedule (daily, weekly, monthly)
- Formulário submetido

### Actions disponíveis (exemplos)

- Alterar status, assignee, priority, due date, start date
- Mover task para outra list
- Criar subtask ou checklist
- Definir / limpar Custom Field
- Rastrear tempo na task
- Enviar notificação ou comentário
- Criar webhook call
- Criar evento no Google Calendar (2025)
- Deletar / arquivar task

### AI Fields em Automations (2025)

- Custom Fields de IA atualizam dinamicamente com base em triggers específicos.

Fonte: [Intro to Automations Help](https://help.clickup.com/hc/en-us/articles/6312102752791-Intro-to-Automations) | [ClickUp Automations Feature](https://clickup.com/features/automations)

---

## 10. Forms

- Formulários públicos criáveis como view de qualquer List.
- Campos mapeados para Custom Fields e propriedades da task.
- URL compartilhável externamente.
- Submissões viram tasks automaticamente na List vinculada.
- Condicional logic [a confirmar disponibilidade].
- Redesenhado em 2025 com interface aprimorada.
- Útil para: bug reports, intakes de projeto, pesquisas de clientes, onboarding.

Fonte: [ClickUp Features](https://clickup.com/features)

---

## 11. ClickUp Brain (AI)

### Features core

| Feature | Descrição |
|---|---|
| **Summarize** | Resumo de tasks, threads de comentários, inbox, docs |
| **Generate content** | Draftar/editar texto dentro de Docs com contexto do workspace |
| **Ask questions** | Q&A sobre workspace: tarefas, status, bloqueios, prioridades |
| **AI Custom Fields** | Campos que atualizam automaticamente: summarize task, get updates, translate, create action items |
| **Action items** | Extração automática de itens acionáveis de comentários e docs |
| **Image generation** | Geração de imagens com IA |
| **AI Notetaker** | Transcrição automática de reuniões em SyncUps e plataformas externas (Zoom, Teams) |
| **SyncUps** | Videochamadas nativas com transcrição e summaries automáticos |
| **Autopilot Agents** | Agentes autônomos para automação de tarefas (2025) |
| **Multi-model** | Seleção de modelo: GPT-5, Claude Opus 4.1, o3, o1-mini (2025) |

Acesso via `Cmd+K` > "Ask ClickUp Brain" ou através de qualquer task, doc ou dashboard.

Fonte: [ClickUp Brain](https://clickup.com/brain) | [ClickUp AI Features Roundup 2025](https://tuckconsultinggroup.com/articles/clickup-ai-features-roundup-whats-new-in-2025/)

---

## 12. Permissões Granulares

### Níveis de permissão

| Nível | Granularidade |
|---|---|
| Workspace | Owner, Admin, Member, Guest |
| Space | Full, Edit, Comment, View, No Access |
| Folder/List | Herda do Space ou sobrescreve |
| Task | Pode ser compartilhada individualmente |
| Custom Field | Private fields com restrição por papel (2025) |
| Doc | Permissão própria por documento |
| Dashboard | Compartilhável com permissões configuráveis |

- **Limited member roles** (2025): membros com acesso apenas a Spaces específicos sem ver o workspace completo.

Fonte: [ClickUp Walkthrough 2025](https://stackset.com/blog/clickup-walkthrough-2025-new-features-pro-tips-to-boost-efficiency)

---

## 13. Templates

- Templates para Space, Folder, List e Task.
- Templates de Doc, Whiteboard e Dashboard.
- Milhares de templates da comunidade + templates oficiais ClickUp.
- Template picker via `/` (slash command) em qualquer lugar com texto.
- Template aplicável ao criar task em: List, Board, Calendar, Timeline, Team, Whiteboard, Workload views.

Fonte: [Use task templates Help](https://help.clickup.com/hc/en-us/articles/6309918176535-Use-task-templates)

---

## 14. Atalhos de Teclado

| Atalho | Ação |
|---|---|
| `Cmd+K` | Busca universal / ClickUp Brain |
| `Cmd+/` | Abrir Command Center |
| `Space` | Abrir task em quick view |
| `Enter` | Criar nova task |
| `Cmd+Enter` | Salvar e fechar task |
| `Cmd+Z` | Undo |
| `Cmd+Shift+Z` | Redo |
| `/` | Slash command em Docs e Whiteboards |
| `@` | Mencionar pessoa, task ou doc |
| `#` | Referenciar task por ID |

Fonte: [ClickUp Walkthrough 2025](https://stackset.com/blog/clickup-walkthrough-2025-new-features-pro-tips-to-boost-efficiency)

---

## 15. Integrações e API

- 1000+ integrações nativas via Zapier/Make/n8n.
- Integrações nativas: Slack, GitHub, GitLab, Google Drive, Figma, Loom, Zoom, HubSpot, Salesforce, etc.
- API REST completa com webhooks.
- Importação de: Jira, Asana, Trello, Monday, Todoist, CSV.
- Google Calendar: automations para criar/atualizar/deletar eventos (2025).

---

## Fontes Primárias

- [ClickUp Features](https://clickup.com/features)
- [ClickUp Views Feature](https://clickup.com/features/views)
- [ClickUp Custom Fields Feature](https://clickup.com/features/custom-fields)
- [ClickUp Automations Feature](https://clickup.com/features/automations)
- [ClickUp Goals Feature](https://clickup.com/features/goals)
- [ClickUp Brain](https://clickup.com/brain)
- [ClickUp Dashboards Feature](https://clickup.com/features/dashboards)
- [ClickUp Time Tracking Feature](https://clickup.com/features/project-time-tracking)
- [ClickUp Overview 2025 — eesel.ai](https://www.eesel.ai/blog/clickup-overview)
- [ClickUp Walkthrough 2025](https://stackset.com/blog/clickup-walkthrough-2025-new-features-pro-tips-to-boost-efficiency)
- [ClickUp AI Features Roundup 2025](https://tuckconsultinggroup.com/articles/clickup-ai-features-roundup-whats-new-in-2025/)
