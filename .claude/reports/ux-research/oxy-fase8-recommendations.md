# Oxy Growth OS — Recomendações Fase 8: Redesign UX/UI

**Data**: 2026-05-06
**Baseado em**: Linear, Notion, ClickUp UX research
**Contexto**: sidebar com 75+ páginas / 7 grupos; sem favoritos, sem recentes, sem command palette robusto

---

## Diagnóstico Atual

| Problema | Impacto | Referência |
|----------|---------|------------|
| 75+ páginas na sidebar = sobrecarga cognitiva | Alto | Notion resolve via Favorites + colapso |
| Sem "Favoritos" | Alto | Notion/ClickUp = padrão universal |
| Sem "Recentes" | Alto | Linear (via search) + Notion (via Cmd+P) = acesso rápido |
| Sem Command Palette robusto | Alto | Linear (Cmd+K) = benchmark |
| Grupos não colapsáveis (ou estado não persiste) | Médio | Notion/ClickUp colapsam e memorizam |
| Sem drag-drop na sidebar | Médio | ClickUp/Notion = padrão de personalização |
| Sem density modes | Médio | ClickUp = modelo; Linear = densidade fixa por design |
| Sem hover toolbars em cards de task | Médio | ClickUp/Linear = padrão |
| Sem bulk actions em listas | Médio | ClickUp = 18+ ações em massa |
| Empty states inconsistentes | Baixo | Já há `<EmptyState>` — só precisa auditar uso |

---

## 1. Sidebar Redesign

### 1.1 Adicionar "Favoritos" no Topo

**Implementação**:
```
Favoritos
├── [Página pinada pelo usuário]
├── [Página pinada pelo usuário]
└── + Adicionar favorito (hover)
```

- Botão `⭐` no topbar de cada página → adiciona a Favorites
- Seção aparece SOMENTE após 1º item (modelo Notion — sem empty state que ocupe espaço)
- Ordenação: drag & drop dentro da seção
- Persistência: `user_favorites` no banco (ou `localStorage` como fallback offline)
- Limite sugerido: mostrar até 8, ocultar restantes em "Ver todos os favoritos"

**Referência**: Notion (sidebar Favorites), ClickUp (Pin to top)

---

### 1.2 Adicionar "Recentes"

**Implementação**:
```
Recentes
├── [Última página visitada] — há 2 min
├── [Penúltima] — há 15 min
├── [...]
└── (máx 5 itens visíveis)
```

- Rastrear `lastVisited: timestamp` por página por usuário
- Armazenar em `localStorage` (dados de sessão) + sync para DB (persistência entre dispositivos)
- Ordenar por timestamp decrescente
- Exibir timestamp relativo ("há 5 min", "ontem")
- Ao abrir Command Palette sem texto digitado, recentes aparecem no topo

**Referência**: Notion (Recents na Library), Linear (recentes no search `/`)

---

### 1.3 Grupos Colapsáveis com State Persistido

**Implementação**:
- Todos os 7 grupos atuais da sidebar devem ser colapsáveis via click no header
- Estado (aberto/fechado) persiste em `localStorage` key: `sidebar_group_state_{userId}`
- Ícone de seta (ChevronRight → ChevronDown) indica estado
- Animação: `max-height` transition de 200ms (não `display:none` para animação suave)
- Grupos colapsados mostram apenas o header — header fica sticky se sidebar for scrollável

**Código sugerido (localStorage key)**:
```
sidebar_groups: { "tarefas": true, "projetos": false, "wiki": true, ... }
```

**Referência**: Notion (seções Private/Shared/Teamspaces), ClickUp (Spaces colapsáveis)

---

### 1.4 Drag-Drop para Reordenar Items na Sidebar

**Implementação**:
- Drag handle (⠿) aparece em hover em cada item da sidebar
- Reordenação dentro do mesmo grupo (não entre grupos, para manter hierarquia)
- Ordem persiste em DB: `user_sidebar_order` (array de page IDs por grupo)
- Lib: `@dnd-kit/sortable` — leve, acessível, sem dependência de CSS external

