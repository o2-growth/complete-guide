import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Palette, Plus, Trash2, Loader2 } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/EmptyState";
import {
  useWhiteboards,
  useCreateWhiteboard,
  useDeleteWhiteboard,
} from "@/hooks/useWhiteboards";

export default function WhiteboardsPage() {
  const navigate = useNavigate();
  const { data: boards = [], isLoading } = useWhiteboards();
  const createWb = useCreateWhiteboard();
  const deleteWb = useDeleteWhiteboard();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");

  const handleCreate = async () => {
    const created = await createWb.mutateAsync({ name: name || "Sem título" });
    setName("");
    setDialogOpen(false);
    navigate(`/app/whiteboards/${created.id}`);
  };

  return (
    <div className="space-y-6 p-6">
      <SEO title="Whiteboards" description="Canvas livre para brainstorm e diagramação." />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Palette className="h-6 w-6" /> Whiteboards
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Canvas livre para diagramar fluxos, brainstorm e mapear ideias.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo whiteboard
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar whiteboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="wb-name">Nome</Label>
              <Input
                id="wb-name"
                placeholder="Ex.: Fluxo de aquisição Q3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleCreate();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createWb.isPending}>
                {createWb.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : boards.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="Sem whiteboards ainda"
          description="Crie um canvas para diagramar fluxos, mapear arquiteturas ou rascunhar ideias com o time."
          action={{
            label: "Novo whiteboard",
            icon: Plus,
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boards.map((b) => (
            <Card
              key={b.id}
              className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md"
            >
              <button
                type="button"
                className="block aspect-video w-full bg-muted/40 text-left"
                onClick={() => navigate(`/app/whiteboards/${b.id}`)}
                aria-label={`Abrir ${b.name}`}
              >
                {b.thumbnail_url ? (
                  <img
                    src={b.thumbnail_url}
                    alt={b.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                    <Palette className="h-10 w-10" />
                  </div>
                )}
              </button>
              <div className="flex items-start justify-between gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    className="block w-full truncate text-left text-sm font-medium hover:underline"
                    onClick={() => navigate(`/app/whiteboards/${b.id}`)}
                  >
                    {b.name}
                  </button>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Atualizado{" "}
                    {formatDistanceToNow(new Date(b.updated_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Excluir ${b.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir whiteboard?</AlertDialogTitle>
                      <AlertDialogDescription>
                        “{b.name}” será removido permanentemente. Essa ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteWb.mutate(b.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
