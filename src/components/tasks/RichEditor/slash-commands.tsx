import { Extension } from "@tiptap/core";
import type { Editor, Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, {
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";

import {
  SlashCommandList,
  type SlashCommandItem,
  type SlashCommandListHandle,
} from "./SlashCommandList";
import { filterSlashCommands } from "./slash-commands-data";

interface SlashCommandsOptions {
  suggestion: {
    char: string;
    command: (props: {
      editor: Editor;
      range: Range;
      props: SlashCommandItem;
    }) => void;
  };
}

export const SlashCommandsExtension = Extension.create<SlashCommandsOptions>({
  name: "slash-commands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }) => props.command({ editor, range }),
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem, SlashCommandItem>({
        editor: this.editor,
        char: this.options.suggestion.char,
        command: this.options.suggestion.command,
        items: ({ query }) => filterSlashCommands(query),
        render: () => {
          let component: ReactRenderer<SlashCommandListHandle> | null = null;
          let popup: TippyInstance | undefined;

          return {
            onStart: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => {
              component = new ReactRenderer(SlashCommandList, {
                props,
                editor: props.editor,
              });
              if (!props.clientRect) return;
              const [instance] = tippy("body", {
                getReferenceClientRect: () =>
                  props.clientRect?.() ?? new DOMRect(0, 0, 0, 0),
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
              popup = instance;
            },
            onUpdate: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => {
              component?.updateProps(props);
              if (props.clientRect) {
                popup?.setProps({
                  getReferenceClientRect: () =>
                    props.clientRect?.() ?? new DOMRect(0, 0, 0, 0),
                });
              }
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === "Escape") {
                popup?.hide();
                return true;
              }
              return component?.ref?.onKeyDown(props.event) ?? false;
            },
            onExit: () => {
              popup?.destroy();
              component?.destroy();
              popup = undefined;
              component = null;
            },
          };
        },
      }),
    ];
  },
});
