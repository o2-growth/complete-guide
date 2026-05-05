# TickTick — Bibliotecas OSS e Clones Open-Source
**Data:** 2026-05-04 | **Pesquisa:** Claude Code (Sonnet 4.6)  
**Stack alvo do Oxy:** React + Vite + TypeScript + Tailwind + shadcn/ui

> Critérios de seleção: MIT ou Apache-2.0 (GPL excluído); TypeScript nativo ou suporte de qualidade; compatível com React 18+; ativamente mantido (último release < 18 meses de 2026-05-04).

---

## CATEGORIA 1 — Editor Rich Text com Slash Commands ("/" menu)

### 1.1 Plate.js

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/udecode/plate |
| **Stars** | ~16.2k |
| **Stack** | React + TypeScript (Slate.js internamente) |
| **Licença** | MIT |
| **Última atividade** | Ativa (2025) |

**O que cobre:**
- Editor rich text block-based (Notion-style)
- Slash command menu (`/`) com paleta extensível
- @mention de usuários com suggestions popup
- Headings, lists, checklists, code blocks, tables, images, dividers
- Integração nativa com **shadcn/ui** (há template `shadcn` oficial)
- AI autocompletion via plugin
- Colaboração em tempo real via Yjs [a confirmar disponibilidade pública]
- SSR e StrictMode suportados

**Como integrar no Oxy:**
Plate.js é a escolha mais alinhada à stack do Oxy (React + TS + shadcn). O editor de descrição de tarefa e o módulo de Notes seriam substituídos por um `<PlateEditor>` com plugins de slash command, mention, checklist e heading. O template `notion-like` do Plate.js fornece ~80% da UX desejada out of the box. O `/date` e `/assign` requerem plugins customizados que combinam o picker do Oxy com o sistema de suggestions do Plate.

**Integração estimada:** 2-3 dias para editor base + 2-4 dias por comando custom (`/date`, `/assign`, `/tag`).

---

### 1.2 Novel.sh

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/steven-tey/novel |
| **Stars** | ~16.2k |
| **Stack** | React/Next.js + TypeScript + Tiptap + Tailwind |
| **Licença** | Apache-2.0 |
| **Última atividade** | Ativa (2025) |

**O que cobre:**
- Notion-style WYSIWYG com slash menu (`/`) nativo
- AI autocompletion (OpenAI/Vercel AI SDK integrado)
- Bubble menu, drag handles
- Suporte a React, Svelte, Vue

**Como integrar no Oxy:**
Novel é mais opinativo que Plate.js (depende de Next.js para o demo, mas o pacote `novel` funciona com qualquer React). Ideal se o Oxy quiser AI autocompletion nativa na descrição de tarefas. Mais fácil de configurar inicialmente que Plate.js, mas menos customizável a longo prazo. Recomendado para protótipos rápidos ou se AI no editor for prioridade.

**Nota:** Apache-2.0 é compatível com uso comercial.

---

### 1.3 BlockNote

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/TypeCellOS/BlockNote |
| **Stars** | ~9.7k |
| **Stack** | React + TypeScript + ProseMirror + Tiptap |
| **Licença** | MPL-2.0 (core) + GPL-3.0 (pacotes XL/premium) |
| **Última atividade** | Ativa (2025) |

**O que cobre:**
- Block-based editor com drag-and-drop de blocos
- Slash menu nativo extensível
- Format toolbar, nested blocks, real-time collaboration (Yjs)
- Pacotes shadcn/Tailwind/Radix disponíveis
- Ariakit para acessibilidade

**Como integrar no Oxy:**
O core MPL-2.0 é adequado para uso comercial (obriga a publicar modificações do *arquivo modificado*, não da app inteira). O pacote ShadCN/Tailwind do BlockNote é o mais próximo do estilo visual do Oxy. Cuidado com os pacotes XL (AI, Collaboration) que são GPL-3.0 — usar apenas o core MPL-2.0.

**Decisão:** Entre Plate.js e BlockNote, para o Oxy o **Plate.js** é preferível por ter integração oficial com shadcn e licença MIT pura.

---

### 1.4 Tiptap + @tiptap/extension-mention + slash-tiptap

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/ueberdosis/tiptap |
| **Stars** | ~28k (tiptap core) |
| **Stack** | React/Vue/Svelte + TypeScript + ProseMirror |
| **Licença** | MIT (core) |
| **npm mention** | `@tiptap/extension-mention` |
| **npm slash** | `@harshtalks/slash-tiptap` |

