# Oxy Growth OS — Gap Analysis vs. Notion e ClickUp
> Data: 2026-05-04
> Baseline Oxy: paridade TickTick + Ekyte confirmada; Sprint 4 em QA (2026-04-21)

---

## Premissas sobre o estado atual do Oxy

Com base nos dados disponíveis, o Oxy Growth OS já possui:

**Estrutura / Hierarquia**
- Folder hierarchy 3 níveis (Squad > Projeto > Lista ou equivalente)
- Smart Lists (listas dinâmicas com filtros)
- Multi-tenant isolamento por workspace

**Views existentes**
- List view
- Kanban (Board)
- Calendar
- Timeline / Gantt
- Eisenhower Matrix (2x2 urgente/importante)
- Plan Your Day (view de planejamento diário)

**Tarefas**
- Task types básico (`task_types`)
- Subtarefas
- Atribuição, datas, status

**Conteúdo**
- Wiki (módulo de documentação)
- Personas
- Templates Unified
- Atendimento (módulo CRM/suporte)

**Planejamento**
- Habits tracker
- OKRs (módulo existente)
- demand_forms (formulários básicos)

---

## PARTE 1 — O que o Notion tem que o Oxy NÃO tem

### Prioridade ALTA

| # | Feature | Impacto | Complexidade | Observação |
|---|---|---|---|---|
| 1 | **Custom database properties** (17 tipos: texto, número, select, multi-select, status, date, checkbox, URL, email, phone, files, people, relation, rollup, formula, timestamps) | Alto — transforma tasks de cards simples em registros ricos | Alta | Oxy usa só `task_types` sem campos customizáveis pelo usuário |
| 2 | **Gallery view** | Médio — essencial para mood boards, design systems, diretório de pessoas | Baixa | Oxy tem 5 views; falta Gallery |
| 3 | **Chart view** (bar, line, donut) | Alto — reporting visual direto na lista sem sair do contexto | Média | Nenhuma view de chart nativa em Oxy |
| 4 | **Relations entre databases** | Alto — conectar tasks de projetos diferentes, CRM-tasks, etc. | Alta | Oxy não tem relações entre coleções |
| 5 | **Rollup properties** | Alto — agrega dados de relacionamentos automaticamente | Alta | Dependente de Relations |
| 6 | **Formula properties** | Médio-Alto — calcular campos automaticamente (ex.: SLA, score, delta) | Alta | Nenhuma fórmula de propriedade em Oxy |
| 7 | **Synced blocks** | Médio — reutilizar conteúdo em múltiplas páginas Wiki/docs | Média | Oxy tem Wiki mas sem sync de conteúdo |
| 8 | **Page-level permissions** em Wiki/docs | Alto — controlar acesso granular por página, não só por módulo | Média | Oxy provavelmente tem permissão por módulo, não por página individual |
| 9 | **Teamspaces** (nível acima de squad) | Médio — organizar múltiplos squads/departamentos com isolamento | Média | Oxy tem hierarquia mas sem camada "Teamspace" explícita com acesso Open/Closed/Private |
| 10 | **Inline databases dentro de páginas** | Alto — docs que contêm uma tabela de dados ao invés de só texto | Alta | Wiki Oxy provavelmente são só texto/blocos sem databases embutidos |

### Prioridade MÉDIA

| # | Feature | Impacto | Complexidade |
|---|---|---|---|
| 11 | **Comments em propriedades** (property-level comments) | Médio | Baixa |
| 12 | **Suggested Edits** (modo sugestão em docs) | Médio — útil para revisão colaborativa de Wiki | Média |
| 13 | **Notion-style button blocks** (executar automação com clique) | Médio | Média |
| 14 | **Custom URL slugs** para páginas Wiki publicadas | Baixo-médio | Baixa |
| 15 | **AI database autofill** (AI Summary, AI Keywords, AI Translation em propriedades) | Alto futuro | Alta (requer AI infra) |
| 16 | **Feed view** (cronológico tipo activity stream) | Baixo | Baixa |
| 17 | **Map view** (geográfico) | Baixo para B2B SaaS genérico | Alta |

