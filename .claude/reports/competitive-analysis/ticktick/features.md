# TickTick — Catálogo Completo de Features
**Data:** 2026-05-04 | **Pesquisa:** Claude Code (Sonnet 4.6) | **Propósito:** Análise competitiva Oxy Growth OS

> Fontes primárias: ticktick.com/features, help.ticktick.com, blog.ticktick.com, reviews externos (Zapier, CRM.org, upbase.io, 2sync.com, Nathan Ojaokomo Review). Itens `[a confirmar]` não foram confirmados em fonte primária.

---

## 1. ESTRUTURA E ORGANIZAÇÃO

### Inbox
- Ponto central de captura rápida sem lista definida (metodologia GTD)
- Atalho dedicado: `Ctrl+Alt+1` (desktop)
- Sincroniza em tempo real entre todos os dispositivos

### Listas
- Free: até **9 listas**, 99 tarefas por lista, 19 subtarefas
- Premium: até **299 listas**, 999 tarefas por lista, 199 subtarefas
- Cada lista tem: nome, cor customizável, ícone, background de imagem
- Podem ser compartilhadas (Free: 1 membro/lista; Premium: até 29 membros/lista)
- Pode converter entre modo List e modo Kanban por lista

### Pastas (Folders)
- Agrupam múltiplas listas em hierarquia de um nível
- Drag-and-drop para reorganizar listas dentro de pastas
- Collapse/expand na sidebar
- [a confirmar] Sem limite documentado de pastas no Premium

### Tags
- Criação livre com `#tag` durante entrada de texto (Smart Recognition)
- Cores customizáveis por tag
- Usadas em filtros de Smart Lists
- Não há hierarquia de tags (planas)

### Smart Lists (Listas Inteligentes)
- **Built-in pré-definidas** (não deletáveis, não editáveis):
  - **Today** — tarefas com due date = hoje + overdue
  - **Tomorrow** — tarefas com due date = amanhã
  - **Next 7 Days** — tarefas dentro de 7 dias
  - **Inbox** — tarefas sem lista atribuída
  - **Assigned to Me** — tarefas em listas compartilhadas atribuídas ao usuário
  - **All** — todas as tarefas (exceto concluídas)
- **Custom Smart Lists (Premium):**
  - Filtros em modo Normal: selecionar por Lista, Tag, Prioridade, Data, Assignee
  - Filtros em modo Avançado: múltiplos statements com operadores `AND`/`OR`
  - Campos filtraveis: Nome da lista, Tag, Data (hoje/amanhã/7 dias/30 dias/data específica/sem data), Prioridade (P0-P3), Assignee, Keyword
  - Criação ilimitada (Premium)

### Pinned Items
- Tarefas individuais podem ser fixadas no topo da lista [a confirmar] via menu `...`
- Itens fixados permanecem visíveis independente de ordenação

---

## 2. CAMPOS E EDIÇÃO DE TAREFA

### Campos disponíveis por tarefa
| Campo | Tipo | Free/Premium |
|-------|------|-------------|
| Título | texto com Smart Recognition | Free |
| Lista (projeto) | seletor | Free |
| Data de início | date/time picker | Premium |
| Data de vencimento | date/time picker | Free |
| Lembretes | múltiplos (até 5), absolute e relative | Free (1); Premium (ilimitados) |
| Prioridade | P0=None, P1=Low, P2=Medium, P3=High | Free |
| Repetição | presets + custom RRULE-style | Free |
| Estimativa (duração) | minutos/horas | Premium |
| Estimativa Pomodoros | número de pomodoros | Premium |
| Tags | múltiplas via `#` | Free |
| Assignee | membro da lista compartilhada | Premium |
| Descrição/Notas | rich text com Markdown | Free |
| Checklist | itens marcáveis dentro da tarefa | Free |
| Subtarefas | até **5 níveis** de aninhamento | Free (limite: 19); Premium (199) |
| Anexos | imagens, áudio, vídeo, arquivos genéricos | Free (10MB/item, 5 itens); Premium (20MB/item, 20 itens) |
| Progresso (status bar) | percentual 0-100% via slider | Free |
| Countdown | alterna exibição: data vs. dias restantes | Free |
| Task Link | URL única copiável para linkar entre tarefas | Free |