**Limitações iniciais aceitáveis**:
- Só reordenar dentro do grupo, não mover entre grupos
- Grupos em si não são reordenáveis na Fase 8 (roadmap futuro)

**Referência**: Linear (drag & drop sidebar, dez/2024), ClickUp (reorder Spaces)

---

### 1.5 Density Modes

**Modos**:
- **Cozy** (padrão atual): padding `py-2` nas rows, texto `text-sm` (14px)
- **Compact**: padding `py-1`, texto `text-xs` (12px), gap entre grupos `gap-2`

**Implementação via CSS custom properties**:
```css
:root[data-density="compact"] {
  --density-row-py: 4px;
  --density-gap: 4px;
  --density-font-size: 12px;
}
:root[data-density="cozy"] {
  --density-row-py: 8px;
  --density-gap: 8px;
  --density-font-size: 14px;
}
```

**Onde configurar**: `/app/configuracoes/aparencia` — toggle "Densidade da interface"
**Persistência**: `localStorage` + preferências do usuário no DB

**Referência**: ClickUp (density por view), Linear (densidade fixa por design)

---

## 2. Command Palette v2 (Cmd+K)

### Substituir por modelo Linear

**Lib base**: `cmdk` (npm) — Fast, unstyled, acessível. Usado pelo shadcn/ui.

### Estrutura de Sections:

```
┌─────────────────────────────────────┐
│ 🔍 Buscar...                   ⌘K  │
├─────────────────────────────────────┤
│ RECENTES                            │
│  📄 Dashboard                ⌘⏎    │
│  ✅ Tarefa: Review de copy          │
│  📁 Projeto: Campanha Q2            │
├─────────────────────────────────────┤
│ NAVEGAR                             │
│  🏠 Início                    G H  │
│  📋 Hoje                      G T  │
│  📁 Projetos                  G P  │
│  📖 Wiki                      G W  │
│  ⚙️  Configurações             G S  │
├─────────────────────────────────────┤
│ CRIAR                               │
│  + Nova tarefa                   C  │
│  + Novo projeto                     │
│  + Nova wiki                        │
│  + Novo documento                   │
├─────────────────────────────────────┤
│ AÇÕES                               │
│  🎨 Alternar tema                   │
│  📦 Modo compacto                   │
│  🔒 Modo foco                  ⌘⇧F │
└─────────────────────────────────────┘
```

### Requisitos do Command Palette v2:
1. **Fuzzy search global** — busca em títulos de páginas, projetos, tarefas, wikis, usuários
2. **Recentes no topo** — sem digitar, exibe últimas 5 ações/páginas
3. **Atalhos visíveis** — cada item com atalho de teclado à direita
4. **Seções claras** — separadores visuais entre Recentes / Navegar / Criar / Ações / Configurações
5. **Ações multi-step** [v2.1]: "criar tarefa" → digitar nome → selecionar projeto → selecionar prioridade (fluxo guiado sem sair do palette)
6. **Keyboard-first**: setas para navegar, Enter para executar, Esc para fechar, Tab para mover entre seções
7. **Portal rendering**: renderizar fora do DOM da sidebar para evitar z-index conflicts
8. **Acessibilidade**: `role="combobox"`, `aria-activedescendant`, listbox com `role="option"`

**Atalho**: `Cmd+K` abre; segunda pressão de `Cmd+K` fecha (toggle)

---

## 3. Design System Polish

### 3.1 Spacing Scale (Tailwind padrão — sem customização necessária)

| Token | px | Uso típico |
|-------|-----|-----------|
| `space-1` | 4px | Gap interno de icon+label |
| `space-2` | 8px | Padding interno de badge, gap padrão |
| `space-3` | 12px | Padding de sidebar item |
| `space-4` | 16px | Padding de card, padding horizontal de página |
| `space-6` | 24px | Margem entre seções |
| `space-8` | 32px | Padding de container grande |
| `space-12` | 48px | Espaço entre blocos de conteúdo major |

### 3.2 Density Tokens Custom (adicionar ao globals.css)

