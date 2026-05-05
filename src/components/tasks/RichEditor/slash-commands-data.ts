import type { SlashCommandItem } from "./SlashCommandList";
import { dispatchSlashCommand } from "./commands/command-bus";

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    id: "h2",
    title: "Título",
    description: "Cabeçalho médio",
    keywords: ["heading", "titulo", "h2"],
    icon: "Heading2",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
  },
  {
    id: "h3",
    title: "Subtítulo",
    description: "Cabeçalho pequeno",
    keywords: ["heading", "subtitulo", "h3"],
    icon: "Heading3",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
  },
  {
    id: "bullet",
    title: "Lista",
    description: "Lista com marcadores",
    keywords: ["list", "lista", "bullet"],
    icon: "List",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    id: "ordered",
    title: "Lista numerada",
    description: "Lista 1. 2. 3.",
    keywords: ["ordered", "numero", "numerada"],
    icon: "ListOrdered",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    id: "checklist",
    title: "Checklist",
    description: "Lista de tarefas",
    keywords: ["task", "checklist", "tarefa", "todo"],
    icon: "ListChecks",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    id: "quote",
    title: "Citação",
    description: "Bloco destacado",
    keywords: ["quote", "citacao", "blockquote"],
    icon: "Quote",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    id: "code",
    title: "Código",
    description: "Bloco de código",
    keywords: ["code", "codigo"],
    icon: "Code",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    id: "divider",
    title: "Divisor",
    description: "Linha horizontal",
    keywords: ["divider", "divisor", "hr", "linha"],
    icon: "Minus",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    id: "attachment",
    title: "Anexo",
    description: "Faça upload de arquivo",
    keywords: ["anexo", "attachment", "arquivo", "upload", "file"],
    icon: "Paperclip",
    command: ({ editor, range }) =>
      dispatchSlashCommand({ kind: "attachment", editor, range }),
  },
  {
    id: "subtask",
    title: "Subtarefa",
    description: "Crie tarefa filha",
    keywords: ["subtarefa", "subtask", "filha", "filho"],
    icon: "ListTree",
    command: ({ editor, range }) =>
      dispatchSlashCommand({ kind: "subtask", editor, range }),
  },
  {
    id: "tag",
    title: "Tag",
    description: "Insira etiqueta",
    keywords: ["tag", "etiqueta", "marcador", "label"],
    icon: "Hash",
    command: ({ editor, range }) =>
      dispatchSlashCommand({ kind: "tag", editor, range }),
  },
  {
    id: "linked",
    title: "Tarefa/nota vinculada",
    description: "Vincule item existente",
    keywords: ["vincular", "link", "tarefa", "nota", "wiki", "linked"],
    icon: "Link2",
    command: ({ editor, range }) =>
      dispatchSlashCommand({ kind: "linked", editor, range }),
  },
  {
    id: "database",
    title: "Database",
    description: "Inserir lista/galeria/gráfico de tarefas",
    keywords: ["database", "tabela", "tarefas", "lista", "galeria", "grafico", "view"],
    icon: "Database",
    command: ({ editor, range }) =>
      dispatchSlashCommand({ kind: "database", editor, range }),
  },
];

export function filterSlashCommands(query: string): SlashCommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.toLowerCase().includes(q)),
  ).slice(0, 8);
}
