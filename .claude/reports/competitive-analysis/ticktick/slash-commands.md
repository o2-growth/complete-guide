# TickTick — Comandos Slash "/" e "@" 
**Data:** 2026-05-04 | **Pesquisa:** Claude Code (Sonnet 4.6)

> **CONCLUSÃO CENTRAL:** O TickTick **NÃO implementa um sistema de slash commands "/" estilo Notion** dentro do editor de descrição de tarefas. O sistema de inline commands do TickTick funciona no **título** da tarefa via Smart Recognition, não no corpo/descrição. Este documento cataloga o que existe, as limitações, e as implicações para o Oxy.

---

## 1. O QUE EXISTE NO TICKTICK (Smart Recognition — funciona no TÍTULO)

### Tokens inline no título da tarefa

| Token | Função | Exemplo | Escopo |
|-------|--------|---------|--------|
| `!1` ou `!high` | Define prioridade Alta (P3/High) | `Enviar relatório !1` | Título apenas |
| `!2` ou `!medium` | Define prioridade Média (P2/Medium) | `Revisar deck !2` | Título apenas |
| `!3` ou `!low` | Define prioridade Baixa (P1/Low) | `Ler artigo !3` | Título apenas |
| `#tag` | Adiciona tag | `Deploy #trabalho` | Título apenas |
| `~lista` | Atribui à lista | `Reunião ~Marketing` | Título apenas |
| Data/hora natural | Define due date | `Dentista amanhã às 15h` | Título apenas |
| Data absoluta | Define due date | `Entregar Oct 30 2pm` | Título apenas |
| Frases relativas | Define due date | `Call next friday at 4pm` | Título apenas |

> **Como funciona:** Ao digitar, o TickTick detecta e destaca em azul os tokens reconhecidos. Ao salvar, o token é **removido do título** e aplicado ao campo correspondente. O usuário pode tocar na palavra destacada para reverter para texto puro (sem remover do título).

### Resumo do comportamento

- Ação: reconhecimento automático, sem menu popup
- Trigger: qualquer digitação no campo de título
- Resultado: token vira campo da tarefa (removido do título)
- Configurável: pode ser desativado nas configurações (Smart Recognition On/Off)

---

## 2. COMANDOS "@" — Mencionar membros

| Token | Função | Exemplo | Escopo |
|-------|--------|---------|--------|
| `@nome` | Menciona membro em **comentários** | `@Ana pode verificar?` | Comentários em listas compartilhadas |

> **Limitação:** `@mention` só funciona em **comentários** de tarefas em listas compartilhadas. Não funciona no título, descrição, ou notas.

---

## 3. O QUE NÃO EXISTE NO TICKTICK (gaps vs. Notion / Linear / Ekyte)

O TickTick **não tem** os seguintes comandos que apps modernos implementam:

| Comando esperado | Função | Tem no TickTick? |
|-----------------|--------|-----------------|
| `/date` | Inserir/set data inline na descrição | ❌ Não |
| `/assign` | Atribuir tarefa inline na descrição | ❌ Não |
| `/priority` | Definir prioridade inline na descrição | ❌ Não |
| `/reminder` | Adicionar lembrete inline na descrição | ❌ Não |
| `/tag` | Adicionar tag inline na descrição | ❌ Não |
| `/heading1`, `/h1` | Inserir bloco H1 | ❌ Não |
| `/code` | Inserir bloco de código | ❌ Não |
| `/image` | Inserir imagem inline | ❌ Não |
| `/table` | Inserir tabela | ❌ Não |
| `/divider` | Inserir divisor | ❌ Não |
| `/mention` | Menu de @mention | ❌ Não |
| `/list` | Inserir lista numerada/bullets | ❌ Não (só Markdown manual) |
| `/checklist` | Inserir checklist | ❌ Não (só Markdown manual) |
| `/embed` | Embedar link/preview | ❌ Não |

---

## 4. O QUE O TICKTICK USA NA DESCRIÇÃO

A descrição de tarefa e o módulo Notes suportam **Markdown textual puro** (sem menu interativo):

```markdown
**negrito**
_itálico_
~~tachado~~
`código inline`
# Heading 1
## Heading 2
- lista
1. numerada
- [ ] checklist
- [x] feito
[link](https://url.com)
> blockquote
```

