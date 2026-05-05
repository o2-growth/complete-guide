import { Info, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DemoBadgeProps {
  feature: string;
  description?: string;
  lovableHint?: string;
  variant?: "inline" | "banner";
  className?: string;
}

export function DemoBadge({
  feature,
  description,
  lovableHint,
  variant = "inline",
  className,
}: DemoBadgeProps) {
  if (variant === "inline") {
    return (
      <span
        role="status"
        aria-label={`Modo demo: ${feature}`}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 text-warning-foreground px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
          className,
        )}
      >
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        Modo demo
      </span>
    );
  }

  return (
    <Alert
      role="status"
      className={cn(
        "border-warning/40 bg-warning/10 text-warning-foreground [&>svg]:text-warning-foreground",
        className,
      )}
    >
      <Info className="h-4 w-4" aria-hidden="true" />
      <div className="flex items-start gap-3 pr-2">
        <div className="flex-1 min-w-0">
          <AlertTitle>Modo demonstração — {feature}</AlertTitle>
          <AlertDescription className="space-y-1">
            {description && <p>{description}</p>}
            {lovableHint && (
              <p className="text-xs text-muted-foreground">{lovableHint}</p>
            )}
          </AlertDescription>
        </div>
        {/* Botão placeholder: a navegação para o painel de secrets/configuração será plugada quando a infra de rotas internas para Lovable Cloud existir. */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-warning-foreground hover:bg-warning/20"
          onClick={undefined}
        >
          Configurar
        </Button>
      </div>
    </Alert>
  );
}

export default DemoBadge;
