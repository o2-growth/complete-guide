import { Copy, Loader2, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DemandForm {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

interface Props {
  loading: boolean;
  forms: DemandForm[];
  onCopyLink: (path: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onRemove: (id: string) => void;
}

export function DemandFormsList({ loading, forms, onCopyLink, onToggleActive, onRemove }: Props) {
  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }
  if (forms.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        Nenhum formulário ainda. Crie o primeiro acima.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {forms.map((f) => (
        <div
          key={f.id}
          className="flex flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">{f.title}</h3>
              {!f.active && (
                <Badge variant="outline" className="text-[10px]">
                  inativo
                </Badge>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              <span className="font-mono">/solicitar/{f.slug}</span>
              {f.description ? ` · ${f.description}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopyLink(`/solicitar/${f.slug}`)}
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Link público
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleActive(f.id, f.active)}
              title={f.active ? "Desativar" : "Ativar"}
            >
              <Power className={`h-4 w-4 ${f.active ? "text-primary" : "text-muted-foreground"}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(f.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
