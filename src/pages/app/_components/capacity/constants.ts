import { Plane, Stethoscope, Calendar as CalIcon, Coffee, Sparkles } from "lucide-react";
import type { TimeOffKind, MemberLite } from "@/hooks/useCapacity";

export const DAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

export const KIND_META: Record<TimeOffKind, { label: string; icon: typeof Plane; color: string }> = {
  vacation: { label: "Férias", icon: Plane, color: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  sick: { label: "Atestado", icon: Stethoscope, color: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  holiday: { label: "Feriado", icon: CalIcon, color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  personal: { label: "Pessoal", icon: Coffee, color: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  other: { label: "Outro", icon: Sparkles, color: "bg-muted text-muted-foreground" },
};

export function initials(p: MemberLite) {
  return (p.display_name || p.full_name || p.email || "?")
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
