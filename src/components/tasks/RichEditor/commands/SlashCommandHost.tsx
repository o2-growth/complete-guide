import { useEffect, useState } from "react";
import type { Editor, Range } from "@tiptap/core";
import { onSlashCommand, type SlashCommandKind } from "./command-bus";
import { useRichEditorContext } from "./useRichEditorContext";
import { AttachmentCommand } from "./AttachmentCommand";
import { SubtaskCommand } from "./SubtaskCommand";
import { TagCommand } from "./TagCommand";
import { LinkedItemCommand } from "./LinkedItemCommand";
import { DatabaseCommand } from "./DatabaseCommand";

interface ActiveCommand {
  kind: SlashCommandKind;
  editor: Editor;
  range: Range;
  key: number;
}

interface Props {
  editor: Editor | null;
}

export function SlashCommandHost({ editor }: Props) {
  const [active, setActive] = useState<ActiveCommand | null>(null);
  const { task } = useRichEditorContext();

  useEffect(() => {
    return onSlashCommand((detail) => {
      // Apenas reage se o evento veio do editor desta instância
      if (editor && detail.editor !== editor) return;
      setActive({
        kind: detail.kind,
        editor: detail.editor,
        range: detail.range,
        key: Date.now(),
      });
    });
  }, [editor]);

  if (!active) return null;
  const close = () => setActive(null);

  switch (active.kind) {
    case "attachment":
      return (
        <AttachmentCommand
          key={active.key}
          editor={active.editor}
          range={active.range}
          task={task}
          onDone={close}
        />
      );
    case "subtask":
      return (
        <SubtaskCommand
          key={active.key}
          editor={active.editor}
          range={active.range}
          task={task}
          onDone={close}
        />
      );
    case "tag":
      return (
        <TagCommand
          key={active.key}
          editor={active.editor}
          range={active.range}
          task={task}
          onDone={close}
        />
      );
    case "linked":
      return (
        <LinkedItemCommand
          key={active.key}
          editor={active.editor}
          range={active.range}
          onDone={close}
        />
      );
    case "database":
      return (
        <DatabaseCommand
          key={active.key}
          editor={active.editor}
          range={active.range}
          onDone={close}
        />
      );
  }
}