```css
/* Density tokens — substituem valores de padding em listas */
:root {
  --density-pad-sm: 4px;
  --density-pad-md: 8px;
  --density-pad-lg: 16px;
  --density-gap: 8px;
  --density-row-height: 36px;
  --density-font-sm: 12px;
  --density-font-md: 14px;
}

[data-density="compact"] {
  --density-pad-sm: 2px;
  --density-pad-md: 4px;
  --density-pad-lg: 8px;
  --density-gap: 4px;
  --density-row-height: 28px;
  --density-font-sm: 11px;
  --density-font-md: 13px;
}
```

### 3.3 Typography Scale (auditar e padronizar)

| Classe | Tamanho | Line-height | Uso |
|--------|---------|-------------|-----|
| `text-xs` | 11-12px | 1.5 | Metadata, timestamps, badges |
| `text-sm` | 13-14px | 1.5 | Sidebar labels, table cells |
| `text-base` | 15-16px | 1.6 | Body text, card conteúdo |
| `text-lg` | 18px | 1.5 | Section headers, card titles |
| `text-xl` | 20px | 1.4 | Page headers secundários |
| `text-2xl` | 24px | 1.3 | Page titles, modal headers |
| `text-3xl` | 30px | 1.2 | Dashboard hero numbers |

### 3.4 Shadow Scale (adicionar ao tailwind.config)

```js
// tailwind.config.js — extend shadows
shadows: {
  'soft':     '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  'elevated': '0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)',
  'brand':    '0 4px 14px rgba(var(--color-primary-rgb), 0.25)',
  'overlay':  '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
}
```

### 3.5 Border Radius Scale (padrão Tailwind já adequado)

| Uso | Valor |
|-----|-------|
| Badges, chips | `rounded-full` (9999px) |
| Botões | `rounded-md` (6px) |
| Cards | `rounded-lg` (8px) |
| Modals | `rounded-xl` (12px) |
| Tooltip | `rounded-md` (6px) |
| Avatar | `rounded-full` |

---

## 4. Empty States Padronizados

### Componente `<EmptyState>` — Auditoria e Extensão

O componente já existe. Garantir uso consistente em TODAS as listas.

**Estrutura padrão**:
```tsx
<EmptyState
  icon={<IconTasks />}            // ícone contextual (24-32px)
  title="Nenhuma tarefa ainda"    // título direto, sem hedge
  description="Crie sua primeira tarefa para começar a organizar seu trabalho." // opcional
  action={{
    label: "Criar tarefa",
    onClick: () => openCreateModal(),
    icon: <PlusIcon />
  }}
  secondaryAction={{              // opcional
    label: "Ver templates",
    onClick: () => openTemplates()
  }}
/>
```

**Checklist de telas que precisam de EmptyState** (auditar):
- [ ] Lista de tarefas (Hoje, Próximos 7 dias, Atrasadas)
- [ ] Kanban sem cards
- [ ] Lista de projetos
- [ ] Inbox sem notificações → "Tudo em dia" (como Linear)
- [ ] Resultados de busca sem match
- [ ] Seção Favoritos antes do 1º favorito → **não exibir seção** (modelo Notion)
- [ ] Seção Recentes antes do 1º acesso → **não exibir seção**
- [ ] Wiki sem páginas
- [ ] Calendário sem eventos no período
- [ ] Dashboards sem widgets configurados

---

## 5. Loading States Padronizados

### Regra geral:
- **Listas**: skeleton (ShimmerRow) — nunca spinner em listas
- **Mutations** (save, delete, create): spinner inline no botão
- **Page transitions**: skeleton da estrutura da página

### Componentes existentes — auditar uso:
- `<ListSkeleton>` — usar em toda lista que carrega dados async
- `<CardGridSkeleton>` — usar em grids de cards (projetos, templates)

**Padrão de skeleton**:
```tsx
// Correto: skeleton enquanto dados carregam
{isLoading ? <ListSkeleton rows={5} /> : <TaskList tasks={tasks} />}

// Errado: lista vazia piscando antes dos dados chegarem
{tasks.map(t => <TaskRow key={t.id} task={t} />)}
```

---

## 6. Hover Toolbars em TaskRow / KanbanCard / ProjectCard

### Padrão (modelo ClickUp/Linear):

