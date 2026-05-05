import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";

import {
  MentionList,
  type MentionListHandle,
  type MentionListItem,
} from "./MentionList";
import type { TenantMember } from "@/hooks/useTenantMembers";

function memberToItem(m: TenantMember): MentionListItem {
  const label = m.display_name || m.full_name || m.email || "Sem nome";
  return {
    id: m.id,
    label,
    email: m.email,
    avatar_url: m.avatar_url,
  };
}

function filterMembers(members: TenantMember[], query: string): MentionListItem[] {
  const q = query.trim().toLowerCase();
  const items = members.map(memberToItem);
  if (!q) return items.slice(0, 8);
  return items
    .filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.email ?? "").toLowerCase().includes(q),
    )
    .slice(0, 8);
}

export function createMentionExtension(getMembers: () => TenantMember[]) {
  return Mention.configure({
    HTMLAttributes: {
      class:
        "rounded bg-primary/10 px-1 py-0.5 text-primary font-medium text-[0.95em]",
      "data-type": "mention",
    },
    renderText({ node }) {
      return `@${node.attrs.label ?? node.attrs.id}`;
    },
    renderHTML({ options, node }) {
      return [
        "span",
        { ...options.HTMLAttributes, "data-id": node.attrs.id },
        `@${node.attrs.label ?? node.attrs.id}`,
      ];
    },
    suggestion: {
      char: "@",
      items: ({ query }) => filterMembers(getMembers(), query),
      render: () => {
        let component: ReactRenderer<MentionListHandle> | null = null;
        let popup: TippyInstance | undefined;

        return {
          onStart: (props: SuggestionProps<MentionListItem, { id: string; label: string }>) => {
            component = new ReactRenderer(MentionList, {
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
          onUpdate: (props: SuggestionProps<MentionListItem, { id: string; label: string }>) => {
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
    },
  });
}