> Não há preview em tempo real ao editar [a confirmar: se há modo preview vs. edit], e não há `/` menu popup. O usuário digita Markdown bruto e vê renderizado ao sair do campo.

---

## 5. IMPLICAÇÃO PARA O OXY GROWTH OS

### Oportunidade de diferenciação

O Oxy pode **superar o TickTick** implementando um sistema de slash commands real na descrição de tarefas. Isso é uma vantagem competitiva direta.

### Comandos "/" recomendados para o Oxy

| Comando | Função | Lib sugerida |
|---------|--------|-------------|
| `/date` | Picker de data inline | Plate.js + chrono-node |
| `/assign` | Picker de membro | Plate.js Mention |
| `/priority` | Seletor de prioridade | Plate.js custom block |
| `/reminder` | Configurar lembrete | Plate.js custom |
| `/tag` | Picker de tags | Plate.js Mention |
| `/h1`, `/h2`, `/h3` | Headings | Plate.js Heading |
| `/code` | Code block | Plate.js Code Block |
| `/checklist` | Checklist block | Plate.js Checkbox |
| `/table` | Tabela | Plate.js Table |
| `/divider` | Linha horizontal | Plate.js HR |
| `/image` | Upload de imagem | Plate.js Image |
| `/mention` | @mention de membro | Plate.js Mention |
| `/list` | Lista de bullets | Plate.js List |

### Comandos "@" recomendados para o Oxy

| Token | Função |
|-------|--------|
| `@membro` | Mencionar e notificar membro (qualquer campo) |
| `@hoje`, `@amanhã` | Atalho de data rápida |
| `@tag-name` | Adicionar tag inline |

---

## 6. REFERÊNCIAS DE IMPLEMENTAÇÃO

### Como o TickTick implementa Smart Recognition (referência de UX)

O sistema de Smart Recognition do TickTick no título de tarefa é o mais próximo de "inline commands" que eles têm. A UX é:
1. Usuário digita título livremente
2. Palavras reconhecidas ficam azul-highlight
3. Ao salvar: keyword é consumida → campo correspondente é preenchido
4. Usuário pode clicar na palavra azul para "unconsumir" (voltar ao texto)

Isso é diferente de slash commands: não há menu popup, não há autocomplete de opções, é pure pattern matching no texto.

### Como implementar no Oxy (com Plate.js)

```tsx
// Exemplo conceitual — Plate.js slash command plugin
import { createSlashPlugin } from '@udecode/plate-slash-command';

const plugins = [
  createSlashPlugin({
    trigger: '/',
    items: [
      { key: 'date', icon: '📅', title: 'Data', description: 'Definir data de vencimento' },
      { key: 'assign', icon: '👤', title: 'Atribuir', description: 'Atribuir a membro' },
      { key: 'priority', icon: '🔴', title: 'Prioridade', description: 'Definir prioridade' },
      { key: 'tag', icon: '🏷️', title: 'Tag', description: 'Adicionar tag' },
      { key: 'reminder', icon: '🔔', title: 'Lembrete', description: 'Adicionar lembrete' },
      // ... blocos de conteúdo padrão
    ],
  }),
];
```

---

## Fontes

- [TickTick Smart Recognition — help.ticktick.com](https://help.ticktick.com/articles/7081924556310446080)
- [Task Details and Editing — help.ticktick.com](https://help.ticktick.com/articles/7055782408586526720)
- [TickTick Markdown Quick Start — blog.ticktick.com](https://blog.ticktick.com/2019/11/15/ticktick-markdown-quick-start/)
- [Comment on a task — support.ticktick.com](https://support.ticktick.com/hc/en-us/articles/360016490091-Comment-on-a-task)
- [Notes and Summary — help.ticktick.com](https://help.ticktick.com/articles/7055780476358754304)
- [Tiptap Slash Commands — tiptap.dev](https://tiptap.dev/docs/examples/experiments/slash-commands)
- [Plate.js — platejs.org](https://platejs.org/)
- [Novel.sh slash commands — novel.sh](https://novel.sh/docs/guides/tailwind/slash-command)
