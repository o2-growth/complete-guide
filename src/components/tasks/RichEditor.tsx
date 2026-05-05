import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { SlashCommandsExtension } from "./RichEditor/slash-commands";
import { createMentionExtension } from "./RichEditor/mention";
import { useTenantMembers, type TenantMember } from "@/hooks/useTenantMembers";
import { RichEditorContextProvider } from "./RichEditor/commands/RichEditorContext";
import { SlashCommandHost } from "./RichEditor/commands/SlashCommandHost";
import { InlineDatabaseExtension } from "@/components/wiki/extensions/InlineDatabase";
import type { TaskRow } from "@/hooks/useTasks";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  /**
   * Habilita @mention rica de membros do tenant.
   * Default false — usar em comentários e descrições, não em campos de título.
   */
  enableMentions?: boolean;
  /**
   * Tarefa atual quando o editor é usado dentro de TaskDetailSheet.
   * Necessária para os comandos /anexo, /subtarefa e /tag funcionarem.
   */
  task?: TaskRow | null;
  /**
   * Habilita inline databases (slash command /database). Use só dentro do
   * Wiki — em comentários/descrições normais não faz sentido.
   */
  enableInlineDatabase?: boolean;
}

export function RichEditor({
  value,
  onChange,
  onBlur,
  placeholder = "Digite '/' para comandos…",
  className,
  editable = true,
  enableMentions = false,
  task = null,
  enableInlineDatabase = false,
}: RichEditorProps) {
  const { data: members } = useTenantMembers();
  const membersRef = useRef<TenantMember[]>([]);
  membersRef.current = members ?? [];

  const extensions = useMemo(() => {
    const exts = [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      SlashCommandsExtension,
    ];
    if (enableMentions) {
      exts.push(createMentionExtension(() => membersRef.current));
    }
    if (enableInlineDatabase) {
      exts.push(InlineDatabaseExtension);
    }
    return exts;
  }, [placeholder, enableMentions, enableInlineDatabase]);

  const editor = useEditor({
    extensions,
    content: value || "",
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:gap-2 [&_ul[data-type=taskList]_li>label]:mt-1",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <RichEditorContextProvider value={{ task }}>
      <div
        className={cn(
          "rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          className,
        )}
      >
        <EditorContent editor={editor} />
      </div>
      <SlashCommandHost editor={editor} />
    </RichEditorContextProvider>
  );
}
