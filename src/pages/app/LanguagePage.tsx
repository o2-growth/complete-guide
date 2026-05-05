import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/useI18n";
import { LOCALES, Locale } from "@/lib/i18n/translations";
import { Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

export default function LanguagePage() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="space-y-6 p-6">
      <SEO title="Idioma" description="Defina o idioma da interface" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Languages className="h-6 w-6 text-primary" aria-hidden /> {t("settings.language")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("settings.language.help")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("settings.language")}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2" role="radiogroup" aria-label={t("settings.language")}>
            {LOCALES.map((l) => {
              const active = locale === l.code;
              return (
                <Button
                  key={l.code}
                  variant={active ? "default" : "outline"}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setLocale(l.code as Locale)}
                  className="w-full justify-start gap-3"
                >
                  <span aria-hidden className="text-xl">{l.flag}</span>
                  <span className="flex-1 text-left">{l.label}</span>
                  {active && <Check className="h-4 w-4" aria-hidden />}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{t("common.loading")}</p>
          <p>{t("common.search")}</p>
          <p>{t("common.save")} · {t("common.cancel")}</p>
          <p>{t("nav.inbox")} · {t("nav.today")}</p>
          <p className="text-muted-foreground text-xs mt-3">
            Data: {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date())} ·
            Número: {new Intl.NumberFormat(locale).format(1234567.89)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
