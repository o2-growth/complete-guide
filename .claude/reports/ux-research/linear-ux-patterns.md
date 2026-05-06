# Linear UX Patterns — Referência de Design

**Data da pesquisa**: 2026-05-06
**Fontes**: linear.app/now, linear.app/docs, linear.app/changelog, keycombiner.com/collections/linear

---

## 1. Estrutura de Navegação

### Sidebar

- **Inverted L-shape chrome**: app bar vertical à esquerda + área de conteúdo à direita — estrutura fundamental do layout
- **Largura padrão**: sidebar compacta; colapsável via `[` (bracket esquerdo) ou clique na borda da sidebar, ou digitando "Collapse" no command menu
- **Dimming intencional**: sidebar propositalmente mais escura/dimmer que a área de conteúdo — "allowing the main content area—where users work—to take precedence"
- **Hierarquia de seções** (de cima para baixo):
  - Workspace switcher / logo no topo
  - Inbox (`G I`)
  - My Issues (`G M`)
  - Active Issues (`G A`)
  - Backlog (`G B`)
  - Seção de Teams/Projects/Cycles
  - Customers (quando habilitado)
  - Settings (`G S`)
- **Personalização** (changelog dez/2024):
  - Drag & drop para reordenar items
  - Ocultar items pouco usados via menu "More"
  - Right-click em item para opções rápidas
  - "Customize sidebar" expõe todos os toggles
  - Escolha entre exibir contagem ou dot para notificações não-lidas
- **Sem "Favoritos" explícito no topo** — itens fixos via `O F` (open favorites), com acesso pelo command menu
- **Sem seção "Recentes" dedicada** — recentes acessíveis via `/` (search) ou `Cmd+K`

### Headers e Tabs

- Tabs no topo da área de conteúdo: mais compactas, não ocupam largura total, bordas arredondadas, ícone e texto menores
- Headers com metadados reduzidos — "presenting current views, available actions, and metadata more clearly"
- Filtros e painéis ajustados para "reduce visual noise and clutter"

### Breadcrumbs

- Breadcrumbs hierárquicos em issues (Team > Project > Issue)
- Navegação back/forward via Esc e setas

---

## 2. Command Palette (Cmd+K)

**Ativação**: `Cmd+K` (macOS) / `Ctrl+K` (Win/Linux)

### Conteúdo dentro do Command Palette

- **Fuzzy search global**: busca sem precisar do nome exato — "find actions without needing the exact name"
- **Navegação rápida**: qualquer seção do app pode ser acessada digitando o nome
- **Ações contextuais**: muda com base no que está em foco (issue aberto → ações de issue; view → ações de view)
- **Criação**: criar issue (C fora do palette, ou via palette "Create issue")
- **Busca de conteúdo**: issues, projetos, documentos, usuários
- **Tema**: trocar para "Magic Blue" ou acessar theme generator
- **Collapse sidebar**: disponível como ação no palette
- **Atalho `⌘⌥O`**: abre link do último toast — confirmação que palette e toasts são integrados

### Seções inferidas dentro do palette
1. Navegação (Go to...)
2. Ações no contexto atual
3. Criar (issue, projeto, cycle, documento)
4. Busca global de conteúdo
5. Configurações
6. Temas

---

## 3. Atalhos de Teclado — Lista Completa

### Gerais
| Atalho | Ação |
|--------|------|
| `Cmd+K` | Abrir command menu |
| `Cmd+Enter` | Salvar/submeter |
| `Esc` | Voltar / limpar seleção |
| `Space` | Peek into issue (preview lateral) |
| `X` | Selecionar item em lista/board |
| `Cmd+A` | Selecionar todos |
| `Cmd+Opt+A` | Selecionar todos no grupo |
| `Shift+Click` | Seleção múltipla |
| `Arrows` / `J K H L` | Navegar entre items |
| `Cmd+Shift+C` | Copiar URL atual |
| `Cmd+I` | Abrir details sidebar |
| `Cmd+B` | Toggle list/board view |
| `?` | Abrir help center |
| `Opt+Shift+Q` | Logout |