**O que cobre:**
- Editor base (Tiptap) para todos os outros editores desta lista
- Extension `mention`: @mention com suggestions popup (362 projetos npm usando)
- Extension `slash-tiptap`: slash commands headless construídos sobre a Suggestion API
- Suporte completo a TypeScript, React 19, e React 18

**Como integrar no Oxy:**
Tiptap é o "motor" que alimenta Novel, Plate (parcialmente), e BlockNote. Usar Tiptap diretamente dá mais controle, mas exige mais configuração. A combinação `Tiptap + @tiptap/extension-mention + slash-tiptap` é a opção mais "barebones" — ideal se o Oxy quiser montar o editor do zero sem opiniões de frameworks maiores. Se usar Plate.js, o Tiptap é irrelevante (Plate usa Slate internamente).

---

## CATEGORIA 2 — Árvore Hierárquica / Folder Tree (sidebar de listas e subtarefas)

### 2.1 react-arborist

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/brimdata/react-arborist |
| **Stars** | ~3.6k |
| **Stack** | React + TypeScript |
| **Licença** | MIT |
| **Última atividade** | Ativa (v3.5.0) |

**O que cobre:**
- Tree view completo para React
- Drag-and-drop sorting entre nós
- Open/close de pastas
- Inline renaming (F2)
- Virtualização (performance com grandes listas)
- Keyboard navigation com ARIA
- Tree filtering
- Selection synchronization
- Controlled e uncontrolled modes
- Callbacks: onScroll, onActivate, onSelect, onMove, onRename

**Como integrar no Oxy:**
A sidebar do Oxy (listas e pastas como no TickTick) pode ser construída com react-arborist. Cada nó representa uma lista ou pasta. O drag-and-drop nativo elimina a necessidade de implementação manual. O inline renaming serve para renomear listas/pastas diretamente na sidebar. A virtualização garante performance mesmo com centenas de listas (uso enterprise). Estilização via CSS custom (headless).

**Integração estimada:** 1-2 dias para sidebar completa com DnD e rename.

---

### 2.2 react-complex-tree

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/lukasbach/react-complex-tree |
| **Stars** | ~1.3k |
| **Stack** | React + TypeScript |
| **Licença** | MIT |

**O que cobre:**
- Tree view não-opinado e acessível
- Multi-select nativo
- Drag-and-drop
- Renaming nativo (F2)
- ARIA completo
- Full TypeScript interfaces

**Como integrar no Oxy:**
Alternativa ao react-arborist com foco em acessibilidade. Preferir react-arborist pela maior comunidade e virtualização nativa.

---

## CATEGORIA 3 — Recorrência de Tarefas (Recurring Tasks)

### 3.1 rrule.js

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/jkbrzt/rrule |
| **Stars** | ~3.7k |
| **Stack** | TypeScript nativo (98.2% TS) |
| **Licença** | MIT [a confirmar — LICENSE file presente mas tipo não mencionado explicitamente nas fontes] |
| **npm** | `rrule` |

**O que cobre:**
- Parser e gerador de RRULE conforme RFC iCalendar
- Suporte completo: DAILY, WEEKLY, MONTHLY, YEARLY, custom intervals
- Ocorrências específicas: BYDAY, BYMONTHDAY, BYSETPOS (ex: "último dia do mês")
- Serialização para string RRULE e para linguagem natural ("every Monday and Wednesday")
- `RRuleSet` para combinar múltiplas regras e exclusões
- Timezone via Intl API
- TypeScript types incluídos nativamente

**Como integrar no Oxy:**
O rrule.js substitui qualquer lógica manual de recorrência. Para cada tarefa recorrente, armazena-se a string RRULE no banco (Supabase), e o rrule.js gera as ocorrências no cliente. O campo de recorrência do Oxy pode oferecer presets (diário, semanal, etc.) que internamente geram RRULEs. Isso garante paridade com TickTick e compatibilidade com export/import de iCalendar.

**Integração estimada:** 0.5-1 dia para recorrência básica; 2-3 dias para UI de custom recurrence.

---

## CATEGORIA 4 — Habit Tracker Visual (Heatmap)

### 4.1 react-activity-calendar

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/grubersjoe/react-activity-calendar |
| **Stars** | ~1k [a confirmar — número exato não coletado] |
| **Stack** | React + TypeScript |
| **Licença** | MIT |
| **npm** | `react-activity-calendar` |

**O que cobre:**
- Heatmap de atividade estilo GitHub contributions (calendário anual)
- Dados de entrada: array de `{date, count, level}` — agnóstico ao domínio
- Coloração customizável por level (0-4)
- Tooltips e acessibilidade
- Version 3 com API moderna

