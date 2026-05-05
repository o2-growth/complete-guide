import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { useState } from "react";
import {
  InlineDatabaseRenderer,
  type InlineDatabaseConfig,
  type InlineDatabaseFilter,
  type InlineDatabaseKind,
  type InlineDatabaseViewMode,
} from "./InlineDatabaseRenderer";
import { InlineDatabaseConfigDialog } from "./InlineDatabaseConfigDialog";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineDatabase: {
      insertInlineDatabase: (config: InlineDatabaseConfig) => ReturnType;
      updateInlineDatabase: (config: InlineDatabaseConfig) => ReturnType;
    };
  }
}

const INLINE_DB_NAME = "inlineDatabase";

interface InlineDatabaseAttrs {
  kind: InlineDatabaseKind;
  filter: InlineDatabaseFilter;
  view_mode: InlineDatabaseViewMode;
  view_config: Record<string, unknown> | null;
}

function attrsToConfig(attrs: InlineDatabaseAttrs): InlineDatabaseConfig {
  return {
    kind: attrs.kind ?? "tasks",
    filter: attrs.filter ?? {},
    view_mode: attrs.view_mode ?? "list",
    view_config: attrs.view_config ?? undefined,
  };
}

function NodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const attrs = node.attrs as unknown as InlineDatabaseAttrs;
  const config = attrsToConfig(attrs);
  const isDocEditable = editor.isEditable;

  return (
    <NodeViewWrapper
      data-inline-database
      data-kind={attrs.kind}
      className="my-3"
      contentEditable={false}
    >
      <InlineDatabaseRenderer
        config={config}
        isEditing={isDocEditable}
        onEditConfig={() => setEditorOpen(true)}
      />
      <InlineDatabaseConfigDialog
        open={editorOpen}
        initial={config}
        onOpenChange={setEditorOpen}
        onConfirm={(next) => {
          updateAttributes({
            kind: next.kind,
            filter: next.filter,
            view_mode: next.view_mode,
            view_config: next.view_config ?? null,
          });
          setEditorOpen(false);
        }}
      />
    </NodeViewWrapper>
  );
}

export const InlineDatabaseExtension = Node.create({
  name: INLINE_DB_NAME,
  group: "block",
  atom: true,
  draggable: false,
  selectable: true,

  addAttributes() {
    return {
      kind: {
        default: "tasks",
      },
      filter: {
        default: {},
        parseHTML: (el) => {
          const raw = el.getAttribute("data-filter");
          if (!raw) return {};
          try {
            return JSON.parse(raw);
          } catch {
            return {};
          }
        },
        renderHTML: (attrs) => ({
          "data-filter": JSON.stringify(attrs.filter ?? {}),
        }),
      },
      view_mode: {
        default: "list",
        parseHTML: (el) => el.getAttribute("data-view-mode") ?? "list",
        renderHTML: (attrs) => ({ "data-view-mode": attrs.view_mode ?? "list" }),
      },
      view_config: {
        default: null,
        parseHTML: (el) => {
          const raw = el.getAttribute("data-view-config");
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        },
        renderHTML: (attrs) =>
          attrs.view_config
            ? { "data-view-config": JSON.stringify(attrs.view_config) }
            : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-inline-database]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-inline-database": "true" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NodeView);
  },

  addCommands() {
    return {
      insertInlineDatabase:
        (config: InlineDatabaseConfig) =>
        ({ commands }) => {
          return commands.insertContent({
            type: INLINE_DB_NAME,
            attrs: {
              kind: config.kind,
              filter: config.filter ?? {},
              view_mode: config.view_mode ?? "list",
              view_config: config.view_config ?? null,
            },
          });
        },
      updateInlineDatabase:
        (config: InlineDatabaseConfig) =>
        ({ commands }) => {
          return commands.updateAttributes(INLINE_DB_NAME, {
            kind: config.kind,
            filter: config.filter ?? {},
            view_mode: config.view_mode ?? "list",
            view_config: config.view_config ?? null,
          });
        },
    };
  },
});

export type { InlineDatabaseConfig, InlineDatabaseFilter, InlineDatabaseKind, InlineDatabaseViewMode };