### Smart Recognition (inline no título)
Ao digitar o título de uma tarefa, o TickTick reconhece automaticamente:
- **Datas/horas** em linguagem natural: "tomorrow at 3pm", "next friday", "Oct 30 2pm"
- **`!`** → define prioridade (ex: `!1`=high, `!2`=medium, `!3`=low)
- **`#tag`** → adiciona tag
- **`~lista`** → atribui à lista (tilde + nome da lista)
- Palavras reconhecidas ficam destacadas em azul; tocar nelas reverte para texto puro
- Configurável (pode desativar Smart Recognition por campo)

### Comandos slash "/" e "@" em descrição de tarefa
> Atenção: TickTick NÃO implementa um sistema de slash commands estilo Notion na descrição de tarefas. A descrição suporta Markdown textual, mas sem menu "/" interativo.

**O que existe:**
- Markdown na descrição: `**bold**`, `_italic_`, `# heading`, `` `code` ``, `- lista`, `- [ ] checklist`, links
- `@mention` de membros em **comentários** de tarefas compartilhadas (dispara notificação)
- Smart Recognition funciona no **título**, não na descrição

**O que NÃO existe (gap para o Oxy):**
- Nenhum menu `/` inline com paleta de comandos na descrição
- Nenhum bloco estruturado (não é block-based como Notion)
- Sem `/date`, `/assign`, `/priority` inline na descrição

### Repetição / Recorrência
- Presets: Diariamente, Semanalmente, Mensalmente, Anualmente, Dias úteis
- Custom: dias específicos da semana, intervalos customizados, último dia do mês, datas especiais
- **Repeat Type** (customizável):
  - `Based on due date` — próxima ocorrência calculada a partir da data original
  - `Based on completion date` — próxima ocorrência calculada a partir do dia que completou
- **Repeat Ends**: nunca / após N ocorrências / em data específica
- Internamente usa RRULE (confirmado via API)

### Comentários
- Disponível apenas em tarefas de **listas compartilhadas**
- `@mention` de membros nos comentários
- Suporte a texto básico [a confirmar: Markdown em comentários]
- Histórico de atividades da tarefa (quem criou, editou, completou)

---

## 3. SUBTAREFAS (MULTILEVEL TASKS)

- Aninhamento de até **5 níveis** de profundidade
- Cada subtarefa tem todos os mesmos campos de uma tarefa normal:
  - Due date, start date, priority, tags, assignee, reminders, repeat, attachments, description
- Subtarefas aparecem na Timeline View (podem ter duração e datas)
- Drag-and-drop para reordenar e reanexar subtarefas
- Subtarefas deletadas vão para a **Trash** (recuperáveis)
- Ao completar tarefa-pai, opção de completar subtarefas juntas [a confirmar comportamento exato]
- Progress da tarefa-pai não é automático (manual via status bar)

---

## 4. VISUALIZAÇÕES

### List View
- Three-column layout: sidebar (listas) | task list | task detail
- Ordenação: por due date, prioridade, título, data de criação, manual (drag)
- Agrupar por: lista, tag, prioridade, data
- "View by Day" na Today list — mostra tarefas agrupadas por dia

### Kanban View (Premium)
- Disponível por lista (cada lista tem seu próprio Kanban)
- Colunas customizáveis: nome, cor, limite de itens [a confirmar WIP limits]
- Presets de colunas: "To Do", "In Progress", "Review", "Complete"
- Drag-and-drop de cards entre colunas
- Cards mostram: título, data, prioridade, assignee, checklist progress

### Calendar View (Premium)
- Sub-views: **Yearly**, **Monthly**, **3-Day**, **Weekly**, **Agenda**, **Multi-Week**, **Multi-Day**
- Drag-and-drop de tarefas entre datas no calendário
- Tasks e eventos do Google/Outlook lado a lado
- Criação de tarefas diretamente no calendário (click em slot vazio)
- Color-coding: por cor da Lista, cor da Tag, ou cor da Prioridade (configurável)
- "Hide time slots" para ocultar horas 0-7 e 21-24