**Como integrar no Oxy:**
O Habit Tracker do Oxy pode usar este componente para o heatmap anual de cada hábito. Cada check-in de hábito é um data point. O componente é alimentado com o histórico de check-ins do Supabase. A visualização é idêntica ao GitHub Contributions, que usuários já conhecem.

---

### 4.2 react-calendar-heatmap

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/kevinsqi/react-calendar-heatmap |
| **Stars** | ~1.1k |
| **Stack** | React (sem TS nativo; typings disponíveis via `@types`) |
| **Licença** | MIT |
| **npm** | `react-calendar-heatmap` |
| **Downloads** | ~52k/semana |

**O que cobre:**
- SVG heatmap de calendário
- Simples, sem dependências pesadas
- Totalmente customizável via CSS

**Como integrar no Oxy:**
Alternativa mais simples ao react-activity-calendar. Preferir react-activity-calendar para TypeScript nativo e API mais moderna (v3).

---

### 4.3 shadcn Calendar Heatmap

| Campo | Valor |
|-------|-------|
| **URL** | https://allshadcn.com/tools/calendar-heatmap/ |
| **Stars** | ~111 |
| **Stack** | React + TypeScript + shadcn/ui + Tailwind |
| **Licença** | MIT (open-source) |

**O que cobre:**
- Heatmap estilo GitHub contributions construído sobre shadcn/ui
- Integração direta com a design system do Oxy
- Zero fricção de estilo (já usa Tailwind + Radix)

**Como integrar no Oxy:**
Por ser shadcn nativo, é a opção com **menor esforço de integração visual** para o Oxy. O número de stars é baixo (111) porque é novo, mas a abordagem shadcn garante consistência com o design system já adotado. Recomendado se a prioridade for velocidade de implementação.

---

## CATEGORIA 5 — Drag-and-Drop (Kanban, Eisenhower, Reordenação)

### 5.1 dnd-kit

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/clauderic/dnd-kit |
| **Stars** | ~17.1k |
| **Stack** | TypeScript + React/Vue/Svelte/Solid (framework-agnostic core) |
| **Licença** | MIT |
| **npm** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |

**O que cobre:**
- DnD performático para qualquer layout: listas, grids, Kanban, árvores, 2D
- Sensors: pointer, mouse, touch, keyboard
- Collision detection extensível
- Accessibility: ARIA e keyboard navigation nativas
- @dnd-kit/sortable: camada de alto nível para listas sortable
- Suporte a Tree view via composição (DEV.to tutorial confirma padrão tree+dnd-kit)

**Como integrar no Oxy:**
dnd-kit é o primitivo de DnD para:
1. **Kanban**: drag de cards entre colunas (SortableContext por coluna)
2. **Eisenhower Matrix**: drag entre 4 quadrantes (4 SortableContexts em grid 2x2)
3. **Lista de tarefas**: reordenar tarefas
4. **Sidebar de pastas/listas**: em conjunto com react-arborist ou sozinho
5. **Timeline**: mover barras de tempo (com delta de data calculado no onDragEnd)

**Integração estimada:** 1 dia para Kanban básico; 2-3 dias para Eisenhower + timeline DnD.

---

## CATEGORIA 6 — Calendar Avançado

### 6.1 react-big-calendar

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/jquense/react-big-calendar |
| **Stars** | ~8.5k |
| **Stack** | React + TypeScript (types via @types) |
| **Licença** | MIT |
| **Downloads** | ~450k/semana |

**O que cobre:**
- Calendar views: Month, Week, Day, Agenda
- Drag-and-drop de eventos (addon: `react-big-calendar/lib/addons/dragAndDrop`)
- Localização com date-fns, Day.js, Moment.js ou Globalize.js
- Resource view gratuito (diferencial vs. FullCalendar que cobra por isso)
- Flexbox moderno

**Como integrar no Oxy:**
O módulo Calendar do Oxy (visão mês/semana/dia de tarefas + eventos) pode ser montado com react-big-calendar. Events = tarefas com data+duração. Drag-and-drop de evento → update da due date no Supabase. A integração com Google Calendar ficaria na camada de dados (sync via API), não no componente visual.

**Limitação:** Sem Timeline/Gantt view nativo — usar frappe-gantt ou gantt-task-react para isso.

---

### 6.2 FullCalendar (React wrapper)

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/fullcalendar/fullcalendar-react |
| **Stars** | ~19k (repo principal) |
| **Stack** | React + TypeScript |
| **Licença** | MIT (core) — plugins premium requerem licença $480+/dev |
| **Downloads** | ~1M/semana |

