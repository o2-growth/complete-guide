import { Pencil, Pin, PinOff, Star, Trash2, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TEMPLATE_KIND_LABELS, type UnifiedTemplate } from "@/hooks/useUnifiedTemplates";

interface Props {
  template: UnifiedTemplate;
  onUse?: (template: UnifiedTemplate) => void;
  onEdit?: (template: UnifiedTemplate) => void;
  onDelete?: (template: UnifiedTemplate) => void;
  onTogglePin?: (template: UnifiedTemplate) => void;
}

export function TemplateCard({ template, onUse, onEdit, onDelete, onTogglePin }: Props) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {template.is_pinned && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-label="Fixado" />}
            <h3 className="truncate font-semibold leading-tight">{template.name}</h3>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className="text-[10px]">
              {TEMPLATE_KIND_LABELS[template.kind]}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {template.use_count} usos
            </Badge>
            {template.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">
                #{t}
              </Badge>
            ))}
          </div>
        </div>
        {onTogglePin && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={() => onTogglePin(template)}
            aria-label={template.is_pinned ? "Desafixar" : "Fixar"}
          >
            {template.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>

      {template.description && (
        <p className="line-clamp-3 text-xs text-muted-foreground">{template.description}</p>
      )}

      <div className="mt-auto flex items-center gap-2">
        {onUse && (
          <Button size="sm" className="h-8 flex-1" onClick={() => onUse(template)}>
            <Wand2 className="mr-1.5 h-3.5 w-3.5" /> Usar
          </Button>
        )}
        {onEdit && (
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(template)} aria-label="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDelete(template)} aria-label="Excluir">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </Card>
  );
}
