import { Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

interface PersonaCardProps {
  persona: Persona;
  onEdit: (p: Persona) => void;
  onDelete: (p: Persona) => void;
}

export function PersonaCard({ persona, onEdit, onDelete }: PersonaCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: persona.color }} aria-hidden />
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 ring-2" style={{ boxShadow: `0 0 0 2px ${persona.color}` }}>
            <AvatarImage src={persona.avatar_url ?? undefined} alt={persona.name} />
            <AvatarFallback style={{ background: persona.color, color: "white" }}>
              {initials(persona.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{persona.name}</h3>
            <p className="text-xs text-muted-foreground">
              {[persona.age_range, persona.occupation].filter(Boolean).join(" · ") || "Sem perfil definido"}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onEdit(persona)}
              aria-label={`Editar ${persona.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(persona)}
              aria-label={`Remover ${persona.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {persona.bio && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{persona.bio}</p>
        )}

        {persona.channels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {persona.channels.map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px]">
                {CHANNEL_LABEL[c] ?? c}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Dores
            </p>
            <p className="mt-0.5 truncate">
              {persona.pain_points.length > 0 ? `${persona.pain_points.length} mapeadas` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Objetivos
            </p>
            <p className="mt-0.5 truncate">
              {persona.goals.length > 0 ? `${persona.goals.length} mapeados` : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
