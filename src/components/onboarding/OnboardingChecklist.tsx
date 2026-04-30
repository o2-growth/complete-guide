import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, X, ChevronUp, ChevronDown, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Card flutuante de onboarding (bottom-right). Aparece apenas se houver passos pendentes
 * e o usuário não tiver dispensado. Persiste em profiles.preferences.onboarding_v2.
 */
export function OnboardingChecklist() {
  const { steps, completed, total, allDone, dismissed, dismiss, loading } = useOnboardingChecklist();
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();

  if (loading || dismissed || allDone || total === 0) return null;

  const pct = Math.round((completed / total) * 100);

  return (
    <Card
      role="region"
      aria-label="Checklist de primeiros passos"
      className="fixed bottom-4 right-4 z-40 w-[340px] shadow-elevated border-primary/20 animate-fade-in"
    >
      <div className="flex items-center gap-2 border-b p-3">
        <Rocket className="h-4 w-4 text-primary" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Comece com o pé direito</p>
          <p className="text-[11px] text-muted-foreground">{completed} de {total} concluídos</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={expanded ? "Recolher" : "Expandir"}
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Dispensar checklist"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Progress value={pct} className="h-1 rounded-none" aria-label={`Progresso ${pct}%`} />
      {expanded && (
        <ul className="max-h-[320px] overflow-y-auto p-2">
          {steps.map(step => (
            <li key={step.key}>
              <button
                type="button"
                onClick={() => !step.done && navigate(step.href)}
                disabled={step.done}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md p-2 text-left text-xs transition-colors",
                  step.done ? "opacity-60" : "hover:bg-accent",
                )}
              >
                {step.done
                  ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success mt-0.5" aria-hidden />
                  : <Circle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
                }
                <span className="flex-1 min-w-0">
                  <span className={cn("block font-medium", step.done && "line-through")}>{step.title}</span>
                  <span className="block text-muted-foreground text-[11px]">{step.description}</span>
                  {!step.done && <span className="mt-1 inline-block text-primary text-[11px] font-medium">{step.cta} →</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}