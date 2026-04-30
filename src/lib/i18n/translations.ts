/**
 * i18n base — pt-BR (default) e en-US.
 * Base leve para evoluir sem dependências externas.
 */
export type Locale = "pt-BR" | "en-US";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
  { code: "en-US", label: "English (US)", flag: "🇺🇸" },
];

type Dict = Record<string, string>;

export const translations: Record<Locale, Dict> = {
  "pt-BR": {
    "common.save": "Salvar",
    "common.cancel": "Cancelar",
    "common.loading": "Carregando…",
    "common.search": "Buscar",
    "common.skip_to_content": "Pular para o conteúdo",
    "settings.title": "Configurações",
    "settings.description": "Preferências da sua conta e do workspace.",
    "settings.appearance": "Aparência",
    "settings.theme": "Tema",
    "settings.theme.light": "Claro",
    "settings.theme.dark": "Escuro",
    "settings.language": "Idioma",
    "settings.language.help": "Define o idioma da interface.",
    "settings.install": "Instalar como app",
    "settings.install.help":
      "Adicione o Oxy Growth OS à tela inicial do seu dispositivo para acesso rápido em modo standalone.",
    "settings.install.button": "Instalar agora",
    "settings.install.unavailable":
      "Use o menu do seu navegador (Compartilhar → Adicionar à Tela de Início no iOS).",
    "settings.account": "Conta",
    "settings.signed_in_as": "Conectado como",
    "nav.inbox": "Inbox",
    "nav.today": "Hoje",
  },
  "en-US": {
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading…",
    "common.search": "Search",
    "common.skip_to_content": "Skip to content",
    "settings.title": "Settings",
    "settings.description": "Preferences for your account and workspace.",
    "settings.appearance": "Appearance",
    "settings.theme": "Theme",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.language": "Language",
    "settings.language.help": "Sets the interface language.",
    "settings.install": "Install as app",
    "settings.install.help":
      "Add Oxy Growth OS to your home screen for quick standalone access.",
    "settings.install.button": "Install now",
    "settings.install.unavailable":
      "Use your browser menu (Share → Add to Home Screen on iOS).",
    "settings.account": "Account",
    "settings.signed_in_as": "Signed in as",
    "nav.inbox": "Inbox",
    "nav.today": "Today",
  },
};

export function translate(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations["pt-BR"][key] ?? key;
}