**TaskRow**:
```
[hover] Revela:
├── Drag handle ⠿ (reordenar)
├── Quick status toggle
├── Quick assignee
├── Quick due date
└── Menu ... [Editar | Duplicar | Arquivar | Excluir]
```

**KanbanCard**:
```
[hover] Revela:
├── Drag indicator
├── Ações rápidas: prioridade, assignee, due date
└── Menu ... no canto superior direito
```

**ProjectCard**:
```
[hover] Revela:
└── Menu ... [Editar | Duplicar | Arquivar | Excluir]
```

**CSS pattern**:
```css
.task-row .hover-actions { opacity: 0; transition: opacity 150ms; }
.task-row:hover .hover-actions { opacity: 1; }
/* Garantir que hover-actions ficam visíveis quando menu está aberto: */
.task-row:has([data-state="open"]) .hover-actions { opacity: 1; }
```

---

## 7. Bulk Actions em Listas de Tasks

### Fluxo:
1. Hover em task row → checkbox aparece (modelo ClickUp)
2. Click em checkbox → seleciona item + mostra "Selecionar todos"
3. Selecionar múltiplos → **Toolbar fixa no rodapé** aparece
4. Toolbar com ações: Alterar status | Alterar prioridade | Atribuir | Arquivar | Excluir

### Toolbar de Bulk Actions (rodapé fixo):
```
┌─────────────────────────────────────────────────────────────┐
│ 3 tarefas selecionadas  [Status ▼] [Prioridade ▼] [Atribuir] [Arquivar] [🗑] │ [×]
└─────────────────────────────────────────────────────────────┘
```

- `position: fixed; bottom: 0` dentro do container de lista
- Transição: slide up de baixo ao selecionar primeiro item
- Botão `×` ou Esc para deselecionar tudo e fechar toolbar
- **Não bloquear** o último item da lista (padding-bottom na lista quando toolbar estiver visível)

---

## 8. Density Modes — Implementação Completa

**Onde configurar**: `/app/configuracoes/aparencia`

```
Densidade da interface
○ Confortável  — mais espaço entre itens (padrão)
● Compacto     — mais itens visíveis por tela
```

**O que muda em cada modo**:

| Elemento | Confortável | Compacto |
|----------|-------------|----------|
| Sidebar item padding | `py-2` (8px) | `py-1` (4px) |
| Task row height | 40px | 28px |
| Card gap em grids | `gap-4` (16px) | `gap-2` (8px) |
| Font size sidebar | 14px | 12px |
| Font size conteúdo | 15px | 13px |
| Seção gap sidebar | 12px | 6px |

**Aplicação**: `document.documentElement.dataset.density = 'compact'` no root.

---

## 9. Focus Mode Estendido

Oxy já tem `/app/foco`. Estender o padrão para qualquer página:

### Focus Mode Global (Cmd+Shift+F):
- Oculta sidebar + topbar
- Expande conteúdo para 100% da largura
- Badge discreto no canto para sair: "Sair do foco" (aparece em hover)
- Estado salvo em `sessionStorage` (não persiste entre sessões)
- Toast ao entrar: "Modo foco ativado — Cmd+Shift+F para sair"

### Onde implementar:
- Botão no topbar de cada página (ícone `Maximize2`)
- Atalho `Cmd+Shift+F` global
- Command Palette → "Ativar modo foco"

---

## 10. Priorização das Mudanças — Top 10

| # | Mudança | Impacto | Esforço | Sprint |
|---|---------|---------|---------|--------|
| 1 | **Command Palette v2 (Cmd+K)** com cmdk | Altíssimo | Médio | F8.1 |
| 2 | **Favoritos na sidebar** (⭐ + seção) | Alto | Baixo | F8.1 |
| 3 | **Recentes na sidebar** (últimas 5 páginas) | Alto | Baixo | F8.1 |
| 4 | **Grupos colapsáveis** com state em localStorage | Alto | Baixo | F8.1 |
| 5 | **Hover toolbars** em TaskRow/KanbanCard | Médio-Alto | Médio | F8.2 |
| 6 | **Bulk actions** em listas de tasks | Médio-Alto | Médio | F8.2 |
| 7 | **Density modes** (Cozy/Compact) | Médio | Baixo | F8.2 |
| 8 | **Drag-drop sidebar** (reordenar items) | Médio | Médio | F8.3 |
| 9 | **Empty states** auditar e padronizar | Médio | Baixo | F8.2 |
| 10 | **Focus Mode global** (Cmd+Shift+F) | Médio | Baixo | F8.3 |

