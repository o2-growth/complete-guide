# Notion — Catálogo Completo de Features
> Referência competitiva para o projeto Oxy Growth OS
> Data de pesquisa: 2026-05-04

---

## 1. Hierarquia

### Estrutura de níveis

```
Workspace
  └── Teamspace (Open / Closed / Private)
        └── Page
              ├── Sub-page (aninhamento ilimitado [a confirmar limite oficial])
              │     └── Sub-sub-page ...
              └── Database (inline ou full-page)
                    └── Database Item (cada item é uma Page completa)
                          └── Sub-page dentro do item
```

- **Workspace**: instância raiz da organização. Contém todos os teamspaces, páginas e configurações de membros.
- **Teamspace**: camada de organização por equipe/departamento. Aparece na barra lateral esquerda. Três tipos de acesso:
  - *Open* — qualquer membro do workspace pode entrar e ver o conteúdo.
  - *Closed* — todos veem que existe, mas só podem entrar por convite.
  - *Private* (Business/Enterprise) — invisível para não-membros; acesso apenas por convite de owners.
- **Page**: unidade fundamental. Toda página pode conter qualquer bloco e pode hospedar sub-pages aninhadas.
- **Sub-page**: página dentro de outra página. Sem limite oficial documentado de profundidade [a confirmar via teste].
- **Database item como página**: cada linha de qualquer database é, por definição, uma página Notion completa, com seu próprio conteúdo de blocos, comentários, histórico e permissões individuais.

### Roles e permissões por nível

| Nível | Permissões disponíveis |
|---|---|
| Workspace | Owner, Admin, Member, Guest |
| Teamspace | Teamspace Owner, Teamspace Member |
| Page | Full access, Can edit, Can edit content, Can comment, Can view |
| Database row (page) | Permissão individual por linha via Share menu |

