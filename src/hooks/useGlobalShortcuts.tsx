import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Atalhos g+letra (Gmail-style) e ? para abrir página de atalhos.
 * Ignora quando foco está em input/textarea/contenteditable.
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const pendingG = useRef<number | null>(null);

  useEffect(() => {
    const map: Record<string, string> = {
      i: "/app",
      h: "/app/hoje",
      c: "/app/calendario",
      k: "/app/kanban",
      o: "/app/copilot",
      e: "/app/exec",
      n: "/app/notificacoes",
      s: "/app/configuracoes",
      p: "/app/projetos",
    };

    const isTyping = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      const k = e.key.toLowerCase();

      if (k === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        navigate("/app/atalhos");
        return;
      }

      if (pendingG.current) {
        const path = map[k];
        if (path) {
          e.preventDefault();
          navigate(path);
        }
        clearTimeout(pendingG.current);
        pendingG.current = null;
        return;
      }

      if (k === "g") {
        e.preventDefault();
        pendingG.current = window.setTimeout(() => { pendingG.current = null; }, 1200);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (pendingG.current) clearTimeout(pendingG.current);
    };
  }, [navigate]);
}