### Timeline View (Premium)
- Visualização tipo Gantt leve
- Mostra tarefas com duração (start date → due date) como barras horizontais
- Drag-and-drop para ajustar datas e duração das barras
- Subtarefas visíveis e arrastáveis individualmente
- Adequado para gestão de projetos simples (não é Gantt completo com dependências)

### Eisenhower Matrix (Premium)
- Quatro quadrantes: Urgente+Importante / Não-urgente+Importante / Urgente+Não-importante / Não-urgente+Não-importante
- Drag-and-drop de tarefas entre quadrantes
- Usa prioridade TickTick (High=urgente+importante por padrão) [a confirmar mapeamento exato]
- Tarefas sem prioridade ficam em quadrante "inbox" [a confirmar]

### Habit Tracker View
- Seção separada da app (não é lista de tarefas)
- Visualização de hábitos em grade: hábitos × dias da semana/mês
- Coloração por status: feito / não feito / não aplicável
- Streak atual e total visível por hábito
- Heatmap visual similar ao GitHub contributions [a confirmar: heatmap anual vs. mensal]

### Pomodoro/Focus View
- Timer de countdown (25 min padrão, customizável)
- Modo Stopwatch (conta-crescente, alternativa ao Pomodoro)
- Vinculado a tarefa específica ou avulso
- White noise simultâneo durante o timer
- Estatísticas de foco por dia/semana

---

## 5. QUICK CAPTURE

### Natural Language Processing (NLP)
- Reconhecimento automático de data/hora no título
- Exemplos: "Go to library Oct 30 2 pm", "dentist tomorrow at 4pm", "submit report next friday"
- Suporta formatos relativos ("in 3 days", "next week") e absolutos
- Funciona via voz (Voice Input) nas versões mobile

### Widgets (iOS e Android)
- Widget de tarefas: Today list com checkboxes interativos
- Widget de calendário: visão do dia com eventos e tarefas
- Widget de hábitos: status de hábitos do dia
- iOS 14+: widgets interativos (marcar como concluído sem abrir o app)
- macOS: widget para Notification Center

### Atalho global desktop
- `Ctrl+Shift+A` (Windows) / `Cmd+Shift+A` (Mac): Quick Add Bar — adiciona tarefa sem abrir o app
- Mini window flutuante com funcionalidade completa: `Ctrl+Shift+L`

### Browser Extensions
- Chrome, Firefox, Safari
- Right-click em qualquer página: "Add to TickTick"
- Salvar links como tarefas com título pré-preenchido

### Share Extension (Mobile)
- iOS e Android: share sheet para criar tarefa com conteúdo compartilhado

### Email-to-Task
- Gmail integration (via Gmail add-on)
- Spark email client integration
- [a confirmar] Endereço de email dedicado para criação de tarefas

### Integrações de voz
- **Siri** (iOS/macOS): "Hey Siri, add to TickTick..."
- **Alexa**: invocar por "Tick Tick" — adicionar, ler, listar tarefas
- **Google Assistant**: [a confirmar]

---

## 6. POMODORO / FOCUS

### Timer
- Duração padrão: 25 minutos de foco, 5 minutos de pausa curta, 15 minutos de pausa longa
- Todos os intervalos customizáveis
- Pausa permitida (até 3 vezes por sessão no modo Pomo)
- Modo alternativo: **Stopwatch** (conta tempo crescente, pausável/retomável)
- Pode mudar modo sem perder o progresso

### White Noise
- Disponível simultaneamente com o timer
- **Free**: apenas som de relógio (clock tick)
- **Premium (17 variedades confirmadas):** Rain, Wind, Cafe (conversas), Storm, Lava, Biscuit, Forest, Morning, Whale, Chewing, Fries, e outros [a confirmar lista completa dos 17]
- Apenas um white noise por vez
- Sons renovados com qualidade melhorada em 2020

