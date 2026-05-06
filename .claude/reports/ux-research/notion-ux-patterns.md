# Notion UX Patterns — Referência de Design

**Data da pesquisa**: 2026-05-06
**Fontes**: notion.com/help, medium.com (UI Breakdown), keychron.com/blogs, super.so

---

## 1. Sidebar — Estrutura Completa

### Medidas e Grid
- **Largura da sidebar**: 224px
- **Altura da navegação principal**: 131px (4 itens: Search, Notion AI, Home, Inbox)
- **Altura da linha Favorites**: 30px
- **Gap entre seções**: 6px
- **Grid base**: 8px — todos os espaçamentos são múltiplos de 8
- **Zonas clicáveis**: ocupam a linha inteira, com 8px de border-radius
- **Sidebar redimensionável**: drag na borda direita para ajustar largura

### Hierarquia de Seções (topo → fundo)
```
Workspace Name / Switcher
├── Search (Cmd+P / Cmd+K)
├── Notion AI
├── Home
└── Inbox

[FAVORITES] ← aparece automaticamente após primeiro star
  └── Pages favoritadas (ordenáveis manualmente)

[RECENTS]
  └── Páginas visitadas recentemente

[PRIVATE]
  └── Páginas pessoais

[SHARED]
  └── Páginas com acesso compartilhado seletivo

[TEAMSPACES] (planos Plus+)
  └── Spaces colaborativos de time

───────────────────────
Trash
Settings & Members
```

### Comportamentos Interativos
- **Hover em item**: revela botão `+` (criar sub-página) e `...` (menu de opções)
- **Click em seção header**: colapsa/expande o grupo
- **Disclosure triangles**: `▶` para expandir páginas aninhadas
- **Drag and drop**: arrasta páginas dentro de seções ou entre seções para reordenar/aninhar
- **Nesting**: arrastar uma página sobre outra cria sub-página infinitamente aninhada
- **Sort options**: Manual ou Last edited por seção
- **Display count**: controle para mostrar 5 ou todas as páginas por seção

---

## 2. Favorites

- **Onde fica**: topo da área de conteúdo de usuário, abaixo dos 4 itens fixos de navegação
- **Como adicionar**: navegar até a página → clicar `⭐` no topo → aparece automaticamente em Favorites na sidebar
- **Ordenação**: manual drag-and-drop dentro da seção Favorites
- **Visibilidade**: seção aparece SOMENTE após o primeiro item ser adicionado (empty state invisível)
- **Persistência**: global por workspace, sincronizado entre dispositivos
- **Uso recomendado** (Notion official): "páginas visitadas frequentemente" e teamspaces mais usados

---

## 3. Recentes

- **Localização**: aba "Recents" na Library (seção de navegação principal)
- **Acesso alternativo**: janela de busca (Cmd+P) — "recently visited pages" aparecem no topo antes de digitar
- **Comportamento**: lista automática sem configuração manual — baseada em histórico de navegação
- **Integração com search**: ao abrir o quick switcher (Cmd+P), a lista inicial exibe recentes, depois filtra por typing
- **Sem limite publicado** de quantos recentes são exibidos [a confirmar]

---

## 4. Seções Colapsáveis

- **Mecanismo**: click no header da seção = toggle colapsar/expandir
- **Estado persiste**: collapso é salvo por usuário (não por sessão)
- **Ícone visual**: seta/triângulo de disclosure que rota 90° ao expandir
- **Animação**: transição suave (Notion usa CSS transitions, não especificado o timing)
- **Seções colapsáveis**: Private, Shared, cada Teamspace individualmente, Favorites

---

## 5. Drag-Drop — Reorganização na Sidebar

- **Reordenar páginas**: drag dentro da mesma seção
- **Mover entre seções**: drag de Private → Shared, etc.
- **Criar hierarquia**: drag de uma página "sobre" outra → cria sub-página
- **Visual durante drag**: item sendo arrastado tem leve opacidade reduzida; placeholder visual indica destino
- **Limitações**: drag entre workspace e teamspace tem restrições de permissão

