import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  variant?: "card" | "plain";
}

/**
 * Estado de erro padrão pra hooks/queries que retornam falha.
 * Use em vez de mostrar `error.message` solto na tela.
 */
export function ErrorState({
  title = "Não foi possível carregar",
  description,
  onRetry,
  retryLabel = "Tentar de novo",
  className,
  variant = "card",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-10 text-center animate-fade-in",
        variant === "card" && "rounded-xl border border-destructive/30 bg-destructive/5",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground break-words">{description}</p>
        )}
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