**O que cobre:**
- Calendar views: Month, Week, Day, Agenda, Timeline, Resource
- DnD nativo (addon)
- Recurring events
- Time zone handling

**Como integrar no Oxy:**
FullCalendar tem mais features que react-big-calendar, mas os plugins mais avançados (Timeline, Resource) são premium ($$$). Para o Oxy, react-big-calendar é suficiente e sem custo. FullCalendar só vale se Timeline/Resource scheduling for crítico.

**Recomendação:** Usar **react-big-calendar** (MIT puro, sem planos pagos).

---

## CATEGORIA 7 — Timeline / Gantt

### 7.1 frappe-gantt

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/frappe/gantt |
| **Stars** | ~6k |
| **Stack** | JavaScript vanilla (sem React nativo — usar wrapper) |
| **Licença** | MIT |
| **React wrapper** | https://github.com/hustcc/gantt-for-react (260 stars) |

**O que cobre:**
- Gantt interativo moderno
- Views: Day, Week, Month, Quarter, Year
- Drag-and-drop de tarefas para ajustar datas
- Dependências entre tarefas
- Multilingual (ISO 639-1)
- Zero dependências externas

**Como integrar no Oxy:**
Para a Timeline View do Oxy (equivalente ao TickTick Timeline), usar o wrapper `gantt-for-react` ou `frappe-gantt-react`. Cada tarefa é um "bar" com start+end date. Subtarefas são barras aninhadas. O drag ajusta a `due_date` e `start_date` no Supabase via callback.

**Integração estimada:** 1-2 dias para integração básica + 1-2 dias para customização visual.

---

### 7.2 gantt-task-react

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/MaTeMaTuK/gantt-task-react |
| **Stars** | ~1.1k |
| **Stack** | React + TypeScript nativo (92.9% TS) |
| **Licença** | MIT |

**O que cobre:**
- Gantt chart React nativo com TypeScript
- Task dependencies e relacionamentos
- Views: Hour, Day, Week, Month, Year
- Drag-and-drop para ajustar datas e progresso
- Task list colapsável
- Tooltips e localização
- Event handlers: onSelect, onDelete, onDateChange, onProgressChange

**Como integrar no Oxy:**
Alternativa ao frappe-gantt com TypeScript nativo e sem wrapper necessário. Menor comunidade, mas melhor tipagem. Para o Oxy (React+TS), `gantt-task-react` pode ser mais simples de integrar que frappe-gantt+wrapper.

---

## CATEGORIA 8 — NLP de Datas (Quick Capture)

### 8.1 chrono-node *(já confirmado no Oxy)*

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/wanasit/chrono |
| **Stars** | ~5.2k |
| **Stack** | TypeScript nativo (98.2% TS) |
| **Licença** | MIT |
| **npm** | `chrono-node` |

**O que cobre:**
- Parser NLP de datas em texto livre
- Formatos suportados: relativos ("tomorrow", "next friday", "in 3 days"), absolutos ("Oct 30 2pm"), ranges ("Aug 17-19")
- Multilingual: EN, JA, FR, RU, NL, FI, UK + parcial (DE, ES, IT, PT, SV, ZH)
- Strict mode (apenas datas formais) e casual mode
- Customizável via Parsers e Refiners
- Timezone via Intl API

**Como integrar no Oxy:**
Já usado no Oxy conforme memória (chrono-node). Usar para o campo de quick-add (título da tarefa) e para o campo de busca (filtros por data em linguagem natural). Integrar com o módulo de Smart Recognition no título: palavras reconhecidas ficam highlight, ao salvar → preenche campo de data.

---

## CATEGORIA 9 — @Mention (fora de editor rich text)

### 9.1 react-mentions

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/signavio/react-mentions |
| **Stars** | ~2.7k |
| **Stack** | React (sem TS nativo — usar react-mentions-ts) |
| **Licença** | MIT (REUSE compliant) |
| **Última versão** | v4.4.10 (Jun 2023) |

