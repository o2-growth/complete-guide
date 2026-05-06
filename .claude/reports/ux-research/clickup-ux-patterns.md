# ClickUp UX Patterns — Referência de Design

**Data da pesquisa**: 2026-05-06
**Fontes**: help.clickup.com, clickup.com/features, consultevo.com, stackset.com

---

## 1. Density Modes

- **ClickUp oferece density modes** na visualização de listas e boards
- **Modos disponíveis** (nomenclatura do ClickUp):
  - **Comfortable**: mais espaço entre itens, ideal para leitura
  - **Cozy**: intermediário — balanceia espaço e densidade [a confirmar se esse é o nome exato]
  - **Compact**: máxima densidade, mais itens visíveis por tela
- **Onde configurar**: View settings de cada view (List, Board) → "Row height" ou "Density"
- **Persistência**: por view, não global — cada view pode ter density diferente
- **Linear** também implementa density interna, porém não exposta como toggle ao usuário
- Nota: nomenclatura exata "comfortable/cozy/compact" é do ClickUp; Linear usa densidade fixa gerenciada pelo design

---

## 2. Sidebar Customizável

### Estrutura da Sidebar 3.0
```
[Global Nav] — barra de ícones vertical mais à esquerda
├── Home
├── Notifications
├── Search
├── Docs
├── Dashboards
└── [Custom apps/integrations]

[Sidebar principal]
├── Spaces
│   ├── Folders
│   │   └── Lists
├── Starred/Pinned items
└── Everything (view global)
```

### Customização de Sidebar
- **Drag & drop para reordenar Spaces**: arrasta Spaces para mudar a ordem
- **Ocultar Spaces**: "Hide or reorder Spaces" — pode esconder espaços não usados
- **Right-click em Space**: menu com opções de customização, cor, icone
- **Seções customizadas na Home Sidebar**: criar, nomear e reordenar seções com Lists, Tasks, Channels
- **Pin to top / Pin to bottom**: fixar items no topo ou fundo da sidebar
- **"More" menu**: agrupa items pouco usados fora do scroll principal
- **Resize**: sidebar redimensionável horizontalmente

### Toolbar (Global Nav) Personalização
- **Pin items no toolbar**: hover → ícone de pin → item aparece permanentemente no toolbar superior
- **Itens pináveis**: tasks, Docs, Lists e qualquer conteúdo frequente
- **Acesso rápido**: items pinados no toolbar não requerem abrir menu completo

---

## 3. Pinned Items

- **Tipos de pin**:
  - "Pin to top" — fixa item no topo da seção atual
  - "Pin to bottom" — fixa item no fundo
  - "Pin to toolbar" — fixa no toolbar global (acesso instantâneo)
- **Como pinnar**: hover sobre item → ícone `📌` → clicar
- **Reordenar pinados**: drag & drop entre itens pinados
- **Diferença de Favoritos do Notion**: ClickUp usa "Pin" enquanto Notion usa estrela ⭐ para Favorites — funcionalidade equivalente

---

## 4. Multi-Views Toggle Compacto

- **Views disponíveis**: List, Board (Kanban), Calendar, Gantt, Timeline, Table, Workload, Map, Form, Activity, Chat
- **Switch de view**: tabs no topo da área de conteúdo — clique direto para trocar
- **Views salvas**: cada configuração (filtros, agrupamento, ordenação, campos visíveis) pode ser salva como view nomeada
- **Views por membro**: cada pessoa pode ter sua própria view do mesmo List/Space
- **View bar** (changelog 2024): barra de views reorganizável e compacta acima do conteúdo

---

## 5. Filter Bars Sticky

- **Filter bar**: aparece abaixo das tabs de view, persiste durante o scroll do conteúdo (sticky)
- **Filtros ativos**: chips visuais mostrando cada filtro ativo — clique no chip remove o filtro
- **Filtros disponíveis**: Assignee, Status, Due date, Priority, Tag, Custom fields e mais
- **Filtros negativos**: suporte a "is not" em todos os campos
- **Salvar filtros**: filtros podem ser salvos como parte de uma view
- **Filter combinado com agrupamento**: filtros e group-by funcionam simultaneamente

---

## 6. Bulk Actions Toolbar

- **Ativação**: hover em task → botão de checkbox aparece → selecionar múltiplos
- **Atalho**: `Shift+Click` para seleção em range
- **Toolbar de bulk actions**: aparece no topo ou no rodapé da lista após selecionar ≥2 items
- **18+ ações em massa disponíveis**:
  - Alterar status
  - Alterar assignee
  - Alterar due date
  - Adicionar/remover tags
  - Alterar prioridade
  - Mover para outro List/Space
  - Duplicar
  - Arquivar
  - Deletar
  - Adicionar relações (block/wait-on)
  - Adicionar watchers em massa
  - Aplicar template
- **Context**: toolbar de bulk disponível em List, Board, Gantt e outros views
- **Mobile**: bulk actions em mobile são feature request pendente [a confirmar disponibilidade atual]

---

## 7. Hover Toolbars em Cards

- **Trigger**: hover sobre task row em List view → revela controles
- **Controls que aparecem em hover**:
  - Checkbox de seleção (para bulk)
  - Drag handle (⠿) para reordenar
  - Ações rápidas: assignee, due date, priority, status
  - Menu `...` com ações completas
