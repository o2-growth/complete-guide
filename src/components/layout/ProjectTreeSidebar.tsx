import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  Lock,
  Unlock,
  Archive,
  Palette,
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
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useProjectTree, type ProjectTreeNode } from "@/hooks/useProjectTree";
import { useSquads } from "@/hooks/useSquads";
import {
  useArchiveProject,
  useProjectOpenCounts,
  useUpdateProjectMeta,
} from "@/hooks/useProjects";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";

const COLOR_SWATCHES = [
  "#64748b", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#a855f7", "#ec4899", "#14b8a6",
];

interface NewProjectDialogState {
  open: boolean;
  parentId: string | null;
}

export function ProjectTreeSidebar({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const { tree, isLoading, mutateMove, mutateRename, mutateCreate, maxDepth } = useProjectTree();
  const { data: squads = [] } = useSquads();
  const { data: openCounts = {} } = useProjectOpenCounts();
  const archive = useArchiveProject();
  const updateMeta = useUpdateProjectMeta();
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const [newProject, setNewProject] = useState<NewProjectDialogState>({ open: false, parentId: null });
  const [newName, setNewName] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [treeWidth, setTreeWidth] = useState(220);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      setTreeWidth(Math.max(160, el.clientWidth));
    });
    ro.observe(el);
    setTreeWidth(Math.max(160, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  // Realtime: atualiza árvore e contadores quando algo muda no tenant.
  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel(`tenant:${tenantId}:projects-tree`)
      .on("broadcast", { event: "project_change" }, () => {
        qc.invalidateQueries({ queryKey: ["project-tree", tenantId] });
        qc.invalidateQueries({ queryKey: ["projects-list", tenantId] });
      })
      .on("broadcast", { event: "task_tree_change" }, () => {
        qc.invalidateQueries({ queryKey: ["project-open-counts", tenantId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, qc]);

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

  const nodeActions = {
    setColor: (id: string, color: string) => updateMeta.mutate({ id, patch: { color } }),
    archive: (id: string) => archive.mutate({ id, archived: true }),
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
      <div className="flex items-center justify-between px-2 pb-1 pt-2">
        <span className="text-xs font-medium text-sidebar-foreground/60">Projetos</span>
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
      <NavLink
        to="/app/projetos"
        end
        className={({ isActive }) =>
          `mx-1 mb-1 flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-sidebar-accent ${
            isActive ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/80"
          }`
        }
      >
        <FolderKanban className="h-4 w-4" />
        <span className="truncate">Ver todos</span>
      </NavLink>

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
                width={treeWidth}
                onMove={handleMove}
                onRename={handleRename}
                onAddChild={openNewProject}
                onNavigate={(id) => navigate(`/app/projetos/${id}`)}
                maxDepth={maxDepth}
                openCounts={openCounts}
                onArchive={nodeActions.archive}
                onSetColor={nodeActions.setColor}
                onTogglePrivacy={(id, current) =>
                  updateMeta.mutate({ id, patch: { is_private: !current } })
                }
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
                  width={treeWidth}
                  onMove={handleMove}
                  onRename={handleRename}
                  onAddChild={openNewProject}
                  onNavigate={(id) => navigate(`/app/projetos/${id}`)}
                  maxDepth={maxDepth}
                  openCounts={openCounts}
                  onArchive={nodeActions.archive}
                  onSetColor={nodeActions.setColor}
                  onTogglePrivacy={(id, current) =>
                    updateMeta.mutate({ id, patch: { is_private: !current } })
                  }
                />
              );
            })}
            {grouped.orphan.length > 0 && (
              <SquadGroup
                label="Sem espaço"
                color={null}
                icon={<FolderKanban className="h-3.5 w-3.5" />}
                roots={grouped.orphan}
                width={treeWidth}
                onMove={handleMove}
                onRename={handleRename}
                onAddChild={openNewProject}
                onNavigate={(id) => navigate(`/app/projetos/${id}`)}
                maxDepth={maxDepth}
                openCounts={openCounts}
                onArchive={nodeActions.archive}
                onSetColor={nodeActions.setColor}
                onTogglePrivacy={(id, current) =>
                  updateMeta.mutate({ id, patch: { is_private: !current } })
                }
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
  width: number;
  onMove: MoveHandler<ProjectTreeNode>;
  onRename: (args: { id: string; name: string }) => void;
  onAddChild: (parentId: string | null) => void;
  onNavigate: (id: string) => void;
  maxDepth: number;
  openCounts: Record<string, number>;
  onArchive: (id: string) => void;
  onSetColor: (id: string, color: string) => void;
  onTogglePrivacy: (id: string, current: boolean) => void;
}

function SquadGroup({ label, color, icon, roots, width, onMove, onRename, onAddChild, onNavigate, maxDepth, openCounts, onArchive, onSetColor, onTogglePrivacy }: SquadGroupProps) {
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
          width={width}
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
          {(props) => (
            <ProjectNode
              {...props}
              onAddChild={onAddChild}
              onNavigate={onNavigate}
              openCount={openCounts[props.node.id] ?? 0}
              onArchive={onArchive}
              onSetColor={onSetColor}
              onTogglePrivacy={onTogglePrivacy}
            />
          )}
        </Tree>
      )}
    </div>
  );
}

interface ProjectNodeProps extends NodeRendererProps<ProjectTreeNode> {
  onAddChild: (parentId: string) => void;
  onNavigate: (id: string) => void;
  openCount: number;
  onArchive: (id: string) => void;
  onSetColor: (id: string, color: string) => void;
  onTogglePrivacy: (id: string, current: boolean) => void;
}

function ProjectNode({ node, style, dragHandle, onAddChild, onNavigate, openCount, onArchive, onSetColor, onTogglePrivacy }: ProjectNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isPrivate = node.data.is_private;
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
            <>
              <span className="flex-1 truncate">{node.data.name}</span>
              {isPrivate && (
                <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Privado" />
              )}
              {openCount > 0 && (
                <span className="ml-auto rounded bg-sidebar-accent px-1.5 text-[10px] font-medium tabular-nums text-sidebar-foreground/70">
                  {openCount}
                </span>
              )}
            </>
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
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Palette className="mr-2 h-3.5 w-3.5" /> Cor
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <div className="grid grid-cols-4 gap-1 p-1">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onSetColor(node.id, c)}
                  className="h-6 w-6 rounded ring-1 ring-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  aria-label={`Definir cor ${c}`}
                />
              ))}
            </div>
          </ContextMenuSubContent>
        </ContextMenuSub>
        {node.data.kind !== "inbox" && (
          <ContextMenuItem onClick={() => onTogglePrivacy(node.id, isPrivate)}>
            {isPrivate ? (
              <>
                <Unlock className="mr-2 h-3.5 w-3.5" /> Tornar público
              </>
            ) : (
              <>
                <Lock className="mr-2 h-3.5 w-3.5" /> Tornar privado
              </>
            )}
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onArchive(node.id)}
          className="text-destructive focus:text-destructive"
        >
          <Archive className="mr-2 h-3.5 w-3.5" /> Arquivar
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}