**O que cobre:**
- `@mention` em textarea estilo Twitter/Facebook
- Múltiplos triggers customizáveis (@ para usuários, # para tags)
- Async data fetching para suggestions
- Renderização flexível via callbacks
- CSS modules e inline styles

**Como integrar no Oxy:**
Para campos de texto simples (não ricos), como a área de comentários de tarefas compartilhadas. Se o editor de comentários for um `<textarea>` básico, react-mentions é ideal. Se for um editor Plate.js, usar o plugin de Mention nativo do Plate.

**Alternativa TypeScript:** `react-mentions-ts` (fork com TS nativo e React 19 compatibility).

---

## CATEGORIA 10 — Pomodoro

> Não há biblioteca específica amplamente adotada para Pomodoro em React. O padrão é implementação custom. Referências:

| Opção | URL | Notas |
|-------|-----|-------|
| Custom hook | — | `usePomodoro()` com `useInterval` / `useTimer` de react-use |
| react-timer-hook | https://github.com/amrlabib/react-timer-hook | 800 stars, MIT, countdown + stopwatch hook |
| react-use (`useInterval`) | https://github.com/streamich/react-use | 40k stars, MIT, primitivos de timer |

**Recomendação para o Oxy:** Implementar Pomodoro como custom hook baseado em `react-timer-hook` (MIT, leve, countdown + stopwatch nativos). O white noise pode ser implementado com `<audio>` nativo + arquivo de áudio ou integração com API de áudio (Web Audio API).

---

## CLONES OPEN-SOURCE DO TICKTICK

| Repo | Stack | Stars | Status | Licença | Notas |
|------|-------|-------|--------|---------|-------|
| [andraandaru/ticktick](https://github.com/andraandaru/ticktick) | React+TS+Tailwind+HeadlessUI | 0 | Demo live (Vercel) | Não especificada | Clone simples, DnD com react-beautiful-dnd (deprecated) |
| [TickTick-Clone/TickTick-Frontend](https://github.com/TickTick-Clone) | HTML | N/D | 2 repos (Backend Java) | N/D | Muito básico, sem React |

> **Conclusão:** Não existem clones OSS de qualidade do TickTick em React+TS. O Oxy deve construir do zero usando as libs listadas acima em vez de forkar um clone.

---

## RESUMO: TOP 5 LIBS PARA PARIDADE COM TICKTICK

| Rank | Lib | Por que é prioritária | Stars | Esforço |
|------|-----|----------------------|-------|---------|
| 1 | **Plate.js** | Editor rico com slash commands + @mention + shadcn nativo — supera TickTick que não tem `/` commands | 16.2k | 3-7 dias |
| 2 | **dnd-kit** | Primitivo para Kanban + Eisenhower + reordenação — sem ele nenhuma dessas views funciona com DnD | 17.1k | 1-3 dias |
| 3 | **react-arborist** | Sidebar hierárquica Folder > List com DnD + rename inline — paridade com TickTick sidebar | 3.6k | 1-2 dias |
| 4 | **rrule.js** | Recorrência completa RRULE para tarefas recorrentes (paridade TickTick recurrence) | 3.7k | 0.5-3 dias |
| 5 | **react-big-calendar** | Calendar view Month/Week/Day com DnD — paridade com TickTick Calendar View | 8.5k | 2-4 dias |

---

## Fontes

- [GitHub — react-arborist](https://github.com/brimdata/react-arborist)
- [GitHub — react-complex-tree](https://github.com/lukasbach/react-complex-tree)
- [GitHub — novel](https://github.com/steven-tey/novel)
- [GitHub — plate](https://github.com/udecode/plate)
- [GitHub — BlockNote](https://github.com/TypeCellOS/BlockNote)
- [GitHub — dnd-kit](https://github.com/clauderic/dnd-kit)
- [GitHub — rrule.js](https://github.com/jkbrzt/rrule)
- [GitHub — react-calendar-heatmap](https://github.com/kevinsqi/react-calendar-heatmap)
- [GitHub — react-activity-calendar](https://github.com/grubersjoe/react-activity-calendar)
- [GitHub — react-big-calendar](https://github.com/jquense/react-big-calendar)
- [GitHub — fullcalendar-react](https://github.com/fullcalendar/fullcalendar-react)
- [GitHub — frappe/gantt](https://github.com/frappe/gantt)
- [GitHub — gantt-task-react](https://github.com/MaTeMaTuK/gantt-task-react)
- [GitHub — chrono](https://github.com/wanasit/chrono)
- [GitHub — react-mentions](https://github.com/signavio/react-mentions)
- [Tiptap — mention extension](https://tiptap.dev/docs/editor/extensions/nodes/mention)
- [Shadcn Calendar Heatmap](https://allshadcn.com/tools/calendar-heatmap/)
- [andraandaru/ticktick (clone)](https://github.com/andraandaru/ticktick)
- [npm trends comparison](https://npmtrends.com/react-accessible-treeview-vs-react-arborist-vs-react-checkbox-tree-vs-react-complex-tree-vs-react-simple-tree-menu-vs-react-tree-menu-vs-react-treeview)
