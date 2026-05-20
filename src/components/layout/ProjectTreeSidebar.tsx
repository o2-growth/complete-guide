import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tree, type NodeRendererProps, type MoveHandler } from "react-arborist";
import {
  ChevronRight,
  ChevronDown,
  FolderKanban,
  Plus,
  Pencil,
  FolderPlus,
  Inbox,
  Folder,
  List as ListIcon,
  Users,
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
import { useSquads } from "@/hooks/useSquads";

interface NewProjectDialogState {
  open: boolean;
  parentId: string | null;
}

export function ProjectTreeSidebar({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const { tree, isLoading, mutateMove, mutateRename, mutateCreate, maxDepth } = useProjectTree();
  const { data: squads = [] } = useSquads();
  const [newProject, setNewProject] = useState<NewProjectDialogState>({ open: false, parentId: null });
  const [newName, setNewName] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const grouped = useMemo(() => {
    const inbox = tree.filter((n) => n.kind === "inbox");
    const bySquad = new Map<string, ProjectTreeNode[]>();
    const orphan: ProjectTreeNode[] = [];
    for (const n of tree) {
      if (n.kind === "inbox") continue;
      if (n.squad_id) {
        const arr = bySquad.get(n.squad_id) ?? [];
        arr.push(n);
        bySquad.set(n.squad_id, arr);
      } else {
        orphan.push(n);
      }
    }
    return { inbox, bySquad, orphan };
  }, [tree]);

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
        <Button size="icon" variant="ghost" aria-label="Novo projeto" onClick={() => openNewProject(null)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="px-1">
      <div className="flex items-center justify-between px-2 pb-1">
        <span className="text-xs font-medium text-sidebar-foreground/70">Espaços</span>
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

      <div ref={containerRef} className="min-h-[120px] space-y-2">
        {isLoading ? (
          <div className="px-2 py-1 text-xs text-muted-foreground">Carregando…</div>
        ) : tree.length === 0 ? (
          <div className="px-2 py-2 text-xs text-muted-foreground">
            Nenhum projeto ainda. Crie o primeiro acima.
          </div>
        ) : (
          <>
            {grouped.inbox.length > 0 && (
              <SquadGroup
                label="Caixa de entrada pessoal"
                color={null}
                icon={<Inbox className="h-3.5 w-3.5" />}
                roots={grouped.inbox}
                onMove={handleMove}
                onRename={handleRename}
                onAddChild={openNewProject}
                onNavigate={(id) => navigate(`/app/projetos/${id}`)}
                maxDepth={maxDepth}
              />
            )}
            {squads.map((s) => {
              const roots = grouped.bySquad.get(s.id) ?? [];
              if (roots.length === 0) return null;
              return (
                <SquadGroup
                  key={s.id}
                  label={s.name}
                  color={s.color}
                  icon={<Users className="h-3.5 w-3.5" />}
                  roots={roots}
                  onMove={handleMove}
                  onRename={handleRename}
                  onAddChild={openNewProject}
                  onNavigate={(id) => navigate(`/app/projetos/${id}`)}
                  maxDepth={maxDepth}
                />
              );
            })}
            {grouped.orphan.length > 0 && (
              <SquadGroup
                label="Sem espaço"
                color={null}
                icon={<FolderKanban className="h-3.5 w-3.5" />}
                roots={grouped.orphan}
                onMove={handleMove}
                onRename={handleRename}
                onAddChild={openNewProject}
                onNavigate={(id) => navigate(`/app/projetos/${id}`)}
                maxDepth={maxDepth}
              />
            )}
          </>
        )}
      </div>

      <Dialog open={newProject.open} onOpenChange={(o) => setNewProject((s) => ({ ...s, open: o }))}>
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

interface SquadGroupProps {
  label: string;
  color: string | null;
  icon: React.ReactNode;
  roots: ProjectTreeNode[];
  onMove: MoveHandler<ProjectTreeNode>;
  onRename: (args: { id: string; name: string }) => void;
  onAddChild: (parentId: string | null) => void;
  onNavigate: (id: string) => void;
  maxDepth: number;
}

function SquadGroup({ label, color, icon, roots, onMove, onRename, onAddChild, onNavigate, maxDepth }: SquadGroupProps) {
  const [open, setOpen] = useState(true);
  const count = useMemo(() => {
    let n = 0;
    const walk = (arr: ProjectTreeNode[]) => {
      n += arr.length;
      arr.forEach((c) => walk(c.children));
    };
    walk(roots);
    return n;
  }, [roots]);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/60 hover:text-sidebar-foreground/90"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span style={color ? { color } : undefined} className="flex items-center gap-1">
          {icon}
          <span className="truncate">{label}</span>
        </span>
      </button>
      {open && (
        <Tree<ProjectTreeNode>
          data={roots}
          openByDefault={false}
          width={232}
          height={Math.min(280, Math.max(60, count * 28))}
          indent={14}
          rowHeight={28}
          onMove={onMove}
          onRename={onRename}
          disableDrop={({ parentNode, dragNodes }) => {
            if (!parentNode) return false;
            const draggingDepth = dragNodes[0]?.level ?? 0;
            return parentNode.level + 1 + draggingDepth > maxDepth;
          }}
        >
          {(props) => <ProjectNode {...props} onAddChild={onAddChild} onNavigate={onNavigate} />}
        </Tree>
      )}
    </div>
  );
}

interface ProjectNodeProps extends NodeRendererProps<ProjectTreeNode> {
  onAddChild: (parentId: string) => void;
  onNavigate: (id: string) => void;
}

function ProjectNode({ node, style, dragHandle, onAddChild, onNavigate }: ProjectNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const KindIcon =
    node.data.kind === "inbox" ? Inbox : node.data.kind === "folder" || hasChildren ? Folder : ListIcon;

  const handleClick = (e: React.MouseEvent) => {
    if (node.isEditing) return;
    if (hasChildren) {
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
          <KindIcon
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