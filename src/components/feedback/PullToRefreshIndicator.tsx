import { Loader2, ArrowDown } from "lucide-react";

interface Props {
  pull: number;
  refreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({ pull, refreshing, threshold = 70 }: Props) {
  if (pull === 0 && !refreshing) return null;
  const ready = pull > threshold;
  return (
    <div
      className="pointer-events-none fixed left-1/2 top-2 z-50 -translate-x-1/2 rounded-full bg-card/95 px-3 py-1.5 text-xs font-medium shadow-elevated backdrop-blur"
      style={{ transform: `translate(-50%, ${Math.min(pull / 2, 40)}px)`, opacity: Math.min(pull / 60, 1) }}
      role="status"
      aria-live="polite"
    >
      {refreshing ? (
        <span className="inline-flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Atualizando…
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <ArrowDown className={`h-3.5 w-3.5 transition-transform ${ready ? "rotate-180 text-primary" : ""}`} />
          {ready ? "Solte para atualizar" : "Puxe para atualizar"}
        </span>
      )}
    </div>
  );
}