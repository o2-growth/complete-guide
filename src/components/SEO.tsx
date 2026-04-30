import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, any>;
  canonical?: string;
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Pequeno gerenciador de SEO sem deps. Usa effects pra mutar o <head>.
 * Garante: title <60, description <160, single canonical, opcional JSON-LD.
 */
export function SEO({ title, description, noIndex, jsonLd, canonical }: SEOProps) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      const t = title.length > 60 ? title.slice(0, 57) + "…" : title;
      document.title = t;
    }
    if (description) {
      const d = description.length > 160 ? description.slice(0, 157) + "…" : description;
      setMeta("description", d);
      setMeta("og:description", d, "property");
    }
    if (title) setMeta("og:title", title, "property");
    setMeta("robots", noIndex ? "noindex,nofollow" : "index,follow");
    if (canonical) setLink("canonical", canonical);

    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.text = JSON.stringify(jsonLd);
      scriptEl.dataset.seo = "true";
      document.head.appendChild(scriptEl);
    }
    return () => {
      document.title = prevTitle;
      scriptEl?.remove();
    };
  }, [title, description, noIndex, canonical, JSON.stringify(jsonLd)]);

  return null;
}

export default SEO;