---

## PARTE 2 — O que o ClickUp tem que o Oxy NÃO tem

### Prioridade ALTA

| # | Feature | Impacto | Complexidade | Observação |
|---|---|---|---|---|
| 1 | **Custom Fields em tasks** (15+ tipos) | Alto — sem campos customizáveis, Oxy perde para qualquer tool de gestão de projetos mais vertical | Alta | Mesma lacuna apontada no Notion; CRÍTICO para competir |
| 2 | **Whiteboard / canvas livre** | Alto — brainstorming, mapeamento de processos, retros | Alta | Oxy não tem canvas; diferencial visual forte |
| 3 | **Goals com Targets tipados** (numeric, monetary, true/false, task-based) | Alto — OKRs Oxy existem mas Goals ClickUp são mais ricas com tracking automático por Target type | Média | OKR Oxy provavelmente é texto/checklist; ClickUp Goals atualizam automaticamente |
| 4 | **Time Tracking nativo** (timer embutido, billable/non-billable, timesheets) | Alto para equipes de serviço, agências, consultoria | Média | Oxy sem tracking de horas nativo |
| 5 | **Dashboards customizáveis** (50+ widgets, charts, KPIs, embeds) | Alto — visibilidade executiva, relatórios por projeto/pessoa | Alta | Diferencial claro para gestores; Oxy provavelmente tem dashboards básicos mas não customizáveis por usuário |
| 6 | **Automations engine** (100+ triggers/actions, schedule-based, webhook) | Alto — reduz trabalho manual, automatiza fluxos | Alta | Oxy provavelmente tem automações básicas (demand_forms) mas sem engine completo |
| 7 | **Forms públicos avançados** (submissão externa gera task, Custom Fields como campos) | Médio-Alto — onboarding, bug report, intake de cliente | Média | Oxy tem `demand_forms` mas com capacidades desconhecidas; Forms ClickUp são mais maduros |
| 8 | **Box view** (sprint-based, capacidade por pessoa com drag-and-drop) | Médio — equipes ágeis, sprint planning | Média | Oxy não tem view de capacidade por sprint |
| 9 | **Workload view** (capacidade por pessoa em tempo real) | Alto — gestão de recursos, evitar overload | Média | Ausente no Oxy |
| 10 | **Goals Folders** (agrupar OKRs por ciclo/sprint/departamento) | Médio | Baixa | Melhoria incremental sobre OKR Oxy |

### Prioridade MÉDIA

| # | Feature | Impacto | Complexidade |
|---|---|---|---|
| 11 | **Activity view** (log de ações por espaço/lista) | Médio — auditoria, transparência | Baixa |
| 12 | **Limited member roles** (acesso apenas a Spaces específicos) | Médio — multi-cliente, freelancers externos | Baixa |
| 13 | **Mind Map view** | Baixo-médio — planejamento visual hierárquico | Média |
| 14 | **AI Notetaker** (transcrição de reunião automática) | Alto futuro | Alta (requer AI infra) |
| 15 | **Private Custom Fields** (campo visível apenas a certos papéis) | Médio — dados sensíveis em tasks | Baixa (se Custom Fields já existirem) |

---

## PARTE 3 — O que o Oxy já cobre (não duplicar)

| Categoria | Feature Oxy | Equivalente Notion/ClickUp |
|---|---|---|
| Views de task | List, Kanban, Calendar, Timeline/Gantt, Eisenhower | List, Board, Calendar, Timeline/Gantt (ClickUp) |
| Planejamento diário | Plan Your Day | Sem equivalente direto em Notion/ClickUp — **diferencial Oxy** |
| Hábitos | Habits tracker | Sem equivalente nativo em ambos — **diferencial Oxy** |
| Planejamento estratégico | OKRs module | Goals (ClickUp), Databases com rollup (Notion) — Oxy tem base, precisa enriquecer |
| Documentação | Wiki | Docs (ClickUp), Pages (Notion) — Oxy tem base, precisa de inline DBs e page permissions |
| Templates | Templates Unified | Templates (ambos) — Oxy parece ter, checar se cobre database templates |
| CRM/suporte | Atendimento | Bases de dados + views (ambos) |
| Formulários | demand_forms | Forms (ClickUp), Forms view (Notion) — avaliar maturidade |
| Hierarquia | Folder hierarchy 3 níveis | Workspace > Space > Folder > List (ClickUp); Workspace > Teamspace > Page (Notion) |
| Multi-tenant | Isolamento por workspace | Workspaces isolados (ambos) |

