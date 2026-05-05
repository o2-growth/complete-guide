import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { slugifyDemand } from "./DemandFormDialog.utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  slug: string;
  description: string;
  onTitleChange: (s: string) => void;
  onSlugChange: (s: string) => void;
  onDescriptionChange: (s: string) => void;
  onSubmit: () => void;
}

export function DemandFormDialog({
  open,
  onOpenChange,
  title,
  slug,
  description,
  onTitleChange,
  onSlugChange,
  onDescriptionChange,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo formulário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo formulário público</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => {
                onTitleChange(e.target.value);
                if (!slug) onSlugChange(slugifyDemand(e.target.value));
              }}
              placeholder="Ex: Solicitar post no Instagram"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug (URL pública)</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">/solicitar/</span>
              <Input
                value={slug}
                onChange={(e) => onSlugChange(slugifyDemand(e.target.value))}
                placeholder="post-instagram"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              placeholder="Explique para quem está solicitando"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