---

## 11. Top 5 Libs/Componentes OSS para Acelerar

### 1. `cmdk` — Command Palette
- **npm**: `cmdk` (3.8k+ stars, mantida pelo Paco Coursey)
- **Por que**: Fast, unstyled, React 18+, usado pelo shadcn/ui — zero estilo imposto, só lógica
- **Install**: `npm install cmdk`
- **Uso**: wrap com Dialog do Radix para overlay; estilizar com Tailwind
- **Docs**: https://cmdk.paco.me/

### 2. `@dnd-kit/sortable` — Drag & Drop na Sidebar e Listas
- **npm**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **Por que**: TypeScript-first, acessível (keyboard DnD), sem dependência jQuery/legacy — padrão atual do ecossistema React
- **Install**: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- **Uso**: `<SortableContext>` wrapping sidebar items; `useSortable` hook por item
- **Docs**: https://dndkit.com/

### 3. `react-resizable-panels` — Sidebar Resizável
- **npm**: `react-resizable-panels` (v4.10.0, atualizado ativamente, 1956+ dependentes)
- **Por que**: suporta persistência de tamanho via `storage`, keyboard-resizable, acessível
- **Install**: `npm install react-resizable-panels`
- **shadcn/ui**: já tem `<ResizablePanel>` baseado nessa lib
- **Docs**: https://github.com/bvaughn/react-resizable-panels

### 4. `sonner` — Toast Notifications
- **npm**: `sonner` (emilkowalski_; OpenAI, Adobe usam em produção)
- **Por que**: belas animações, API mínima, shadcn/ui já integra via `<Sonner>`
- **Install**: `npm install sonner` (se não instalado)
- **API**: `toast.success('Tarefa criada')`, `toast.error(...)`, `toast.promise(...)`
- **Docs**: https://sonner.emilkowalski.dev

### 5. `@tanstack/react-virtual` — Virtualização de Listas Longas
- **npm**: `@tanstack/react-virtual`
- **Por que**: sidebar com 75+ itens precisa de virtualização para performance; também para listas de tasks longas
- **Install**: `npm install @tanstack/react-virtual`
- **Uso no cmdk**: necessário para fuzzy search com muitos resultados (>200 items)
- **Docs**: https://tanstack.com/virtual

---

## 12. Decisões de Design a Documentar

1. **Sidebar Favoritos**: não exibir seção enquanto vazia (modelo Notion) — evita "dead space"
2. **Recentes**: armazenar em localStorage com sync no DB — funciona offline-first
3. **Density**: aplicar via `data-density` no `<html>` — sem rebuild necessário
4. **Command Palette**: único ponto de entrada para TUDO — navegação, criação, configurações
5. **Bulk actions**: toolbar no rodapé (não no topo) — não bloqueia navegação superior
6. **Hover toolbars**: sempre testar que ficam visíveis quando dropdown está aberto (`has([data-state="open"])`)
7. **Empty states Inbox**: "Tudo em dia ✓" (modelo Linear) — mensagem positiva, não neutra

---

## Fontes dos Benchmarks

- [Linear sidebar changelog dez/2024](https://linear.app/changelog/2024-12-18-personalized-sidebar)
- [Notion sidebar UX](https://www.notion.com/help/navigate-with-the-sidebar)
- [ClickUp Bulk Action Toolbar](https://help.clickup.com/hc/en-us/articles/6309768265495-Manage-tasks-with-the-Bulk-Action-Toolbar)
- [cmdk — npm](https://www.npmjs.com/package/cmdk)
- [dnd kit](https://dndkit.com/)
- [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)
- [sonner — shadcn/ui](https://ui.shadcn.com/docs/components/radix/sonner)
- [Command K Bars — Maggie Appleton](https://maggieappleton.com/command-bar)
- [How to build a remarkable command palette — Superhuman](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/)
