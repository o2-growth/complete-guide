import { Pencil, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Audience } from "@/hooks/useAudiences";
import type { Persona } from "@/hooks/usePersonas";

const CHANNEL_LABEL: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  email: "Email",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  whatsapp: "WhatsApp",
};

interface AudienceCardProps {
  audience: Audience;
  personas: Persona[];
  onEdit: (a: Audience) => void;
  onDelete: (a: Audience) => void;
}

export function AudienceCard({ audience, personas, onEdit, onDelete }: AudienceCardProps) {
  const linked = personas.filter((p) => audience.persona_ids.includes(p.id));

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{audience.name}</h3>
            {audience.description && (
              <p className="line-clamp-2 text-xs text-muted-foreground">{audience.description}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onEdit(audience)}
              aria-label={`Editar ${audience.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(audience)}
              aria-label={`Remover ${audience.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {linked.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Personas
            </p>
            <div className="flex flex-wrap gap-1">
              {linked.map((p) => (
                <Badge
                  key={p.id}
                  variant="secondary"
                  className="text-[10px]"
                  style={{ borderLeft: `3px solid ${p.color}` }}
                >
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {audience.channels.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Canais
            </p>
            <div className="flex flex-wrap gap-1">
              {audience.channels.map((c) => (
                <Badge key={c} variant="outline" className="text-[10px]">
                  {CHANNEL_LABEL[c] ?? c}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {audience.size_estimate != null && (
          <div className="text-xs text-muted-foreground">
            Tamanho estimado: <span className="font-medium text-foreground">{audience.size_estimate.toLocaleString("pt-BR")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
