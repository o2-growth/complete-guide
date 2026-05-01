import { useEffect, useRef } from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Hook leve para detectar swipe horizontal em qualquer elemento via ref.
 * Mobile-first; ignora se prefers-reduced-motion ativo? não — gestos não são animação.
 */
export function useSwipeGesture<T extends HTMLElement>(opts: SwipeOptions) {
  const ref = useRef<T | null>(null);
  const start = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || opts.enabled === false) return;
    const threshold = opts.threshold ?? 60;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    };
    const onEnd = (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      const dt = Date.now() - start.current.t;
      start.current = null;
      if (dt > 600) return;
      if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0) opts.onSwipeLeft?.();
      else opts.onSwipeRight?.();
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [opts.onSwipeLeft, opts.onSwipeRight, opts.threshold, opts.enabled]);

  return ref;
}