### Estatísticas de Foco
- Total de Pomodoros concluídos (dia/semana/histórico)
- Total de horas focadas
- Comparação dia-a-dia e semana-a-semana
- Gráfico de alocação de tempo por Lista e por Tag
- "Focus Goal Completion Rate" em gráfico de pizza
- "Most focused moments" (horários do dia mais produtivos)
- Integração com **Apple Health** (mindfulness minutes)

### Estimativa por Tarefa (Premium)
- Campo "Estimated Duration" em horas/minutos
- Campo "Estimated Pomodoros" em número de pomódoros
- Comparação ao final: estimado vs. real

---

## 7. HABIT TRACKER

### Criação de Hábito
- Nome, ícone (emoji, letra, ou ícone da galeria), cor
- **Habit Gallery**: mais de **60 hábitos pré-definidos** categorizados em Life, Health, Sports, Mindset
- Hábitos customizados livres

### Frequência
- **Diária** (todos os dias)
- **Semanal** com dias específicos (ex: Segunda, Quarta, Sexta)
- **Intervalo** (a cada N dias)
- Meta de frequência configurável (ex: "5 de 7 dias" como sucesso na semana)

### Check-in
- "Achieved" (simples)
- "Unachieved" — registrar o que foi perdido e quando
- **Cumulative check-in**: swipe + `+` para registrar múltiplos no mesmo dia (ex: beber 8 copos d'água)
- "Achieve it all" toggle: todos os check-ins de uma vez
- Emoticons/logs opcionais ao fazer check-in

### Estatísticas
- **Streak atual** e **melhor streak** (alternáveis com toque)
- **Total de dias** completados
- Visualização semanal (grade hábito × dia da semana)
- Filtro por período: Week / Month / Record (histórico completo)
- Imagem de progresso compartilhável (shareable progress card)

### Lembretes de Hábito
- Reminders diários configuráveis por hábito [a confirmar se múltiplos lembretes/hábito]

---

## 8. EISENHOWER MATRIX

- Quatro quadrantes (2×2): urgent × important
- Drag-and-drop entre quadrantes para repriorizar
- Automação: prioridade "High" do TickTick → quadrante Urgent+Important [a confirmar mapeamento]
- Tarefas aparecem em todos os quadrantes ao mesmo tempo que nas listas
- Disponível como view separada (tab na sidebar)
- **Premium only**

---

## 9. CALENDAR

### Views disponíveis
- Yearly (anual), Monthly (mensal), Weekly (semanal), 3-Day, Day, Agenda, Multi-Week, Multi-Day
- Acesso rápido: `Ctrl+Alt+C` (desktop)

### Integração Google Calendar (Premium)
- **Subscribe**: Google Calendar puxa dados do TickTick (one-way: TickTick → GCal)
- **Two-way sync** (atualização 2025): tarefas TickTick ↔ eventos Google Calendar bidirecionalmente
- Eventos do Google Calendar aparecem no TickTick Calendar View lado a lado com tarefas

### Integração Outlook Calendar (Premium)
- Subscribe via iCal/CalDAV [a confirmar two-way sync com Outlook]
- Outlook Calendar visível dentro do TickTick

### Funcionalidades do Calendar
- Criar tarefas clicando em qualquer slot de horário
- Drag-and-drop para mover/reagendar tarefas
- Drag para baixo em um dia: cria schedule de múltiplas tarefas rapidamente
- Ocultar slots de hora (0-7h e 21-24h configuráveis)
- "Hide Calendar Time Slots" para foco em horário comercial
- Cor por Lista / Tag / Prioridade (alternável)
- "Do Not Disturb" mode por calendário (silencia notificações de calendários específicos)
- Tasks com start + end date mostradas como blocos de duração no calendário

---

## 10. COLABORAÇÃO

### Compartilhamento de Lista
- Free: **1 colaborador** por lista
- Premium: até **29 colaboradores** por lista
- Permissões: can edit / view only [a confirmar granularidade]

### Atribuição de Tarefas
- Qualquer membro pode ser assignee de uma tarefa
- Notificação ao assignee
- Smart List "Assigned to Me" mostra tarefas atribuídas ao usuário logado

### Comentários
- Texto em tarefas de listas compartilhadas
- `@mention` de membros nos comentários (notificação push)
- Histórico de atividades: criação, edição, conclusão com timestamp e autor

### Activity Log
- Desktop: "Check List Activities" e "Check Task Activities" (Premium)
- Rastreia todas as modificações com autor e data

---

## 11. INTEGRAÇÕES EXTERNAS

| Integração | Tipo | Notas |
|-----------|------|-------|
| Google Calendar | Two-way sync | Premium; atualizado 2025 |
| Outlook Calendar | Subscribe (one-way) | Premium |
| Gmail | Add-on | Email → task com 1 clique |
| Spark Mail | Integração nativa | Email → task |
| Alexa (Amazon) | Voice integration | Adicionar/ler tarefas |
| Siri (Apple) | Atalho de voz | iOS/macOS |
| Zapier | Automação | Conecta com 5000+ apps |
| IFTTT | Automação | Triggers e ações |
| Notion | Integração oficial | [a confirmar escopo] |
| Slack | Via Zapier | [a confirmar integração nativa] |
| Google Assistant | [a confirmar] | |

---

## 12. ATALHOS DE TECLADO (RESUMO — ver keyboard-shortcuts.md para lista completa)

- `Ctrl+Shift+A` / `Cmd+Shift+A` — Quick Add global
- `Ctrl+N` — Nova tarefa
- `Ctrl+D` — Set date
- `Ctrl+Shift+M` — Completar tarefa
- `Ctrl+Shift+P` — Iniciar/abandonar Pomodoro

---

## 13. MULTI-CONTA E WORKSPACES

- TickTick suporta **uma conta por login** (sem multi-workspace nativo)
- Para equipes, o modelo é via listas compartilhadas, não workspaces separados
- Não há conceito de "organização" ou "workspace" como no Notion/Linear/Todoist Teams
- [a confirmar] Ausência de SSO, SAML, ou planos enterprise

---

## 14. FEATURES PREMIUM vs. FREE

### Free
- 9 listas / 99 tarefas / 19 subtarefas
- 1 colaborador por lista
- 1 reminder por tarefa
- Calendar view: NÃO
- Kanban view: NÃO
- Smart Lists customizadas: NÃO
- White noise: apenas relógio
- Timeline view: NÃO
- Eisenhower Matrix: NÃO (ou apenas view básica [a confirmar])
- Estatísticas históricas: NÃO
- Estimativa de duração/pomodoros: NÃO
- Themes premium: NÃO

### Premium ($35.99/ano)
- 299 listas / 999 tarefas / 199 subtarefas
- 29 colaboradores por lista
- Reminders ilimitados por tarefa
- Calendar view (todas as sub-views)
- Kanban view
- Smart Lists customizadas (ilimitadas)
- 17 white noises
- Timeline view
- Eisenhower Matrix completo
- Estatísticas históricas (foco, hábitos)
- Start date + task duration
- Custom themes (40+)
- Background personalizado por lista
- Attachments 20MB/20 por tarefa
- Calendar subscriptions de terceiros

---

## 15. FEATURES ÚNICAS / KILLER FEATURES

1. **Tudo em um app** — Tasks + Calendar + Kanban + Timeline + Eisenhower + Pomodoro + Habit Tracker + White Noise integrados nativamente (sem plugins ou apps externos)
2. **Pomodoro com white noise integrado** — 17 tipos de sons, estatísticas de foco vinculadas às tarefas
3. **Habit Tracker com heatmap** — Streaks, metas de frequência, check-in cumulativo, shareable progress
4. **Eisenhower Matrix com drag-and-drop** — Repriorização visual de urgência × importância
5. **Smart Recognition inline** — `!`, `#`, `~` no título + NLP de data/hora sem abrir menus
6. **Plan Your Day** — Revisão guiada tarefa por tarefa das overdue + hoje (reschedule, completar ou deletar)
7. **Status Bar de Progresso** — Percentual 0-100% por gesto em qualquer tarefa
8. **Subtarefas 5 níveis com campos completos** — Cada subtarefa tem data, assignee, reminder, etc.
9. **Timeline View drag-and-drop** — Gantt leve com subtarefas arrastáveis
10. **Two-way Google Calendar sync** — Integração bidirecional (2025)
11. **Suggested Tasks (AI algorítmico, 2025)** — Sugestões baseadas em padrões de criação e reagendamento
12. **Task Summary/Report** — Auto-geração de relatório filtrável de tarefas concluídas/pendentes
13. **Countdown Mode** — Alterna exibição de "data" para "dias restantes" com um toque
14. **Time Zone Travel mode** — Fixed vs. Floating timezone para viagens
15. **Repeat Type: based on completion** — Recorrência a partir do dia de conclusão (não data fixa)

---

## 16. PLATAFORMAS

- **Mobile**: iOS, Android (widgets, share extension, Siri/voice)
- **Desktop**: macOS, Windows (atalho global, mini window flutuante)
- **Web**: app.ticktick.com
- **Browser Extensions**: Chrome, Firefox, Safari
- **Wearables**: Apple Watch [a confirmar Android Wear]
- Total: **10+ plataformas** com sync em tempo real

---

## 17. GAPS DO OXY vs. TICKTICK (features que faltam ou TickTick faz melhor)

| Feature | TickTick | Oxy Growth OS | Gap |
|---------|----------|--------------|-----|
| Pomodoro integrado | ✅ Completo + white noise + stats | ❌ | Alto |
| Habit Tracker | ✅ 60+ hábitos, streaks, heatmap | ❌ | Alto |
| Eisenhower Matrix view | ✅ Drag entre quadrantes | ❌ | Médio |
| Timeline/Gantt leve | ✅ Drag-and-drop | ❌ | Médio |
| Smart Lists com filtros AND/OR | ✅ Premium | Básico | Médio |
| Plan Your Day (daily review guided) | ✅ | ❌ | Médio |
| Status bar de progresso % | ✅ | ❌ | Baixo |
| Subtarefas 5 níveis com todos os campos | ✅ | [a confirmar] | Médio |
| Two-way Google Calendar sync | ✅ 2025 | ❌ | Alto |
| Suggested Tasks (AI) | ✅ 2025 | ❌ | Médio |
| White noise 17 tipos | ✅ | ❌ | Baixo |
| Countdown mode (dias restantes) | ✅ | ❌ | Baixo |
| Task Summary/Report gerado | ✅ | ❌ | Médio |
| Widgets iOS/Android interativos | ✅ | N/A web-first | N/A |
| Slash commands "/" no editor | ❌ (TickTick não tem!) | pode ter | Oxy > TickTick |

---

## Fontes

- [TickTick Features Page](https://ticktick.com/features?language=en_us)
- [20 Lesser-Known TickTick Features](https://blog.ticktick.com/2020/12/08/20-lesser-known-ticktick-features/)
- [TickTick vs Todoist — 2sync](https://2sync.com/blog/ticktick-vs-todoist)
- [TickTick vs Todoist — Zapier](https://zapier.com/blog/ticktick-vs-todoist/)
- [TickTick Review — CRM.org](https://crm.org/news/ticktick-review)
- [TickTick Review 2025 — upbase.io](https://upbase.io/blog/ticktick-review/)
- [Nathan Ojaokomo TickTick Review](https://nathanojaokomo.com/blog/ticktick-review)
- [TickTick Premium 101 — Medium](https://ticktickteam.medium.com/ticktick-premium-101-61323801b037)
- [TickTick Focus Feature Blog](https://blog.ticktick.com/2020/05/06/brand-new-focus-experience-ticktick/)
- [TickTick Habit Evolution Blog](https://blog.ticktick.com/2020/05/22/a-healthier-life-with-ticktick-habit/)
- [TickTick Smart Recognition](https://help.ticktick.com/articles/7081924556310446080)
- [Multilevel Tasks Help](https://help.ticktick.com/articles/7055782219767349248)
- [Task Linking Blog (task links)](https://blog.ticktick.com/2020/12/08/20-lesser-known-ticktick-features/)
- [EverybodyWiki TickTick](https://en.everybodywiki.com/TickTick)
- [TickTick Suggested Tasks — 2sync](https://2sync.com/blog/ticktick-vs-todoist)