---

## 6. Breadcrumbs

- **Posição**: topo da área de conteúdo, abaixo do topbar
- **Formato**: `Workspace > Teamspace > Página Pai > Página Atual`
- **Interativo**: cada nível é clicável para navegar
- **Truncamento**: paths longos são truncados com `...` no meio
- **Dinâmico**: atualiza em tempo real ao navegar entre páginas

---

## 7. Sub-pages Infinitas

- **Sem limite técnico** de aninhamento — "Organize your work on infinite levels"
- **Criação de sub-page**: botão `+` hover na sidebar ao lado do item pai, ou `/page` dentro do editor, ou drag-and-drop
- **Backlinking**: menção inline com `@nome-da-página` cria link bidirecional
- **Visualização**: sub-pages aparecem como blocos dentro do conteúdo pai E como itens aninhados na sidebar
- **Bread-crumb depth**: exibe toda a hierarquia independente de profundidade

---

## 8. Quick Switcher (Cmd+P)

- **Atalho**: `Cmd+P` ou `Cmd+K` — ambos abrem o mesmo quick switcher/search
- **Distinção**: no Notion, Cmd+K DENTRO de texto é "adicionar link"; Cmd+P é sempre quick switcher; Cmd+K sem texto selecionado = quick switcher
- **Comportamento inicial (sem digitar)**:
  - Exibe páginas visitadas recentemente
  - Exibe últimos comandos usados [a confirmar]
- **Durante digitação**:
  - Filtra títulos de páginas, databases, comandos
  - Fuzzy search no título das páginas
  - Suporte a filtros por tipo: "table" → insere database, "share" → abre sharing settings
- **Teclado**: setas para navegar, Enter para selecionar, Esc para fechar
- **Slash commands**: digitar `/` em qualquer página abre o inline command menu (diferente do quick switcher)
- **Find & Replace**: `Cmd+H` — busca e substitui dentro da página (diferente do global search)

---

## 9. Typography

- **Famílias de sistema**: SF Pro (macOS), Segoe UI (Windows) — native feel sem web font custom
- **Opções de fonte**: Notion permite trocar entre Default, Serif, Mono por página
- **Peso**: Medium (500) para labels e sidebar items — "easy to read without being too bold"
- **Cor de texto**: warm grays em vez de preto puro — reduz harshness
- **Escala tipográfica** (inferida via inspeção visual):
  - `H1`: ~30px, bold, com page title treatment
  - `H2`: ~24px, semibold
  - `H3`: ~20px, semibold
  - Body: ~16px, regular
  - Caption/metadata: ~14px, regular
  - Sidebar labels: ~14px, medium
- **Line height**: generous — ~1.5 para body, ~1.2 para headings

---

## 10. Spacing Scale

- **Grid base**: 8px
- **Medidas documentadas**:
  - Sidebar items: 30px de altura por linha
  - Gap entre seções na sidebar: 6px
  - Sidebar total top nav: 131px
  - Icon size na sidebar: 22px × 22px
  - Border radius das zonas clicáveis: 8px
- **Espaçamento de conteúdo** (inferido): 16px padding horizontal nas páginas, 24-32px entre blocos maiores
- **Margem máxima de conteúdo**: ~900px centralizado em telas largas

---

## 11. Empty States

- **Page vazia**: exibe "Add a cover", "Add an icon", e área de conteúdo com placeholder "Press Enter to continue with an empty page, or pick a template" e lista de templates sugeridos
- **Database vazia**: exibe "New" button proeminente + opção de importar
- **CTA grande e visível**: empty states do Notion são altamente acionáveis, não apenas mensagens passivas
- **Template suggestions**: empty states de pages sugerem templates relevantes ao contexto
- **Inline tutorial**: hints aparecem em hover sobre areas vazias (ex: "Click to add...")

---

## 12. Page Covers e Ícones Customizáveis

