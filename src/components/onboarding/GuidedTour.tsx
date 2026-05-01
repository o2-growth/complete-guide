import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { TourStep } from "@/hooks/useGuidedTour";

interface Props {
  active: boolean;
  step: number;
  total: number;
  current?: TourStep;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

/**
 * Overlay com spotlight + popover ao lado do elemento.
 * Usa getBoundingClientRect do seletor; se não encontrar, mostra centralizado.
 */
export function GuidedTour({ active, step, total, current, onNext, onPrev, onSkip }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!active || !current) return;
    const find = () => {
      const el = document.querySelector(current.selector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };
    find();
    const t = setTimeout(find, 350);
    window.addEventListener("resize", find);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", find);
    };
  }, [active, current, step]);

  if (!active || !current) return null;

  const popoverStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        top: Math.min(rect.bottom + 12, window.innerHeight - 220),
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 360)),
        width: 340,
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 340,
      };

  const ringStyle: React.CSSProperties | null = rect
    ? {
        position: "fixed",
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
        borderRadius: 12,
        boxShadow: "0 0 0 9999px hsl(var(--background) / 0.7), 0 0 0 2px hsl(var(--primary))",
        pointerEvents: "none",
        zIndex: 9998,
        transition: "all .25s ease",
      }
    : null;

  return (
    <>
      {ringStyle ? <div style={ringStyle} aria-hidden /> : <div className="fixed inset-0 z-[9998] bg-background/70" aria-hidden />}
      <div
        role="dialog"
        aria-label={current.title}
        className="z-[9999] rounded-xl border bg-card p-4 shadow-elevated animate-fade-in"
        style={popoverStyle}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Tour {step + 1}/{total}
          </div>
          <button
            onClick={onSkip}
            aria-label="Pular tour"
            className="rounded p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <h3 className="mt-2 text-sm font-semibold">{current.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{current.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onPrev} disabled={step === 0}>
            <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Voltar
          </Button>
          <Button size="sm" onClick={onNext}>
            {step >= total - 1 ? "Concluir" : "Próximo"}
            {step < total - 1 && <ChevronRight className="ml-1 h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </>
  );
}