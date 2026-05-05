import type { Editor, Range } from "@tiptap/core";

export type SlashCommandKind = "attachment" | "subtask" | "tag" | "linked" | "database";

export interface SlashCommandEventDetail {
  kind: SlashCommandKind;
  editor: Editor;
  range: Range;
}

const EVENT_NAME = "oxy:slash-command";

export function dispatchSlashCommand(detail: SlashCommandEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<SlashCommandEventDetail>(EVENT_NAME, { detail }));
}

export function onSlashCommand(
  handler: (detail: SlashCommandEventDetail) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const ce = e as CustomEvent<SlashCommandEventDetail>;
    handler(ce.detail);
  };
  window.addEventListener(EVENT_NAME, listener as EventListener);
  return () => window.removeEventListener(EVENT_NAME, listener as EventListener);
}