### Navegação (G = Go to)
| Atalho | Destino |
|--------|---------|
| `G I` | Inbox |
| `G M` | My Issues |
| `G T` | Triage |
| `G A` | Active Issues |
| `G B` | Backlog |
| `G X` | Archived Issues |
| `G E` | All Issues |
| `G D` | Board |
| `G C` | Cycles |
| `G V` | Views |
| `G W` | Workspace |
| `G P` | Projects |
| `G R` | Roadmap |
| `G S` | Settings |

### Abrir painéis (O = Open)
| Atalho | Painel |
|--------|--------|
| `O F` | Favorites |
| `O P` | Projects |
| `O C` | Cycles |
| `O U` | Users |
| `O M` | Members |
| `O T` | Teams |
| `O R` | Roadmap |

### Issues — Criação e Edição
| Atalho | Ação |
|--------|------|
| `C` | Novo issue |
| `E` | Editar issue |
| `R` | Renomear |
| `A` | Atribuir a usuário |
| `I` | Atribuir a mim |
| `L` / `Shift+L` | Adicionar/remover label |
| `S` | Mudar status |
| `P` | Definir prioridade |
| `Shift+E` | Definir estimativa |
| `Ctrl+D` | Definir due date |
| `Ctrl+Shift+D` | Remover due date |
| `#` | Arquivar/restaurar |
| `Shift+S` | Subscrever |
| `Ctrl+Shift+S` | Gerenciar subscribers |
| `Ctrl+Shift+O` | Criar sub-issue |
| `Shift+C` | Adicionar a cycle |
| `Shift+P` | Adicionar a projeto |
| `Ctrl+M` | Comentar |
| `Ctrl+.` | Copiar issue ID |
| `Ctrl+Shift+.` | Copiar branch name |
| `Ctrl+Shift+,` | Copiar URL do issue |

### Relações entre Issues
| Atalho | Ação |
|--------|------|
| `M B` | Marcar como blocked |
| `M X` | Marcar como blocking |
| `M R` | Referenciar issue relacionado |

### Filtros
| Atalho | Ação |
|--------|------|
| `F` | Adicionar filtro |
| `Shift+F` | Limpar último filtro |
| `Alt+Shift+F` | Limpar todos filtros |
| `Shift+V` | Ver opções de view |

---

## 4. Density (Espaçamento e Tamanho)

- **Abordagem**: Linear não expõe density modes ao usuário (sem toggle comfortable/compact explícito) — a densidade é definida pela equipe de design
- **Filosofia**: "space-constrained sidebar" — testado entre "very condensed to more spacious configurations"
- **Element gap padrão**: 8px como unidade base
- **Tabs**: mais compactas após redesign de 2024, com `rounded corners` e ícones menores
- **Inbox redesenhado** (2024): "increased density coupled with enhanced contrast"
- **Ícones**: tamanho reduzido, sem backgrounds coloridos nos ícones de time

---

## 5. Empty States

- Linear usa empty states com orientação contextual — quando não há issues em uma view, exibe CTA para criar o primeiro
- **Padrão inferido**: ícone/ilustração + texto explicativo + botão de ação primária
- **Exemplos**: Inbox vazio → "You're all caught up", Backlog sem issues → "No issues yet" + botão "Create issue"
- Detalhes visuais exatos [a confirmar via acesso direto ao app]

---

## 6. Microinterações

- **Peek/Preview** (`Space`): abre painel lateral sem navegar para o issue — zero page load, animação slide-in
- **Toast com ação**: `Cmd+Opt+O` abre link do último toast — toasts são interativos, não apenas informativos
- **Drag visual em board**: cards com shadow elevada durante drag
- **Hover em sidebar**: botões de ação (+, ...) aparecem em hover nos items
- **Selection state**: `X` seleciona item com visual highlight; multi-select via Shift+Click
- **Focus mode**: `[` colapsa sidebar, maximizando área de conteúdo
- **Animações**: sem detalhes de timing exatos publicados, mas filosofia é "feel not seen" — transições sutis

---

## 7. Color Usage

