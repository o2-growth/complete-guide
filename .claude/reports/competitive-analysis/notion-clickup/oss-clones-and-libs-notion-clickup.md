# Bibliotecas OSS para Acelerar o Oxy Growth OS
> Equivalências Notion + ClickUp em componentes prontos
> Data: 2026-05-04

---

## 1. Editors Notion-like (Block-based)

### BlockNote
- **Repo**: [TypeCellOS/BlockNote](https://github.com/TypeCellOS/BlockNote)
- **Site**: https://www.blocknotejs.org/
- **NPM**: `@blocknote/react`, `@blocknote/core`
- **Versão atual**: 0.48.1 (publicado ~mai/2026, atualizado ativamente)
- **Licenca**: MPL-2.0 (core + maioria dos pacotes) / GPL-3.0 (pacotes XL — requer licença comercial para uso fechado)
- **Stack**: Prosemirror + Tiptap + Yjs
- **Features principais**:
  - Drag-and-drop de blocos com handles
  - Slash menu de inserção de blocos
  - Formatting toolbar contextual
  - Colaboração em tempo real (Yjs/CRDT)
  - Comments + threads out of the box
  - AI integration integrada
  - TypeScript nativo com autocompletion completo
  - Exportação para HTML, Markdown
  - Nested blocks (indentar/desindentar)
- **Avaliação para Oxy**: **MELHOR ESCOLHA** para editor de Wiki/Docs. MPL-2.0 permite uso comercial fechado sem contaminar o codebase. Colaboração e AI já incluídos.
- Fonte: [BlockNote GitHub](https://github.com/TypeCellOS/BlockNote) | [BlockNote Velt Guide](https://velt.dev/blog/blocknote-collaborative-editor-guide)

---

### Plate.js
- **Repo**: https://github.com/udecode/plate
- **Site**: https://platejs.org/
- **NPM**: `@udecode/plate`
- **Licenca**: MIT
- **Stack**: Slate.js + React
- **Features principais**:
  - Framework de plugins extremamente extensível
  - 50+ plugins: headings, lists, tables, code blocks, media, mentions, comments, collaboration
  - Plugin de Excalidraw incluso (`@platejs/excalidraw`)
  - Headless: UI totalmente customizável
  - Serialização para HTML, Markdown, AST
- **Avaliação para Oxy**: Melhor se precisar de controle máximo sobre a UI. Mais boilerplate que BlockNote mas mais flexível. Boa opção se Oxy já usa Tiptap e quer migrar.
- Fonte: [Plate.js Docs](https://platejs.org/docs/excalidraw)

---

### Yoopta-Editor
- **Repo**: [yoopta-editor/Yoopta-Editor](https://github.com/yoopta-editor/Yoopta-Editor)
- **Site**: https://yoopta.dev/
- **NPM**: `@yoopta/editor`
- **Licenca**: MIT
- **Stack**: Slate.js
- **Features principais**:
  - 20+ plugins out of the box: paragraph, headings, lists, code, images, videos, tables, accordions
  - Drag-and-drop multi-bloco
  - Nested structures com indentação
  - Tema shadcn disponível (Material em progresso)
  - Exportação para HTML, Markdown, plain text, email HTML
  - React 19 compatível
  - Plugin `@yoopta/emoji` (2025)
  - Headless por default com presets visuais opcionais
- **Avaliação para Oxy**: Boa alternativa MIT mais leve que Plate.js se já existe Tiptap no projeto. Shadcn theme reduz trabalho de estilização.
- Fonte: [Yoopta GitHub](https://github.com/yoopta-editor/Yoopta-Editor) | [Yoopta Dev](https://yoopta.dev/)

---

### Novel
- **Repo**: https://github.com/steven-tey/novel
- **NPM**: `novel`
- **Licenca**: Apache 2.0
- **Stack**: Tiptap + AI (Vercel AI SDK)
- **Features principais**:
  - Editor Notion-like minimalista
  - AI completions integradas via Vercel AI SDK
  - Bubble menu + slash menu prontos
  - Fácil de personalizar
- **Avaliação para Oxy**: Ótimo para editor simples com AI. Menos completo que BlockNote/Plate para uso como "Wiki engine" robusto.
- Fonte: https://github.com/steven-tey/novel

---

## 2. Page Tree / Sidebar de Navegação

### react-arborist
- **Repo**: [brimdata/react-arborist](https://github.com/brimdata/react-arborist)
- **NPM**: `react-arborist`
- **Licenca**: MIT
- **Última atualização**: fev/2025 (ativo)
- **Features**:
  - Tree view completo para React
  - CRUD de nós (create, rename, move, delete) interno
  - Drag-and-drop para reordenar e mover
  - Render de nó 100% customizável
  - Virtual scrolling para grandes árvores
  - Equivalente a VSCode sidebar / Figma layers panel
- **Status Oxy**: já em uso segundo mem/roadmap.
- Fonte: [react-arborist GitHub](https://github.com/brimdata/react-arborist)

---

### react-complex-tree
- **Repo**: [lukasbach/react-complex-tree](https://github.com/lukasbach/react-complex-tree)
- **NPM**: `react-complex-tree`
- **Licenca**: MIT
- **Features**:
  - Acessibilidade como prioridade (ARIA completo)
  - Multi-select nativo
  - Drag-and-drop entre árvores
  - Rename inline
  - Virtualization
  - Sem opiniões de UI (bring your own styles)
- **Avaliação para Oxy**: alternativa mais acessível ao react-arborist. Útil se a árvore de páginas precisar de ARIA robusto.
- Fonte: [react-complex-tree GitHub](https://github.com/lukasbach/react-complex-tree)

---

## 3. Custom Fields Builder

### react-jsonschema-form (RJSF)
- **Repo**: https://github.com/rjsf-team/react-jsonschema-form
- **NPM**: `@rjsf/core`
- **Licenca**: Apache 2.0
- **Features**:
  - Gera formulários automaticamente a partir de JSON Schema
  - Validação via JSON Schema
  - Customização de widgets por tipo
  - Suporte a arrays, objetos aninhados, condicionals
  - Temas: Bootstrap, MUI, Ant Design, Chakra, Semantic UI, etc.
- **Avaliação para Oxy**: ideal para gerar UI de configuração de Custom Fields onde o schema é armazenado como JSON no banco. Não é o builder "de arrastar", mas é sólido para renderizar formulários a partir de schema.
- Fonte: https://rjsf-team.github.io/react-jsonschema-form/

---

### Formily (Alibaba)
- **Repo**: https://github.com/alibaba/formily
- **Site**: https://formilyjs.org/
- **Licenca**: MIT
- **Features**:
  - Form builder de alta performance com React
  - Schema-driven: define forms via JSON Schema
  - State management próprio eficiente
  - Suporte a campos dinâmicos, validações customizadas, dependências entre campos
  - Designado para formulários enterprise complexos
- **Avaliação para Oxy**: mais pesado que RJSF mas muito mais poderoso para forms dinâmicos com lógica condicional.
- Fonte: [Formily GitHub](https://github.com/alibaba/formily)

---

### SurveyJS
- **Repo**: https://github.com/surveyjs/survey-library
- **Site**: https://surveyjs.io/
- **Licenca**: MIT (library) / Comercial (Survey Creator visual)
- **Features**:
  - Library de renderização: MIT.
  - Survey Creator (drag-and-drop builder): requer licença comercial.
  - 30+ tipos de questão: text, checkbox, dropdown, rating, matrix, file upload, etc.
  - Validação rica, lógica condicional, skip logic.
- **Avaliação para Oxy**: boa para Forms públicos (equivalente ClickUp Forms). Survey Creator não pode ser usado em produto fechado sem licença.
- Fonte: [SurveyJS GitHub](https://github.com/surveyjs/survey-library)

---

## 4. Database / Spreadsheet Views

### Glide Data Grid
- **Repo**: [glideapps/glide-data-grid](https://github.com/glideapps/glide-data-grid)
- **Site**: https://grid.glideapps.com/
- **NPM**: `@glideapps/glide-data-grid`
- **Licenca**: MIT (Free & Open Source, uso comercial permitido)
- **Features**:
  - Performance extrema: milhões de linhas, centenas de milhares de updates/segundo
  - Rendering lazy por célula (eficiência de memória)
  - Tipos de célula: number, text, markdown, bubble, image, drilldown, URI
  - Células totalmente customizáveis
  - Colunas redimensionáveis e movíveis
  - Rows variáveis, merged cells
  - Single e multi-select de rows/cells/columns
  - Native scrolling suave
  - TypeScript full
- **Avaliação para Oxy**: **MELHOR ESCOLHA** para Table view com Custom Fields. Performance superior para grandes datasets. MIT + comercial permitido.
- Fonte: [Glide Data Grid GitHub](https://github.com/glideapps/glide-data-grid)

---

### AG Grid Community
- **Site**: https://www.ag-grid.com/
- **NPM**: `ag-grid-react`
- **Licenca**: MIT (Community) / Comercial (Enterprise)
- **Features Community**:
  - Sorting, filtering, grouping
  - Virtual scrolling
  - Column resize/reorder
  - Cell editing
  - Temas customizáveis
- **Features Enterprise (pago, $999/dev)**:
  - Row grouping avançado, pivoting, aggregations
  - Excel export
  - Row drag-and-drop
  - Master/detail
- **Avaliação para Oxy**: Community é MIT e sólido. Enterprise features bloqueadas por licença comercial. Para Table view básica, Community basta.
- Fonte: [AG Grid Site](https://www.ag-grid.com/) | [TanStack vs AG Grid Comparison](https://www.simple-table.com/blog/tanstack-table-vs-ag-grid-comparison)

---

### TanStack Table
- **Site**: https://tanstack.com/table
- **NPM**: `@tanstack/react-table`
- **Licenca**: MIT (todas as features, sem split community/enterprise)
- **Features**:
  - Headless (sem UI própria — controle total)
  - Sorting, filtering, grouping, pagination
  - Virtualização via TanStack Virtual
  - Column sizing, pinning, reordering
  - Row selection, expansion
  - Excelente TypeScript
- **Avaliação para Oxy**: headless é ponto forte — integra com qualquer design system. Parceria formal com AG Grid como open source partners (mai/2025). Melhor para tabelas não-spreadsheet.
- Fonte: [TanStack Table Docs](https://tanstack.com/table/v8)

---

## 5. Whiteboard / Canvas

### tldraw
- **Site**: https://tldraw.dev/
- **NPM**: `tldraw`
- **Repo**: https://github.com/tldraw/tldraw
- **Licenca**: tldraw Community License (gratuito para uso não-comercial e produtos com receita < $1M/ano [a confirmar limites exatos]; fonte paga para enterprise)
- **Features**:
  - Infinite canvas SDK para React
  - Colaboração em tempo real com sync engine próprio
  - Presença de usuários (cursors)
  - Ferramentas completas: desenho, shapes, texto, setas, imagens
  - Acessibilidade: dark mode, screen reader, navegação por teclado
  - Alinhamento, distribuição, reordenação, drag-and-drop
  - Cross-tab sync, undo/redo
  - API extensível para tipos de shapes customizados
  - TypeScript nativo
  - Enterprise-grade performance
- **Avaliação para Oxy**: **PRIMEIRA ESCOLHA** para Whiteboard. SDK mais completo, production-ready, com sync engine. Verificar limites da Community License para o modelo de receita Oxy.
- Fonte: [tldraw SDK](https://tldraw.dev/) | [tldraw npm](https://www.npmjs.com/package/tldraw)

---

### Excalidraw
- **Site**: https://excalidraw.com/
- **NPM**: `@excalidraw/excalidraw`
- **Repo**: https://github.com/excalidraw/excalidraw
- **Licenca**: MIT
- **Features**:
  - Canvas com estética "hand-drawn"
  - Colaboração via URL
  - Shapes, texto, setas, imagens
  - Exportação PNG/SVG
  - Embeddable como componente React
  - Integrado ao Plate.js (`@platejs/excalidraw`) e BlockNote
- **Avaliação para Oxy**: MIT sem restrições. Mais simples que tldraw. Ideal se o objetivo for embeds de diagramas dentro de docs (como o Plate.js faz) ao invés de whiteboard standalone completo.
- Fonte: [Excalidraw npm](https://www.npmjs.com/package/@excalidraw/excalidraw) | [Excalidraw Integration Docs](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/integration)

---

### ReactFlow / xyflow
- **Site**: https://reactflow.dev/
- **NPM**: `@xyflow/react`
- **Licenca**: MIT
- **Features**:
  - Grafos interativos e flowcharts
  - Nós e edges customizáveis
  - Dagre, ELK para auto-layout
  - Minimap, controls, background
  - Bom para: fluxogramas de processo, mind maps, pipelines de automação
- **Avaliação para Oxy**: melhor para conectar nodes (flowcharts, pipelines de automação) do que para whiteboard livre. Usar como base para um builder de Automations visual.
- Fonte: [ReactFlow Site](https://reactflow.dev/)

---

## 6. Filter Builder / Smart Lists

### react-querybuilder
- **Site**: https://react-querybuilder.js.org/
- **NPM**: `react-querybuilder`
- **Licenca**: MIT
- **Versão**: 8.14.4 (publicado mai/2026, ativo)
- **Features**:
  - Componente React para construir queries e filtros
  - Drag-and-drop de regras via `@react-querybuilder/dnd`
  - Exportação para: SQL WHERE clause, MongoDB query, JSON, etc. via `formatQuery`
  - Suporte a AND/OR aninhado
  - Datetime support via `@react-querybuilder/datetime`
  - Rules engine (if-then-else) via `@react-querybuilder/rules-engine`
  - Compatível com: Ant Design, Bootstrap, Bulma, Chakra, Fluent UI, Mantine, MUI, Tremor
  - React Native component
- **Avaliação para Oxy**: **MELHOR ESCOLHA** para Smart Lists com filtros compostos. Exporta para SQL que pode ser usado diretamente nas queries do backend. MIT, ativo, extensível.
- Fonte: [react-querybuilder site](https://react-querybuilder.js.org/) | [react-querybuilder GitHub](https://github.com/react-querybuilder/react-querybuilder)

---

## 7. Drag-and-Drop

### dnd-kit
- **NPM**: `@dnd-kit/core`
- **Licenca**: MIT
- **Status Oxy**: já em uso segundo mem/roadmap.
- **Avaliação**: manter. Suporta todos os casos de uso (reordenar tasks, mover entre listas, drag de blocos em editor).

---

## 8. Mind Map

### Markmap
- **Site**: https://markmap.js.org/
- **NPM**: `markmap-view`, `markmap-lib`
- **Licenca**: MIT
- **Features**: converte Markdown em mind map interativo e navegável.
- **Avaliação para Oxy**: leve, simples, ideal para mind map read-only gerado de texto.

### ReactFlow (alternativa)
- Ver seção 5. Pode ser usado para mind maps editáveis com nós arrastáveis.

---

## 9. Calendar Avançado

### Schedule-X
- **Site**: https://schedule-x.dev/
- **NPM**: `@schedule-x/react`
- **Licenca**: MIT
- **Features**: calendar moderno para React, day/week/month views, eventos drag-and-drop, recurrence.
- **Avaliação para Oxy**: alternativa moderna ao react-big-calendar para Calendar view.

### React Big Calendar
- **NPM**: `react-big-calendar`
- **Licenca**: MIT
- **Features**: calendar maduro, semana/mês/agenda views, drag-and-drop de eventos.
- **Avaliação para Oxy**: battle-tested, ampla adoção. Se Oxy já usa, manter.

### FullCalendar
- **Site**: https://fullcalendar.io/
- **NPM**: `@fullcalendar/react`
- **Licenca**: MIT (core) / Premium (alguns plugins)
- **Features**: mais completo dos três, suporta timeline/gantt view, recursos (resource management).

---

## 10. Resumo — Top 5 libs para Fase 7

| # | Biblioteca | Gap que resolve | Licenca | Prioridade |
|---|---|---|---|---|
| 1 | **tldraw** | Whiteboard / Canvas livre (equivalente ClickUp Whiteboard) | Community (verificar limites) | CRITICA |
| 2 | **BlockNote** | Editor Notion-like para Wiki/Docs (synced blocks, slash commands, AI, colaboração) | MPL-2.0 | CRITICA |
| 3 | **Glide Data Grid** | Table view com Custom Fields em alta performance (equivalente Table view Notion/ClickUp) | MIT | ALTA |
| 4 | **react-querybuilder** | Smart Lists com filtros compostos AND/OR aninhados (equivalente Notion Filters + ClickUp Smart Filters) | MIT | ALTA |
| 5 | **react-jsonschema-form** | UI para construção de Custom Fields schema (builder de campos dinâmicos em tasks) | Apache 2.0 | ALTA |

**Runners-up por categoria:**
- Editor alternativo: Yoopta-Editor (MIT, mais leve, shadcn theme)
- Canvas alternativo: Excalidraw (MIT, para embeds em docs)
- Flowchart/automations builder: ReactFlow/xyflow (MIT)
- Tree navigation: já tem react-arborist; react-complex-tree como backup acessível

---

## Fontes

- [BlockNote GitHub](https://github.com/TypeCellOS/BlockNote)
- [BlockNote Site](https://www.blocknotejs.org/)
- [Plate.js Docs](https://platejs.org/)
- [Yoopta-Editor GitHub](https://github.com/yoopta-editor/Yoopta-Editor)
- [tldraw SDK](https://tldraw.dev/)
- [Excalidraw npm](https://www.npmjs.com/package/@excalidraw/excalidraw)
- [Glide Data Grid GitHub](https://github.com/glideapps/glide-data-grid)
- [AG Grid Site](https://www.ag-grid.com/)
- [TanStack Table Docs](https://tanstack.com/table/v8)
- [react-querybuilder Site](https://react-querybuilder.js.org/)
- [react-arborist GitHub](https://github.com/brimdata/react-arborist)
- [react-complex-tree GitHub](https://github.com/lukasbach/react-complex-tree)
- [AG Grid + TanStack Partnership](https://www.developer-tech.com/news/ag-grid-and-tanstack-table-join-forces-open-source-partners/)
