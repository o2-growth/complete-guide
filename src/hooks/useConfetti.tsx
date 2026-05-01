import { useCallback } from "react";

/**
 * Confetti DOM-only, sem dependências externas.
 * Dispara partículas coloridas a partir de um ponto da tela.
 */
export function useConfetti() {
  const fire = useCallback((x?: number, y?: number, count = 60) => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const cx = x ?? window.innerWidth / 2;
    const cy = y ?? window.innerHeight / 2;
    const colors = [
      "hsl(var(--primary))",
      "hsl(var(--accent))",
      "hsl(var(--success))",
      "hsl(var(--primary-glow))",
    ];

    const layer = document.createElement("div");
    layer.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
    document.body.appendChild(layer);

    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 8;
      const dx = Math.cos(angle) * speed * 30;
      const dy = Math.sin(angle) * speed * 30 - 200;
      const size = 6 + Math.random() * 6;
      const rot = Math.random() * 720 - 360;
      const color = colors[i % colors.length];
      p.style.cssText = `
        position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;
        background:${color};border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
        transform:translate(-50%,-50%);opacity:1;will-change:transform,opacity;
        transition:transform 1.2s cubic-bezier(.2,.7,.3,1), opacity 1.2s ease-out;
      `;
      layer.appendChild(p);
      requestAnimationFrame(() => {
        p.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 600}px)) rotate(${rot}deg)`;
        p.style.opacity = "0";
      });
    }
    setTimeout(() => layer.remove(), 1400);
  }, []);

  return fire;
}