- **Board cards**: hover revela assignee quick-add, due date, e menu de opções
- **Consistência**: mesmo padrão de hover actions em todos os view types
- **Inline edit**: click em qualquer campo (status, assignee, due date) na row edita inline sem abrir modal

---

## 8. Inline Edit em Todos os Campos

- **Click-to-edit**: clicar em qualquer campo em List view abre editor inline
- **Edição de nome da task**: hover → ícone de lápis → click → campo vira input
- **Status inline**: clique no badge de status abre dropdown de status inline
- **Assignee inline**: clique na foto/avatar → dropdown de usuários inline
- **Due date inline**: clique na data → date picker inline (sem modal separado)
- **Priority inline**: clique no ícone de prioridade → dropdown inline
- **Custom fields**: todos editáveis inline — text, number, dropdown, checkbox, etc.
- **Confirmação**: Enter para confirmar, Esc para cancelar

---

## 9. Color Tags em Groups

- **Spaces com cor**: cada Space tem cor e ícone customizáveis (escolha de paleta ou cor customizada)
- **Labels coloridos**: tags coloridas para categorização — atribuíveis a tasks, Docs, templates
- **Status colors**: cada status pode ter cor personalizada por List
- **Priority colors**: padrão — urgente=vermelho, alta=laranja, normal=azul, baixa=cinza
- **Board: color by**: cards no Board podem ser coloridos por Status, Assignee, Priority, ou Custom Field
- **Gantt: color by**: barras coloridas por campo custom [feature request parcialmente implementada]
- **Folhas de cor**: visualização de carga de trabalho usa heat map de cores

---

## 10. Custom Theme Builder

- **Workspace color theme**: disponível em todos os planos
- **Opções**: Light mode, Dark mode, System (segue OS)
- **Custom accent color**: selecionar cor primária do workspace (afeta highlights, buttons, links)
- **Custom avatar e branding**: planos Business+ permitem logo customizado e branding white-label
- **Sidebar customization**: cor do sidebar pode seguir o tema ou ser customizada
- **Limitação**: não há theme builder visual avançado como Adobe ou Figma — são presets + 1 custom color
- **Global Navigation theming**: cores aplicadas ao Global Nav vertical da versão 3.0

---

## 11. Sidebar vs. Notion: Diferenças Chave

| Aspecto | ClickUp | Notion |
|---------|---------|--------|
| Estrutura base | Spaces > Folders > Lists | Pages > Sub-pages |
| Favoritos/Pin | Pin to top/toolbar | Favorites (⭐) |
| Profundidade | Spaces > Folders > Lists > Tasks (4 níveis fixos) | Infinito |
| Reordenação | Drag & drop por Space | Drag & drop por página |
| Custom Sections | Sim (Home Sidebar) | Não (seções são fixas) |
| Ícone/cor por item | Por Space e Folder | Por qualquer página |

---

## 12. Views e Customização de List View

- **Campos visíveis**: configurar quais colunas aparecem em List view (mostrar apenas campos relevantes)
- **Ordem das colunas**: drag para reordenar colunas
- **Congelar colunas**: primeira coluna (Task name) sempre congelada
- **Row height**: equivalente ao density control — Compact, Comfortable [a confirmar nomenclatura exata]
- **Grouping**: agrupar por Status, Assignee, Priority, Due Date, Custom Field
- **Subgroups**: swim-lane dupla — group + subgroup
- **Sort**: múltiplos critérios de ordenação simultâneos

---

## Fontes

- [Intro to the Sidebar in ClickUp 3.0 — ClickUp Help](https://help.clickup.com/hc/en-us/articles/12755292456983-Intro-to-the-Sidebar)
- [Manage tasks with the Bulk Action Toolbar — ClickUp Help](https://help.clickup.com/hc/en-us/articles/6309768265495-Manage-tasks-with-the-Bulk-Action-Toolbar)
- [Bulk Action Toolbar — ClickUp Features](https://clickup.com/features/multi-task-toolbar)
- [Pin items to the top — ClickUp Help](https://help.clickup.com/hc/en-us/articles/33546712691095-Pin-items-to-the-top)
- [Create and reorder custom Home Sidebar sections — ClickUp Help](https://help.clickup.com/hc/en-us/articles/32855333466903-Create-and-reorder-custom-Home-Sidebar-sections)
- [Customize your ClickUp experience — ClickUp Help](https://help.clickup.com/hc/en-us/articles/35709363436823-Customize-your-ClickUp-experience)
- [Change Workspace appearance and theme — ClickUp Help](https://help.clickup.com/hc/en-us/articles/6310791806359-Change-the-Workspace-color-theme)
- [Intro to the Views Bar — ClickUp Help](https://help.clickup.com/hc/en-us/articles/19063083658135-Intro-to-the-Views-Bar)
- [Customize List view — ClickUp Help](https://help.clickup.com/hc/en-us/articles/7255389296919-Customize-List-view)
- [ClickUp Walkthrough 2025 — StackSet](https://stackset.com/blog/clickup-walkthrough-2025-new-features-pro-tips-to-boost-efficiency)
- [Master Bulk Actions in ClickUp — ConsultEvo](https://consultevo.com/clickup-bulk-action-toolbar-guide/)
