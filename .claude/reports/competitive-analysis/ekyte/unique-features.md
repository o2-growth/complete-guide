# Ekyte vs Oxy Growth OS — Análise Competitiva

> Gerado em 2026-05-04 pelo tour autenticado em `e2e/ekyte-tour.spec.ts`.
> Evidência principal: 23 screenshots em `screens/` (auth + dashboard + configurações + sidebar lateral + permissões + mobile).
> Limites: o disparo de modal de criação de tarefa, kanban, calendário, gantt, social, relatórios, integrações e SLA não foi acionado pelos seletores genéricos — top-nav do Ekyte usa `<span>` em vez de `<a>`/`<button>` com texto, então a heurística textual não fechou o clique. Os screenshots **não** vazios foram suficientes para mapear o esqueleto e reconhecer entidades por outras vias (rota `#/admin/team-members`, página de configurações completa, top-nav visível em todos os estados).

---

## 1. Estrutura de navegação descoberta

### Top-nav (sempre visível, fundo azul Ekyte)

`Conhecimento` · `Atendimento` · `Campanha` · `Projetos` · `Tarefas` · `Publicações` · `Biblioteca` · `Data-Driven` · botão `+` (criação rápida) · botão laranja (provável timer/atalho) · sino · busca · target (OKR?) · suporte · perfil · `Ajuda`

### Sidebar global (engrenagem)

Configurações agrupadas em 4 seções:

- **Acesso** — Meu Perfil, Minha Empresa, Usuários
- **Produtividade e Colaboração** — Workspaces, **Fluxo de Trabalho**, **Tipos de Tarefa**, **Equipes e Profissionais**, **Modelos de Checklist**, **Modelos de Formulário**, **Modelos de Mensagem**, Squads, Tags
- **Marketing** — Canais e Integração, **Personas**, **Públicos**
- **Marketing — Pedido de Inserção** — Pessoas, Informações de PI, Praças, **Pedidos de Inserção**

### Filtros globais (dentro de Equipes/Fluxos)

`Workspace` · `Squad` · `Tags da workspace` · checkbox "Exibir etapas inativas" · busca textual · tabs **FLUXOS DE TRABALHO / TIPOS DE TAREFA / EQUIPES E PROFISSIONAIS** com mesma página compartilhando filtros.

### Widgets do dashboard pós-login

`Meu painel (Executor)`, `Produtividade (Equipe)`, `Tickets comigo` (cards quantitativos com "Em atendimento"), `Tarefas comigo (Até hoje)`, `Meus apontamentos (Ontem/Hoje, escala 0-8h com %)`, `Notificações (lista)`.

---

## 2. Top 8 features Ekyte que faltam no Oxy (ordem de impacto)

| # | Feature Ekyte | Por que importa | Onde encaixa no Oxy |
|---|---------------|-----------------|---------------------|
| 1 | **Pedido de Inserção (PI) + Praças** | Módulo nativo de mídia paga: PI = ordem de compra de mídia, Praças = inventário (canais/veículos). Ekyte trata mídia paga como entidade-primeira; Oxy só tem post orgânico. | Novo bloco `social/pi/*` + tabelas `media_orders`, `media_outlets`. |
| 2 | **Atendimento (ticketing) integrado** | Top-nav dedicado a tickets — chamados de cliente convivem com tarefas internas no mesmo workspace, com SLAs próprios. Oxy hoje só tem "demandas" (formulário público), não tem inbox de tickets longo-prazo. | Estender `demand_submissions` para um modelo de ticket completo (status, atribuído, SLA, histórico). |
| 3 | **Modelos de Mensagem reutilizáveis** | Biblioteca de templates de copy/mensagens vinculáveis a tarefas, automações e atendimento. Reduz retrabalho em respostas-padrão e briefing. Oxy tem `snippets` (mídia social) mas nada cross-módulo. | Generalizar `snippets` em `message_templates` com escopo (atendimento/social/projeto). |
| 4 | **Modelos de Checklist + Modelos de Formulário** geridos como entidades de primeira classe | Biblioteca central (não só inline na tarefa) — checklists viram playbook reutilizável, formulários idem. Oxy tem checklist por tarefa (em `tiptap`), mas não há catálogo. | Tabela `checklist_templates` + `form_templates` com versionamento. |
| 5 | **Personas + Públicos** | Entidades de marketing: Persona = perfil-alvo qualitativo, Público = recorte quantitativo (segmento). Permite vincular tarefa/post/PI a um público. Oxy não tem essa camada estratégica. | Tabelas `personas`, `audiences` com relação N-N a `tasks` e `task_assets`. |
| 6 | **Conhecimento (wiki/docs)** como pilar de top-nav | Base de conhecimento integrada (procedimentos, briefings, decisões). Oxy não tem wiki — depende de docs externos. Perde contexto histórico no produto. | Novo módulo `/app/conhecimento` com TipTap + busca semântica via `task_embeddings` reaproveitada. |
| 7 | **Equipes e Profissionais por workspace** com matriz de skill+squad | Permite filtrar profissionais por workspace, squad, tag. Allocação consciente. Oxy tem matriz de skills mas a UX não cruza com workload. | Reforçar `mv_workload_by_user` cruzando `squad_members.role_in_squad` + `skills`. |
| 8 | **Painel "Meus apontamentos" com barra ontem/hoje vs meta diária (8h)** | Widget de produtividade pessoal com referência de jornada — empático, não punitivo. Oxy mostra "tempo total" mas não confronta com meta. | Adicionar widget no `AppHome.tsx` puxando `time_entries` agregados + meta `profiles.daily_target_hours`. |

---

