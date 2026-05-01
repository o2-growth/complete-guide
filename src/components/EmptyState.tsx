import { LucideIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "card" | "plain";
}

/**
 * Empty state ilustrado e consistente em todas as listas vazias.
 * Usar sempre que `data?.length === 0`.
 */
export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = "card",
}: EmptyStateProps) {
  const ActionIcon = action?.icon;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-12 text-center animate-fade-in",
        variant === "card" && "rounded-xl border border-dashed bg-card/40",
        className,
      )}
      role="status"
    >
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-gradient-brand opacity-20 blur-2xl" />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-brand">
          <Icon className="h-8 w-8" strokeWidth={1.75} />
        </div>
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {action && (
            <Button onClick={action.onClick} size="sm">
              {ActionIcon && <ActionIcon className="mr-1.5 h-4 w-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}