- **Espaço de cor**: LCH (Lightness-Chroma-Hue) em vez de HSL — garante luminosidade perceptualmente uniforme
- **Tokens por tema**: apenas 3 variáveis — base color, accent color, contrast — em vez de 98 variáveis por tema antes
- **Dark mode padrão** (cor de fundo): Graphite `#0f1011` — "warmer gray, less saturated" que o anterior
- **Texto no dark**: Porcelain `#f7f8f8`
- **Accent**: cor de destaque única por workspace (customizável via theme generator)
- **Minimalismo de cor**: ícones sem backgrounds coloridos; cores usadas seletivamente para status e prioridade
- **Contraste aumentado** (2024): texto e ícones neutros mais escuros em light mode e mais claros em dark mode
- **Magic Blue**: tema nostálgico disponível via command menu

---

## 8. Typography

- **Famílias**:
  - `Inter Display` — headings, para "mais expressão mantendo legibilidade"
  - `Inter` (variável) — body text, labels, metadata
- **Letter spacing**:
  - Display: `-0.22px`
  - Body: `-0.11px`
- **Pesos usados**: Regular (400), Medium (500), Semibold (600) — inferido [a confirmar]
- **Escala**: não publicada oficialmente; baseada em Tailwind text-xs a text-xl inferido pelo visual

---

## 9. Modal/Dialog Patterns

- Modals para criação de issue (full-featured com campos inline)
- Modals de confirmação para ações destrutivas (deletar, arquivar em massa)
- **Focus trap**: foco fica dentro do modal enquanto aberto
- **Esc para fechar**: consistente em todos os modals
- **Sem backdrop blur pesado** — consistent com filosofia "structure felt, not seen"
- Detalhes de border-radius e shadow em modals [a confirmar via inspeção]

---

## 10. Toast / Notification Design

- Toasts posicionados bottom-right (padrão SaaS)
- **Duração**: auto-dismiss, curta (estimado 3-4s) [a confirmar]
- **Ação integrada**: toasts com link clicável (`Cmd+Opt+O` para abrir último)
- **Design**: compacto, sem ícone grande — texto + ação opcional
- Shadow: `rgba(0, 0, 0, 0.4) 0px 2px 4px 0px` — sutil e sharp

---

## 11. Bordas e Shadows

- **Filosofia**: "Structure should be felt not seen" — menos bordas visíveis, mais uso de background
- **Borders**: 1px, contraste suavizado — "rounding edges and softening contrast"
- **Border radius**: 6px para containers principais (Graphite background)
- **Shadows**: `rgba(0, 0, 0, 0.4) 0px 2px 4px 0px` — sharp e contido, sem diffuse shadows
- **Separators**: usados com moderação, substituídos por espaço em muitos casos
- **Elevação**: via subtle layering e background color difference, não por shadow forte

---

## 12. Dark Mode

- Dark mode como **modo primário de design** (filosofia da marca)
- Paleta renovada (2024): tons mais quentes, menos saturação de azul
- **LCH color system**: evita problemas de inconsistência de luminosidade perceptual
- **High contrast mode**: suportado via variável de contraste nos tokens
- Feature flags usados internamente para deploy gradual de mudanças de tema
- Custom themes disponíveis: 3 sliders (base, accent, contrast) geram tema completo

---

## Fontes

- [How we redesigned the Linear UI (part II)](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh)
- [Personalized sidebar changelog](https://linear.app/changelog/2024-12-18-personalized-sidebar)
- [New Linear UI changelog](https://linear.app/changelog/2024-03-20-new-linear-ui)
- [Display options docs](https://linear.app/docs/display-options)
- [Linear keyboard shortcuts — KeyCombiner](https://keycombiner.com/collections/linear/)
- [Linear App Cheat Sheet — ShortcutFoo](https://www.shortcutfoo.com/app/dojos/linear-app-mac/cheatsheet)
- [Linear design — LogRocket](https://blog.logrocket.com/ux-design/linear-design/)
- [Linear style design — Medium/Bootcamp](https://medium.com/design-bootcamp/the-rise-of-linear-style-design-origins-trends-and-techniques-4fd96aab7646)
- [Linear brand guidelines](https://linear.app/brand)