## 3. Onde a UX do Ekyte é claramente superior

- **Top-nav horizontal por domínio** (Atendimento, Campanha, Projetos, Tarefas, Publicações, Biblioteca, Data-Driven) é mais eficiente que sidebar densa do Oxy. O usuário troca de "modo mental" por aba, não scrolla 30 itens. **Recomendação:** considerar top-nav agrupada para Oxy com 6-8 hubs (Hoje, Trabalho, Social, Insights, IA, Workspace).
- **Filtros globais persistentes (Workspace + Squad + Tags) no topo das telas de lista** — uma única barra que vale para todas as visualizações. Oxy hoje tem filtros por página, com inconsistência entre Kanban e Lista.
- **Configurações como hub visual de cards icônicos** (não menu vertical) — escaneabilidade muito maior. Oxy tem `/app/configuracoes/*` em sidebar — pesado.
- **"Atualizado há pouco" no header da página** com botão de refresh — feedback de freshness explícito. Oxy depende do React Query revalidar silenciosamente, sem dica visual.
- **Header preto fino com breadcrumb único** (`Início`, `Configurações`, `Equipes e Profissionais`) separado do top-nav azul — zero ambiguidade sobre onde você está.
- **FAB de criação `+` no topo central da nav** (não no canto inferior direito) — mais alcançável em desktop.

---

## 4. Stack/bibliotecas detectadas

```json
{
  "tailwind": false,
  "muiClass": false,
  "antd": false,
  "chakra": false,
  "shadcnRadix": false,
  "tiptap": false,
  "framework": "spa-react-likely",
  "title": "eKyte - Software de Gestão de Trabalho em Equipe"
}
```

Sinais visuais e estruturais:

- **Hash routing (`#/login`, `#/home`, `#/admin/team-members`)** — provavelmente `react-router` em modo `HashRouter` ou Vue Router em modo hash. Sugere SPA antiga ou intencionalmente compatível com hospedagem estática.
- **Sem classes do Tailwind, MUI, Antd, Chakra, Radix nem Tiptap detectadas** — CSS proprietário, possivelmente Sass + BEM ou utility-first interno. Ícones são SVGs inline coloridos por seção (azul/roxo/verde para Acesso/Produtividade/Marketing).
- **Tipografia sans-serif arredondada** (parecida com Manrope ou Quicksand). Botões com cantos arredondados grandes (8-12px), shadows sutis.
- **Loader com logo animado central + texto "Carregando..."** durante hidratação SPA — UX simples mas atrasa Time-to-Interactive aparente.
- **Widget Intercom no canto inferior direito** (chat-bubble azul) — estão usando Intercom para suporte, não algo proprietário.
- **Botão laranja com ícone de relógio** ao lado do `+` na top-nav é provavelmente um **timer global persistente** semelhante ao do Oxy (`timerStore.ts`).

---

## 5. Itens com captura parcial — precisam de segunda passada manual

- Modal de criação de tarefa (gatilho `+` exige clique direto, não casa por texto)
- Kanban / Lista / Calendário / Gantt / Timeline (provavelmente dentro de `Tarefas` ou `Projetos`)
- Detalhe de tarefa (sheet/modal)
- Templates de projeto (vimos Modelos de Checklist/Formulário/Mensagem nas configurações; falta a lista por projeto)
- Aprovações multi-etapa (não localizado pelo nome — pode estar em "Atendimento" ou "Publicações")
- Mídia social — calendário editorial (provavelmente em `Publicações`)
- Relatórios / Analytics (provavelmente em `Data-Driven`)
- Integrações (Configurações → Canais e Integração)
- Workload / capacity heatmap
- SLAs (provavelmente em `Atendimento` ou Fluxo de Trabalho)
- Modal de atalhos (`?` não abriu — pode ser outro gatilho ou não existir)

Para a próxima sessão: usar `page.locator('span:text-is("Tarefas")').click()` direto no top-nav azul, e clicar no `+` central por coordenada (`page.mouse.click(800, 24)`).

---

## 6. Gaps já confirmados no Oxy (cross-referência com `CLAUDE.md` + `mem/roadmap.md`)

| Feature Ekyte | Existe no Oxy? | Onde se aplicaria |
|---|---|---|
| Pedido de Inserção (PI) | **NÃO** | Novo módulo, prioridade Fase 6.1 |
| Praças/Veículos de mídia | **NÃO** | Junto com PI |
| Atendimento (tickets longo-prazo) | Parcial (`demand_submissions`) | Estender |
| Modelos de Mensagem cross-módulo | Parcial (só `snippets` social) | Generalizar |
| Modelos de Checklist como entidade | **NÃO** (checklist é inline) | Tabela nova |
| Modelos de Formulário | **NÃO** (formulário fica em `demand_forms`, não reutilizável como template puro) | Refatorar `demand_forms` |
| Personas | **NÃO** | Tabela nova |
| Públicos/Audiências | **NÃO** | Tabela nova |
| Conhecimento (wiki) | **NÃO** | Módulo novo |
| Top-nav horizontal por domínio | **NÃO** (sidebar) | Refactor de `AppLayout` |
| Filtros globais persistentes (Workspace+Squad+Tags) | Parcial | Padronizar |
| Página de configurações em cards | **NÃO** (lista vertical) | Re-skin de `/app/configuracoes` |
| "Atualizado há pouco" + botão refresh | **NÃO** | Componente reutilizável |
| Botão "+" central no header | **NÃO** (FAB inferior) | Mover/duplicar Quick Add |
| Painel "Meus apontamentos" com meta 8h | **NÃO** | Widget novo no `AppHome` |
