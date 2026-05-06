import { useState } from "react";
import { Settings as SettingsIcon, Sun, Moon, Languages, Smartphone, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/hooks/useAuth";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { LOCALES, Locale } from "@/lib/i18n/translations";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const { user } = useAuth();
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    const outcome = await promptInstall();
    setInstalling(false);
    if (outcome === "accepted") toast.success("Oxy instalado 🎉");
    else if (outcome === "dismissed") toast("Instalação cancelada");
  };

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <PageHeader
          icon={SettingsIcon}
          title={t("settings.title")}
          description={t("settings.description")}
        />
      </div>

      <div className="space-y-6">
        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sun className="h-4 w-4 text-primary" /> {t("settings.appearance")}
            </CardTitle>
            <CardDescription>{t("settings.theme")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2" role="radiogroup" aria-label={t("settings.theme")}>
              <Button
                role="radio"
                aria-checked={theme === "light"}
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                className="flex-1"
              >
                <Sun className="mr-2 h-4 w-4" /> {t("settings.theme.light")}
              </Button>
              <Button
                role="radio"
                aria-checked={theme === "dark"}
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                className="flex-1"
              >
                <Moon className="mr-2 h-4 w-4" /> {t("settings.theme.dark")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Idioma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="h-4 w-4 text-primary" /> {t("settings.language")}
            </CardTitle>
            <CardDescription>{t("settings.language.help")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="locale-select" className="sr-only">
              {t("settings.language")}
            </Label>
            <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
              <SelectTrigger id="locale-select" className="w-full max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    <span className="mr-2">{l.flag}</span> {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Instalar PWA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4 text-primary" /> {t("settings.install")}
            </CardTitle>
            <CardDescription>{t("settings.install.help")}</CardDescription>
          </CardHeader>
          <CardContent>
            {installed ? (
              <Badge className="bg-success/15 text-success-foreground">✓ Instalado</Badge>
            ) : canInstall ? (
              <Button onClick={handleInstall} disabled={installing}>
                <Smartphone className="mr-2 h-4 w-4" />
                {t("settings.install.button")}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">{t("settings.install.unavailable")}</p>
            )}
          </CardContent>
        </Card>

        {/* Conta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" /> {t("settings.account")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <span className="text-muted-foreground">{t("settings.signed_in_as")}: </span>
              <span className="font-medium">{user?.email}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}