import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Locale, translate } from "@/lib/i18n/translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "pt-BR",
  setLocale: () => {},
  t: (k) => k,
});

const STORAGE_KEY = "oxy-locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "pt-BR";
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored === "pt-BR" || stored === "en-US" || stored === "es-ES") return stored;
  // Default fixo em pt-BR (idioma único do produto). Só troca via tela de Idioma.
  return "pt-BR";
}

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- Provider e hook do contexto coexistem por convenção React.
export const useI18n = () => useContext(I18nContext);