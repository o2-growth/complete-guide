import { useMemo, useState } from "react";
import { Search, Star, Wand2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TEMPLATE_KIND_LABELS,
  useUnifiedTemplates,
  useUseTemplate,
  type TemplateBody,
  type TemplateKind,
  type UnifiedTemplate,
} from "@/hooks/useUnifiedTemplates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: TemplateKind;
  title?: string;
  /**
   * Recebe o body já pronto pra aplicar. Receber também o template completo
   * pra quem quiser ler nome/tags etc.
   */
  onSelect: (body: TemplateBody, template: UnifiedTemplate) => void;
}

export function TemplatePicker({ open, onOpenChange, kind, title, onSelect }: Props) {
  const { data = [], isLoading } = useUnifiedTemplates(kind);
  const useTpl = useUseTemplate();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    if (!norm) return data;
    return data.filter((t) => {
      return (
        t.name.toLowerCase().includes(norm) ||
        (t.description ?? "").toLowerCase().includes(norm) ||
        t.tags.some((tag) => tag.toLowerCase().includes(norm))
      );
    });
  }, [data, q]);

  const apply = async (tpl: UnifiedTemplate) => {
    const body = await useTpl.mutateAsync(tpl.id);
    onSelect(body, tpl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title ?? `Escolher modelo — ${TEMPLATE_KIND_LABELS[kind]}`}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, descrição ou tag…" className="pl-8" />
        </div>

        <ScrollArea className="h-[60vh]">
          <div className="space-y-2 pr-2">
            {isLoading && <p className="text-xs text-muted-foreground">Carregando…</p>}
            {!isLoading && filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum modelo de {TEMPLATE_KIND_LABELS[kind].toLowerCase()} encontrado.
              </p>
            )}
            {filtered.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => apply(tpl)}
                disabled={useTpl.isPending}
                className="flex w-full items-start gap-3 rounded-md border bg-background p-3 text-left transition-colors hover:border-primary disabled:opacity-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {tpl.is_pinned && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                    <span className="truncate text-sm font-semibold">{tpl.name}</span>
                  </div>
                  {tpl.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{tpl.description}</p>}
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      {tpl.use_count} usos
                    </Badge>
                    {tpl.tags.slice(0, 4).map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Wand2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
