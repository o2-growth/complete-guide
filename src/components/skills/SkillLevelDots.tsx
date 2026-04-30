import { cn } from "@/lib/utils";

interface Props {
  level: number;
  size?: "sm" | "md";
  interactive?: boolean;
  onChange?: (level: number) => void;
}

const LEVEL_LABELS = ["—", "Iniciante", "Em desenvolvimento", "Proficiente", "Avançado", "Expert"];

export function SkillLevelDots({ level, size = "md", interactive, onChange }: Props) {
  const dotClass = size === "sm" ? "h-2 w-2" : "h-3 w-3";
  return (
    <div className="flex items-center gap-1" aria-label={`Nível ${level} de 5: ${LEVEL_LABELS[level]}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= level;
        const Tag = interactive ? "button" : "span";
        return (
          <Tag
            key={n}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onChange?.(n) : undefined}
            className={cn(
              "rounded-full transition-all",
              dotClass,
              filled
                ? n >= 4
                  ? "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                  : "bg-primary/80"
                : "bg-muted-foreground/20",
              interactive && "cursor-pointer hover:scale-125",
            )}
            aria-label={interactive ? `Definir nível ${n}` : undefined}
          />
        );
      })}
      {size === "md" && (
        <span className="ml-2 text-xs text-muted-foreground">{LEVEL_LABELS[level]}</span>
      )}
    </div>
  );
}