---

## PARTE 4 — Análise de Decisão: Gaps Prioritários para Fase 7+

### TOP GAPS por ROI estimado

**Nível 1 — Crítico (implementar Fase 7)**

1. **Custom Fields em tasks** — sem isso, Oxy não compete com ClickUp para gestão de projetos verticais. Arquitetura: schema dinâmico por tipo de task ou campo metadata JSON em tasks. Usar react-jsonschema-form ou formily para o builder.

2. **Whiteboard / Canvas livre** — diferencial visual alto, nenhuma tool no stack Oxy hoje. Usar tldraw (MIT, SDK React, sync engine incluso, enterprise-grade).

3. **Workload view** — visibilidade de capacidade da equipe; alta demanda entre gestores de projetos. Implementável sobre tasks já existentes.

4. **Goals com Targets tipados** — upgrade do módulo OKR existente para suportar numeric/monetary/task targets com auto-update de progresso.

5. **Time Tracking nativo** — timer embutido em tasks + billable flag + timesheets view. Diferencial para agências e consultorias usando Oxy.

**Nível 2 — Alto valor (Fase 8)**

6. **Gallery view** — reutiliza infraestrutura de views existente; adiciona visualização de cards com imagem.

7. **Chart view** — bar/line/donut sobre Custom Fields numéricos; dependente de Custom Fields.

8. **Inline database em Wiki/Docs** — maior diferencial do Notion; uma página Wiki pode conter uma tabela de dados com suas próprias views.

9. **Dashboards customizáveis** — canvas de widgets por workspace; alta demanda de gestores e C-level.

10. **Automations engine** — trigger/action configurável; reduz trabalho manual; diferencial de retenção.

**Nível 3 — Médio valor (Fase 9+)**

- Synced blocks
- Page-level permissions granulares em Wiki
- Forms avançados com lógica condicional
- Relations entre coleções (pré-requisito para Rollup e Formula)
- Activity view / audit log

---

## PARTE 5 — Spaces: vale adicionar ao Oxy?

**Análise:**

- Notion tem **Teamspaces** (acima de páginas), ClickUp tem **Spaces** (acima de Folders).
- Oxy já tem hierarquia de 3 níveis. A questão é: vale um quarto nível "Space/Departamento"?

**Recomendação: SIM, como "Space" de departamento acima de Folder**

Motivo:
- Multi-tenant Oxy serve organizações com múltiplos departamentos (Marketing, Engineering, Sales, etc.).
- Cada departamento pode ter views, permissões e templates próprios.
- Sem isso, todos os Folders ficam no mesmo nível, criando ruído visual para empresas maiores.
- Implementação: adicionar tabela `spaces` na hierarquia, com permissões Open/Closed/Private (modelo Notion Teamspaces) e icon/color customizáveis.

---

## Fontes

- [Notion Features Reference](./notion-features.md)
- [ClickUp Features Reference](./clickup-features.md)
- [Notion Database Views Help](https://www.notion.com/help/guides/when-to-use-each-type-of-database-view)
- [ClickUp Goals Help](https://help.clickup.com/hc/en-us/articles/6327987972119-Use-ClickUp-to-track-goals-and-OKRs)
- [ClickUp Views](https://clickup.com/features/views)
- [ClickUp Custom Fields](https://clickup.com/features/custom-fields)
- [ClickUp Dashboards](https://clickup.com/features/dashboards)