Fonte: [Notion Sharing & Permissions](https://www.notion.com/help/sharing-and-permissions) | [Intro to teamspaces](https://www.notion.com/help/intro-to-teamspaces)

---

## 2. Databases

### 2.1 Tipos de view (10 confirmados em 2025)

| View | Descrição | Uso principal |
|---|---|---|
| **Table** | Grade rows/columns estilo spreadsheet. Cada linha é uma page. | Visão geral de grandes datasets |
| **Board** | Kanban com colunas baseadas em Select, Multi-select ou Person. Drag-and-drop entre colunas. | Gestão de status/fluxo de trabalho |
| **Timeline** | Barras horizontais por período (start + end date). Zoom de horas a trimestres. Arrastar para ajustar. | Projetos com datas, roadmaps, Gantt simplificado |
| **Calendar** | Itens plotados por data. Arrastar de um dia para outro altera a data. Vista mensal ou semanal. | Planejamento de alto nível, agendamento |
| **List** | Layout minimalista, sem colunas. Exibe propriedades configuráveis ao lado do título. | Documentação, meeting notes |
| **Gallery** | Mosaico visual com cards. Exibe cover image ou propriedade de imagem. | Mood boards, design systems, diretório de pessoas |
| **Chart** | Visualizações bar, line e donut sobre propriedades numéricas. | Análise de dados, reporting |
| **Form** | Formulário público/compartilhável que cria database items na submissão. | Coleta de dados, pesquisas, onboarding |
| **Feed** | [a confirmar] Layout cronológico tipo feed de atualizações. | Acompanhamento de atividades recentes |
| **Map** | [a confirmar] Visualização geográfica de itens com propriedade de localização. | Dados com coordenadas geográficas |

Cada database pode ter múltiplas views ao mesmo tempo. Uma view é salva para toda a equipe ou como "personal view" (visível só ao usuário).

Fonte: [Notion Help — When to use each view](https://www.notion.com/help/guides/when-to-use-each-type-of-database-view) | [Views, filters, sorts & groups](https://www.notion.com/help/views-filters-and-sorts)

### 2.2 Database: Inline vs Full-page

- **Inline**: database incorporado dentro de uma page como um bloco. Convive com texto, imagens e outros blocos na mesma página.
- **Full-page**: database ocupa a página inteira. Pode ser acessado diretamente pela sidebar.
- Qualquer database inline pode ser "aberto como página" a qualquer momento.

### 2.3 Propriedades (17 tipos)

| # | Tipo | Descrição |
|---|---|---|
| 1 | **Text** | Texto livre para notas e descrições |
| 2 | **Number** | Numérico com formatos: moeda, percentual, etc. |
| 3 | **Select** | Dropdown de seleção única |
| 4 | **Multi-select** | Tags múltiplas |
| 5 | **Status** | Versão workflow de Select com lógica To-do / In Progress / Complete |
| 6 | **Date** | Data e hora, com suporte a range e timezone |
| 7 | **Checkbox** | Booleano Sim/Não |
| 8 | **URL** | Link clicável |
| 9 | **Email** | E-mail com click-to-email |
| 10 | **Phone** | Telefone com click-to-call no mobile |
| 11 | **Files & Media** | Anexos (imagens, PDFs, áudios) |
| 12 | **People** | Atribuição a membros do workspace |
| 13 | **Relation** | Referência a items de outro database (bidirecional ou unidirecional) |
| 14 | **Rollup** | Agrega dados de items relacionados (Count, Sum, Average, Min, Max, Median, Range, Earliest date, Latest date, Date range, Show original, Show unique values) |
| 15 | **Formula** | Fórmulas com funções matemáticas, de texto e de data. Fórmulas 2.0 permitem referenciar propriedades de databases relacionados diretamente |
| 16 | **Created Time / Last Edited Time** | Timestamps automáticos |
| 17 | **Created By / Last Edited By** | Usuário automático |

Fonte: [Notion Database Properties Explained](https://www.notionapps.com/blog/notion-database-properties-explained)

### 2.4 Filters compostos

- Filtros básicos: por propriedade individual.
- Filtros avançados: combinação de condições AND/OR em grupos aninhados (até 3 camadas).
- Filtros podem ser salvos para toda a equipe ou mantidos como preferência pessoal.

### 2.5 Sorts e Groups

- Múltiplos sorts por prioridade (texto alfabético, número numérico, select por ordem customizada).
- Agrupamento por valor de propriedade, com sub-grupos.
- Ocultar grupos vazios. Ordenar grupos manual ou automaticamente.

### 2.6 Relations e Rollups

- Relations conectam páginas de databases diferentes. Suportam seleção única (limit 1) ou múltipla.
- Rollups calculam: Count all, Count values, Count unique values, Count empty, Show original, Show unique values, Sum, Average, Median, Min, Max, Range (numérico), Earliest date, Latest date, Date range.
- Fórmulas 2.0: referência direta a propriedades de databases relacionados sem criar rollup intermediário.

---

## 3. Page Builder

### 3.1 Blocos disponíveis (via `/`)

**Texto e estrutura**
- Parágrafo (texto padrão)
- Heading 1 / Heading 2 / Heading 3
- Bulleted list
- Numbered list
- Toggle list (expansível/colapsável, pode conter outros blocos)
- Quote
- Callout (com ícone e cor de fundo customizáveis)
- Divider
- Table of contents (flutuante, permanece visível ao rolar)

**Conteúdo especial**
- To-do (checkbox)
- Code block (com syntax highlighting)
- Equation (LaTeX inline e block)
- Columns (2, 3, 4, 5 colunas via `/c2`, `/c3`, etc.)
- Button block (executa automações configuradas)

**Mídia e embeds**
- Image (upload, URL, Unsplash)
- Video (upload ou URL YouTube/Vimeo)
- Audio (upload ou Soundcloud)
- File (qualquer arquivo)
- Bookmark (preview de URL com título e description)
- Embed (iFrame de serviços externos: Figma, CodePen, Loom, etc.)
- PDF (inline viewer)
- Google Maps

**Banco de dados (inline)**
- Table database
- Board database
- Timeline database
- Calendar database
- List database
- Gallery database
- Chart database
- Form database

**Links e referências**
- Mention (`@`) para pages, pessoas e datas
- Linked database (view de database existente)
- Synced block
- Sub-page
- Link to page

**Notion AI**
- Bloco de AI diretamente na página via `/ai`

### 3.2 Slash commands principais

| Comando | Ação |
|---|---|
| `/h1`, `/h2`, `/h3` | Headings |
| `/todo`, `[]` | Checkbox |
| `/bullet`, `*` ou `-` seguido de espaço | Bullet list |
| `/numbered`, `1.` | Numbered list |
| `/toggle`, `>` | Toggle |
| `/callout` | Callout block |
| `/code` | Code block com syntax highlighting |
| `/quote` | Quote block |
| `/divider`, `---` | Linha divisória |
| `/column` | Layout de colunas |
| `/table` | Tabela simples ou database |
| `/image`, `/video`, `/audio`, `/file` | Mídia |
| `/embed`, `/web` | Embed/bookmark |
| `/equation` | Equação LaTeX |
| `/synced` | Synced block |
| `/template` | Template button |
| `/ai` | Notion AI inline |

### 3.3 Drag-and-drop

- Cada bloco tem handle de drag à esquerda.
- Blocos podem ser arrastados para reordenar ou mover para outras páginas.
- Suporte a indent/outdent com Tab / Shift+Tab.
- Blocos dentro de toggles, callouts e columns também são draggáveis.

---

## 4. Keyboard Shortcuts

### Navegação

| Atalho (Mac) | Ação |
|---|---|
| `Cmd+P` ou `Cmd+K` | Abrir search / jump to page |
| `Cmd+L` | Copiar URL da página atual |
| `Cmd+[` | Voltar página |
| `Cmd+]` | Avançar página |
| `Ctrl+Shift+K` (database peek) | Página anterior no database |
| `Ctrl+Shift+J` (database peek) | Próxima página no database |

### Criação de blocos

| Atalho | Bloco |
|---|---|
| `Cmd+Opt+0` | Texto |
| `Cmd+Opt+1` | Heading 1 |
| `Cmd+Opt+2` | Heading 2 |
| `Cmd+Opt+3` | Heading 3 |
| `Cmd+Opt+4` | To-do |
| `Cmd+Opt+5` | Bulleted list |
| `Cmd+Opt+7` | Toggle |
| `Cmd+Opt+8` | Code block |
| `Cmd+Opt+9` | Nova página |
| `Tab` | Indentar bloco |
| `Shift+Tab` | Desindentar bloco |

### Formatação inline

| Atalho | Formato |
|---|---|
| `Cmd+B` | Negrito |
| `Cmd+I` | Itálico |
| `Cmd+U` | Sublinhado |
| `Cmd+Shift+S` | Strikethrough |
| Backtick em volta do texto | Inline code |
| `**text**` | Negrito (markdown) |
| `*text*` ou `_text_` | Itálico (markdown) |
| `~~text~~` | Strikethrough (markdown) |

Fonte: [Notion Keyboard Shortcuts Help](https://www.notion.com/help/keyboard-shortcuts) | [Super.so Cheat Sheet](https://super.so/blog/100-notion-keyword-shortcuts-cheat-sheet-for-mac-and-windows)

---

## 5. Templates

- **Page templates**: qualquer página pode ser duplicada como template. Templates de banco de dados criam novas linhas com estrutura pré-definida.
- **Database templates**: templates de items de database com propriedades e conteúdo pré-preenchidos.
- **Button blocks**: bloco especial que executa uma automação ou cria um item de database ao clicar. Configurável com propriedades pré-definidas.
- **Marketplace**: galeria de templates da comunidade e da Notion (introduzida em 2024) com instalação em um clique.
- **Template picker**: aparece automaticamente em databases vazios sugerindo templates relevantes.

---

## 6. Synced Blocks e Synced Databases

### Synced blocks

- Permite replicar o mesmo bloco (ou grupo de blocos) em múltiplas páginas.
- Toda edição no bloco original reflete em todas as cópias instantaneamente.
- Criado selecionando blocos > "Create synced block" > copiar e colar onde necessário.
- **Limitação de acesso**: usuários sem permissão na página original não veem o conteúdo do synced block.
- **Atenção crítica**: deletar o original com mais de 10 cópias remove todas — sem undo.
- É possível "unsync" cópias individuais ou todas de uma vez, tornando-as independentes.

### Multi-source databases (2025)

- Nova arquitetura (API v2025-09-03) separa "database" (container) de "data sources" (tabelas).
- Permite combinar múltiplas fontes de dados em uma única view de database.
- Permissões gerenciadas a nível de database, não por fonte individual.

Fonte: [Synced Blocks Help](https://www.notion.com/help/synced-blocks) | [Thomas Frank — Synced Blocks Guide](https://thomasjfrank.com/notion-synced-blocks-guide/)

---

## 7. Comments, Mentions e Threads

- **Comments inline**: comentar em qualquer bloco ou seleção de texto.
- **Property-level comments**: comentar em propriedades específicas de databases (introduzido em 2024).
- **Threads**: comentários agrupados em threads por bloco, com respostas aninhadas.
- **Resolved comments**: marcar threads como resolvidas (ficam arquivadas mas acessíveis).
- **Mentions**: `@nome` para mencionar membros (gera notificação), `@data` para datas, `@pagina` para linkar páginas.
- **Suggested Edits**: modo de sugestão onde alterações ficam pendentes até aceitas/rejeitadas (2024).

---

## 8. Notion AI

### Features core (2025)

| Feature | Descrição |
|---|---|
| **Summarize** | Resumo de qualquer página, bloco ou documento |
| **Brainstorm** | Geração de ideias baseada em contexto |
| **Fix grammar** | Correção ortográfica e gramatical |
| **Translate** | Tradução entre idiomas mantendo contexto |
| **Improve writing** | Reescrita para melhorar clareza e tom |
| **Make shorter / longer** | Ajuste de tamanho do texto |
| **Continue writing** | Completar texto com base no contexto |
| **Explain** | Explicar conteúdo selecionado |
| **Q&A** | Responder perguntas sobre o workspace inteiro |
| **AI database properties** | Autofill de propriedades (AI summary, AI keywords, AI translation) |
| **AI Connectors** | Integração com Google Drive, Slack, GitHub, Jira, MSFT Teams, SharePoint, OneDrive, Linear [a confirmar] |
| **PDF/image analysis** | Análise e extração de conteúdo de arquivos |

### Notion 3.0 — Agents (set/2025)

- Agents autônomos que executam sequências de ações dentro do workspace.
- Podem criar pages, atualizar databases, atribuir tarefas, escrever docs.
- Contexto do agente: workspace + ferramentas conectadas + web.
- Memória de estado para tarefas longas (>20 minutos de execução).
- Navegação primária na sidebar ao lado de Favorites, Recents e Teamspaces.

Acesso via `/ai` em qualquer página ou destacando texto e escolhendo "Ask AI".

Fonte: [Notion AI Help](https://www.notion.com/help/notion-ai-faqs) | [Meet your AI team](https://www.notion.com/product/ai) | [Notion 3.0 Agents](https://www.notion.com/releases/2025-09-18)

---

## 9. Permissions e Sharing

### Níveis de permissão de página

| Nível | Pode editar conteúdo | Pode compartilhar | Pode comentar | Pode ver |
|---|---|---|---|---|
| Full access | Sim | Sim | Sim | Sim |
| Can edit | Sim | Não | Sim | Sim |
| Can edit content | Apenas items de database | Não | Sim | Sim |
| Can comment | Não | Não | Sim | Sim |
| Can view | Não | Não | Não | Sim |

- **Share to web**: qualquer página pode ser publicada com URL pública.
- **Guest access**: usuários externos convidados a páginas específicas sem fazer parte do workspace.
- **Page-level permissions**: cada página (incluindo database rows) tem seu próprio Share menu.
- **Teamspace permissions**: Business Plan suporta permissões granulares por usuário/grupo no teamspace.

### Notion Sites (2024)

- Transformar páginas em sites com domínio customizado.
- Suporte a Google Analytics, SEO customization, navegação por headers, custom URL slugs (Plus+).

---

## 10. Search Universal

- `Cmd+P` / `Cmd+K`: busca páginas, databases, itens e conteúdo dentro de toggles fechados.
- Busca por propriedades de database.
- Resultados incluem histórico recente.
- Enterprise Search: busca federada entre Notion + ferramentas conectadas via AI Connectors.

---

## 11. Automations (Notion nativa)

Introduzida em 2023, aprimorada em 2024:
- **Triggers**: database property changed, item added to database, item edited, schedule (a confirmar).
- **Actions**: edit property, add page to database, send notification, send email, open URL, trigger webhook, call function.
- Suporte a fórmulas nas actions (2024).
- Variáveis configuráveis nas automations.
- **Button blocks**: botão em página ou database que executa automação ao clicar.

---

## 12. API e Integrations

- **Notion API REST**: CRUD completo para pages, databases, blocks, users, comments.
- **OAuth 2.0**: integrações de terceiros via fluxo OAuth.
- **Link Preview API**: unfurl de links autenticados de terceiros dentro de pages Notion (GitHub, Jira, Slack, Asana, Trello, SharePoint, OneDrive, etc.).
- **Webhooks**: disponível via automations para enviar eventos externos.
- **Zapier / Make / n8n**: integrações de automação sem código.

Fonte: [Notion Developers](https://developers.notion.com/docs) | [Link Preview Guide](https://www.notion.com/help/guides/notion-api-link-previews-feature)

---

## 13. Notion Calendar (standalone, 2024)

- App de calendário separado que integra Google Calendar + databases Notion.
- Multi-timezone.
- Visualização de tarefas com datas ao lado de eventos de calendário.

---

## 14. Notion Forms (2024)

- Formulários públicos/compartilháveis vinculados a databases.
- Submissions criam novas páginas no database automaticamente.
- Builder básico com campos mapeados para propriedades do database.
- URL compartilhável externamente.

---

## Fontes Primárias

- [Notion Help Center](https://www.notion.com/help)
- [Thomas Frank — Every Notion Feature 2024](https://thomasjfrank.com/every-notion-feature-released-in-2024/)
- [Notion Releases 2025](https://www.notion.com/releases/2025-07-10)
- [Notion 3.0 Agents](https://www.notion.com/releases/2025-09-18)
- [Notion Database Properties Guide](https://www.notionapps.com/blog/notion-database-properties-explained)
- [Views, Filters and Sorts](https://www.notion.com/help/views-filters-and-sorts)
- [Synced Blocks](https://www.notion.com/help/synced-blocks)
- [Notion AI FAQs](https://www.notion.com/help/notion-ai-faqs)
- [Notion Sharing & Permissions](https://www.notion.com/help/sharing-and-permissions)
- [Notion Keyboard Shortcuts](https://www.notion.com/help/keyboard-shortcuts)
