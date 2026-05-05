import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { Editor, Range } from "@tiptap/core";
import {
  Code,
  Hash,
  Heading2,
  Heading3,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  ListTree,
  type LucideIcon,
  Minus,
  Paperclip,
  Quote,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SlashIconName =
  | "Heading2"
  | "Heading3"
  | "List"
  | "ListOrdered"
  | "ListChecks"
  | "Quote"
  | "Code"
  | "Minus"
  | "Paperclip"
  | "ListTree"
  | "Hash"
  | "Link2";

export interface SlashCommandItem {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  icon: SlashIconName;
  command: (props: { editor: Editor; range: Range }) => void;
}

const ICON_MAP: Record<SlashIconName, LucideIcon> = {
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Minus,
  Paperclip,
  ListTree,
  Hash,
  Link2,
};

export interface SlashCommandListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface Props {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashCommandList = forwardRef<SlashCommandListHandle, Props>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0);

    useEffect(() => {
      setSelected(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: (event) => {
        if (event.key === "ArrowUp") {
          setSelected((s) => (s + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelected((s) => (s + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          if (items[selected]) command(items[selected]);
          return true;
        }
        return false;
      },
    }));

    if (!items.length) {
      return (
        <div className="rounded-lg border bg-popover p-2 text-xs text-muted-foreground shadow-md">
          Nenhum comando encontrado.
        </div>
      );
    }

    return (
      <div
        role="listbox"
        aria-label="Comandos rápidos"
        className="max-h-72 w-72 overflow-auto rounded-lg border bg-popover p-1 shadow-md"
      >
        {items.map((item, idx) => {
          const Icon = ICON_MAP[item.icon] ?? Sparkles;
          const active = idx === selected;
          return (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => command(item)}
              onMouseEnter={() => setSelected(idx)}
              className={cn(
                "flex w-full items-center gap-3 rounded px-2 py-2 text-left text-sm transition-colors",
                active ? "bg-accent text-accent-foreground" : "hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="font-medium leading-tight">{item.title}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  },
);
SlashCommandList.displayName = "SlashCommandList";