### Covers (banner no topo da página)
- **Posição**: banner de imagem no topo, acima do título
- **Fontes de imagem**: Gallery do Notion, Upload, URL externa, Unsplash, Notion AI (generate)
- **Repositionamento**: drag na imagem para ajustar qual parte é exibida
- **Remove/change**: hover na cover exibe os controles

### Ícones de página
- **Tipos**: emoji, imagem customizada (PNG/SVG), upload próprio
- **Como adicionar**: hover no topo da página → "Add icon"
- **Tamanho recomendado**: 280 × 280px para uploads customizados
- **Na sidebar**: ícone aparece ao lado do nome da página (22px)
- **Sem ícone**: placeholder neutro (página em branco)

---

## 13. Focus Mode / Reading Mode

- **Notion não tem focus mode dedicado** como feature nomeada [a confirmar se foi lançado pós-2024]
- **Workaround**: `Cmd+\` oculta a sidebar, maximizando a área de leitura/edição
- **Full width**: opção por página (toggle "Full width" nas page settings) — expande conteúdo para ~100% da largura
- **Zen mode implícito**: combinando sidebar oculta + full width = leitura limpa

---

## 14. Templates Gallery

- **Acesso**: botão "Templates" na sidebar ou em empty states
- **Categorias**: Personal, Work, Engineering, Marketing, etc.
- **Preview**: thumbnail + preview clicável antes de usar
- **Fonte**: templates oficiais Notion + templates da comunidade
- **Duplicar**: qualquer page pode virar template via "Duplicate" e compartilhar

---

## 15. Inline Page Mentions

- **Syntax**: `@nome-da-página` em qualquer bloco de texto
- **Comportamento**: abre dropdown para selecionar página específica; cria link inline
- **Bidirecional**: página mencionada recebe backlink automático
- **Tipos de mention**: `@pessoa`, `@data`, `@página` — todos via mesmo trigger `@`
- **Visual**: menção exibe ícone + nome da página como hyperlink inline

---

## Atalhos de Teclado Principais

| Atalho | Ação |
|--------|------|
| `Cmd+P` / `Cmd+K` | Quick switcher / Search global |
| `Cmd+F` | Busca dentro da página |
| `Cmd+H` | Find & Replace |
| `Cmd+\` | Ocultar/mostrar sidebar |
| `Cmd+N` | Nova página |
| `Cmd+Shift+N` | Nova janela |
| `Cmd+T` | Nova aba |
| `Cmd+[` | Navegar back |
| `Cmd+]` | Navegar forward |
| `Cmd+Shift+L` | Toggle dark/light mode |
| `/` | Slash commands (inline) |
| `Tab` | Indentar (criar sub-bloco) |
| `Shift+Tab` | Desindentar |
| `Cmd+D` | Duplicar bloco(s) |
| `Cmd+Shift+M` | Criar comentário |
| `Esc` | Selecionar bloco atual (sair do modo edição) |

---

## Fontes

- [Navigate with the sidebar — Notion Help](https://www.notion.com/help/navigate-with-the-sidebar)
- [Manage your Library — Notion Help](https://www.notion.com/help/manage-your-library)
- [Navigating with the sidebar — Notion Guides](https://www.notion.com/help/guides/navigating-with-the-sidebar)
- [UI Breakdown of Notion's Sidebar — Medium](https://medium.com/@quickmasum/ui-breakdown-of-notions-sidebar-2121364ec78d)
- [Notion Keyboard Shortcuts — Keychron](https://www.keychron.com/blogs/news/notion-keyboard-shortcuts)
- [Notion Search Shortcut — Super.so](https://super.so/blog/notion-search-shortcut-how-to-search-in-notion-2023)
- [Style & customize your page — Notion Help](https://www.notion.com/help/customize-and-style-your-content)
- [Page icons & covers — Notion Guides](https://www.notion.com/help/guides/page-icons-and-covers)
- [Structure sidebar for focused work — Notion Guides](https://www.notion.com/help/guides/structure-sidebar-focused-work-teamspaces)
