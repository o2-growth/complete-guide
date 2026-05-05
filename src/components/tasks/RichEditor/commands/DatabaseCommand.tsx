import { useEffect, useState } from "react";
import type { Editor, Range } from "@tiptap/core";
import { InlineDatabaseConfigDialog } from "@/components/wiki/extensions/InlineDatabaseConfigDialog";
import type { InlineDatabaseConfig } from "@/components/wiki/extensions/InlineDatabaseRenderer";

interface Props {
  editor: Editor;
  range: Range;
  onDone: () => void;
}

/**
 * Comando /database — abre dialog pra montar config e insere o nó
 * inlineDatabase no editor. Se o editor não registrou a extension
 * (ex: usado num contexto que não é o wiki) o comando vira no-op.
 */
export function DatabaseCommand({ editor, range, onDone }: Props) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, []);

  const handleConfirm = (config: InlineDatabaseConfig) => {
    // remove o "/database" digitado e insere o node
    const chain = editor.chain().focus().deleteRange(range);

    type WithInlineDb = typeof chain & {
      insertInlineDatabase?: (cfg: InlineDatabaseConfig) => typeof chain;
    };
    const c = chain as WithInlineDb;
    if (typeof c.insertInlineDatabase === "function") {
      c.insertInlineDatabase(config).run();
    } else {
      // fallback: insere via insertContent direto
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "inlineDatabase",
          attrs: {
            kind: config.kind,
            filter: config.filter ?? {},
            view_mode: config.view_mode ?? "list",
            view_config: config.view_config ?? null,
          },
        })
        .run();
    }
    onDone();
  };

  return (
    <InlineDatabaseConfigDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onDone();
      }}
      onConfirm={handleConfirm}
    />
  );
}
