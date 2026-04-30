export type PreviewKind = "ig_feed" | "ig_story" | "ig_reel" | "linkedin" | "email";

export const PREVIEW_LABELS: Record<PreviewKind, string> = {
  ig_feed: "Instagram Feed",
  ig_story: "Instagram Story",
  ig_reel: "Instagram Reel",
  linkedin: "LinkedIn",
  email: "E-mail",
};

export interface PreviewContent {
  kind: PreviewKind;
  imageUrl?: string | null;
  caption?: string;
  headline?: string;
  subject?: string;
  ctaLabel?: string;
  authorName?: string;
  authorAvatar?: string | null;
  authorHandle?: string;
  brandName?: string;
}

/**
 * Lê metadata de preview do custom_fields da task.
 * Estrutura esperada: custom_fields.preview = { kind, imageUrl, caption, ... }
 */
export function getTaskPreview(
  customFields: Record<string, unknown> | null | undefined,
  fallbackKind: PreviewKind = "ig_feed",
): PreviewContent {
  const raw = (customFields?.preview as Record<string, unknown> | undefined) ?? {};
  return {
    kind: (raw.kind as PreviewKind) || fallbackKind,
    imageUrl: (raw.imageUrl as string) ?? null,
    caption: (raw.caption as string) ?? "",
    headline: (raw.headline as string) ?? "",
    subject: (raw.subject as string) ?? "",
    ctaLabel: (raw.ctaLabel as string) ?? "",
    authorName: (raw.authorName as string) ?? "Oxy Growth",
    authorAvatar: (raw.authorAvatar as string) ?? null,
    authorHandle: (raw.authorHandle as string) ?? "@oxygrowth",
    brandName: (raw.brandName as string) ?? "Oxy Growth",
  };
}

export function truncate(text: string, max: number) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export function formatLikes(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
