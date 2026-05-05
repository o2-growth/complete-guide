import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface MentionListItem {
  id: string;
  label: string;
  email: string | null;
  avatar_url: string | null;
}

export interface MentionListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface Props {
  items: MentionListItem[];
  command: (item: { id: string; label: string }) => void;
}

function initials(label: string, email: string | null): string {
  const src = label?.trim() || email?.trim() || "?";
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const MentionList = forwardRef<MentionListHandle, Props>(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    setSelected(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (!items.length) return false;
      if (event.key === "ArrowUp") {
        setSelected((s) => (s + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelected((s) => (s + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        const item = items[selected];
        if (item) command({ id: item.id, label: item.label });
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return (
      <div className="rounded-lg border bg-popover p-2 text-xs text-muted-foreground shadow-md">
        Nenhum membro encontrado.
      </div>
    );
  }

  return (
    <div
      role="listbox"
      aria-label="Mencionar membro"
      className="max-h-72 w-72 overflow-auto rounded-lg border bg-popover p-1 shadow-md"
    >
      {items.map((item, idx) => {
        const active = idx === selected;
        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => command({ id: item.id, label: item.label })}
            onMouseEnter={() => setSelected(idx)}
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors",
              active ? "bg-accent text-accent-foreground" : "hover:bg-muted",
            )}
          >
            <Avatar className="h-6 w-6 shrink-0">
              {item.avatar_url ? <AvatarImage src={item.avatar_url} alt="" /> : null}
              <AvatarFallback className="text-[10px]">
                {initials(item.label, item.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium leading-tight">{item.label}</div>
              {item.email ? (
                <div className="truncate text-[11px] text-muted-foreground">{item.email}</div>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
});
MentionList.displayName = "MentionList";
