import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tree, type NodeApi, type NodeRendererProps, type MoveHandler } from "react-arborist";
import {
  ChevronRight,
  ChevronDown,
  FolderKanban,
  Plus,
  Pencil,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useProjectTree, type ProjectTreeNode } from "@/hooks/useProjectTree";

interface NewProjectDialogState {
  open: boolean;
  parentId: string | null;
}

export function ProjectTreeSidebar({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const { tree, isLoading, mutateMove, mutateRename, mutateCreate, maxDepth } = useProjectTree();
  const [newProject, setNewProject] = useState<NewProjectDialogState>({ open: false, parentId: null });
  const [newName, setNewName] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  // react-arborist espera array com children opcional; nossa forma já bate.
  const data = useMemo(() => tree, [tree]);

  const handleMove: MoveHandler<ProjectTreeNode> = ({ dragIds, parentId, index }) => {
    const id = dragIds[0];
    if (!id) return;
    mutateMove.mutate({ id, parentId: parentId ?? null, sortOrder: index ?? 0 });
  };

  const handleRename = ({ id, name }: { id: string; name: string }) => {
    mutateRename.mutate({ id, name });
  };

  const openNewProject = (parentId: string | null) => {
    setNewName("");
    setNewProject({ open: true, parentId });
  };

  const submitNewProject = async () => {
    if (!newName.trim()) return;
    await mutateCreate.mutateAsync({ name: newName.trim(), parentId: newProject.parentId });
    setNewProject({ open: false, parentId: null });
    setNewName("");
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        <Button
          size="icon"
          variant="ghost"
          aria-label="Novo projeto"
          onClick={() => openNewProject(null)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="px-1">
      <div className="flex items-center justify-between px-2 pb-1">
        <span className="text-xs font-medium text-sidebar-foreground/70">Projetos</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          aria-label="Novo projeto"
          onClick={() => openNewProject(null)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div ref={containerRef} className="min-h-[120px]">
        {isLoading ? (
          <div className="px-2 py-1 text-xs text-muted-foreground">Carregando…</div>
        ) : data.length === 0 ? (
          <div className="px-2 py-2 text-xs text-muted-foreground">
            Nenhum projeto ainda. Crie o primeiro acima.
          </div>
        ) : (
          <Tree<ProjectTreeNode>
            data={data}
            openByDefault={false}
            width={232}
            height={Math.min(360, Math.max(160, data.length * 28))}
            indent={16}
            rowHeight={28}
            onMove={handleMove}
            onRename={handleRename}
            disableDrop={({ parentNode, dragNodes }) => {
              if (!parentNode) return false;
              const draggingDepth = dragNodes[0]?.level ?? 0;
              return parentNode.level + 1 + draggingDepth > maxDepth;
            }}
          >
            {(props) => (
              <ProjectNode
                {...props}
                onAddChild={(id) => openNewProject(id)}
                onNavigate={(id) => navigate(`/app/projetos/${id}`)}
              />
            )}
          </Tree>
        )}
      </div>

      <Dialog
        open={newProject.open}
        onOpenChange={(o) => setNewProject((s) => ({ ...s, open: o }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newProject.parentId ? "Nova pasta dentro deste projeto" : "Novo projeto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-project-name">Nome</Label>
            <Input
              id="new-project-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Lançamento Q3"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) submitNewProject();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProject({ open: false, parentId: null })}>
              Cancelar
            </Button>
            <Button onClick={submitNewProject} disabled={!newName.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProjectNodeProps extends NodeRendererProps<ProjectTreeNode> {
  onAddChild: (parentId: string) => void;
  onNavigate: (id: string) => void;
}

function ProjectNode({ node, style, dragHandle, onAddChild, onNavigate }: ProjectNodeProps) {
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    if (node.isEditing) return;
    if (hasChildren) {
      // Click no chevron toggles; click no rótulo navega.
      if ((e.target as HTMLElement).dataset.role === "chevron") {
        node.toggle();
        return;
      }
    }
    onNavigate(node.id);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={dragHandle}
          style={style}
          className={`group flex items-center gap-1 rounded px-1 text-sm hover:bg-sidebar-accent ${
            node.isSelected ? "bg-sidebar-accent" : ""
          }`}
          onClick={handleClick}
          role="treeitem"
          aria-expanded={hasChildren ? node.isOpen : undefined}
        >
          <button
            type="button"
            data-role="chevron"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) node.toggle();
            }}
            className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground"
            aria-label={node.isOpen ? "Recolher" : "Expandir"}
          >
            {hasChildren ? (
              node.isOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )
            ) : null}
          </button>
          <FolderKanban
            className="h-3.5 w-3.5 shrink-0"
            style={node.data.color ? { color: node.data.color } : undefined}
          />
          {node.isEditing ? (
            <input
              autoFocus
              defaultValue={node.data.name}
              onBlur={(e) => node.submit(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") node.submit(e.currentTarget.value);
                if (e.key === "Escape") node.reset();
              }}
              className="flex-1 rounded bg-background px-1 text-sm"
            />
          ) : (
            <span className="flex-1 truncate">{node.data.name}</span>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => node.edit()}>
          <Pencil className="mr-2 h-3.5 w-3.5" /> Renomear
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onAddChild(node.id)}>
          <FolderPlus className="mr-2 h-3.5 w-3.5" /> Nova pasta dentro
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onNavigate(node.id)}>
          <FolderKanban className="mr-2 h-3.5 w-3.5" /> Abrir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
