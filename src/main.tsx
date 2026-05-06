import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { bootstrapDensity } from "./hooks/useDensity";
import "./index.css";

// Aplica densidade do localStorage antes do React montar — evita flash visual.
bootstrapDensity();

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker (PWA) — only outside iframes/preview
if ("serviceWorker" in navigator) {
  const isIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
  const isPreview = window.location.hostname.includes("lovableproject.com")
    || window.location.hostname.includes("lovable.app")
    || window.location.hostname.includes("id-preview--");
  if (!isIframe && !isPreview) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
  }
}
