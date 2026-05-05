import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import {
  TEMPLATE_CATEGORIES,
  useAutomationTemplates,
  useApplyTemplate,
  type AutomationRule,
} from "@/hooks/useAutomations";
import { getAutomationIcon } from "./icon-map";

interface Props {
  onApplied?: (newRuleId: string | null) => void;
}

export function AutomationTemplatesGallery({ onApplied }: Props) {
  const { data: templates = [], isLoading } = useAutomationTemplates();
  const apply = useApplyTemplate();

  const groups = useMemo(() => {
    const map = new Map<string, AutomationRule[]>();
    for (const t of templates) {
      const cat = t.template_category ?? "geral";
      const arr = map.get(cat) ?? [];
      arr.push(t);
      map.set(cat, arr);
    }
    return map;
  }, [templates]);

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Carregando templates…</p>;
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhum template instalado neste workspace ainda.
        </p>
        <p className="text-xs text-muted-foreground">
          Templates ficam disponíveis após o seed do Lovable rodar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {TEMPLATE_CATEGORIES.map((cat) => {
        const items = groups.get(cat.value) ?? [];
        if (items.length === 0) return null;
        const CatIcon = getAutomationIcon(cat.icon);
        return (
          <section key={cat.value} className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CatIcon className="h-3.5 w-3.5" /> {cat.label}
              <Badge variant="outline" className="text-[10px]">
                {items.length}
              </Badge>
            </h3>
            <div className="grid gap-2 md:grid-cols-2">
              {items.map((t) => {
                const Icon = getAutomationIcon(t.icon);
                return (
                  <Card key={t.id} className="border bg-card/50">
                    <CardContent className="flex items-start gap-3 p-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor: `${t.color ?? "#0EA5E9"}20`, color: t.color ?? "#0EA5E9" }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{t.name}</p>
                        {t.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {t.description}
                          </p>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-7 px-2 text-xs"
                          disabled={apply.isPending}
                          onClick={async () => {
                            const id = await apply.mutateAsync(t);
                            onApplied?.(id);
                          }}
                        >
                          Usar template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
