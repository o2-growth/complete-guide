import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tree, type MoveHandler, type NodeRendererProps } from "react-arborist";
import * as LucideIcons from "lucide-react";
import {
  BookOpen,
  Search as SearchIcon,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  History,
  ChevronRight,
  ChevronDown,
  FileText,
  Loader2,
  PanelLeft,
  FolderPlus,
} from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { RichEditor } from "@/components/tasks/RichEditor";
import { EmptyState } from "@/components/EmptyState";
import {
  useWikiPages,
  useWikiPage,
  useCreateWikiPage,
  useUpdateWikiPage,
  useDeleteWikiPage,
  useMoveWikiPage,
  useWikiSearch,
  useWikiVersions,
  type WikiPageNode,
  type WikiVersion,
} from "@/hooks/useWiki";

type IconName = keyof typeof LucideIcons;

function pickIcon(name: string | null | undefined) {
  if (!name) return FileText;
  const Component = (LucideIcons as unknown as Record<string, unknown>)[name as IconName];
  if (typeof Component === "function" || typeof Component === "object") {
    return Component as typeof FileText;
  }
  return FileText;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Diff lado-a-lado, simples — separa por linhas e marca add/remove via comparação direta.
function SimpleDiff({ oldBody, newBody }: { oldBody: string; newBody: string }) {
  const left = (oldBody || "").split(/\n+/);
  const right = (newBody || "").split(/\n+/);
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-destructive">
          Versão anterior
        </div>
        <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
          {left.join("\n")}
        </pre>
      </div>
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">
          Atual
        </div>
        <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
          {right.join("\n")}
        </pre>
      </div>
    </div>
  );
}

function WikiNode({
  node,
  style,
  dragHandle,
  onAddChild,
  onNavigate,
  onDelete,
}: NodeRendererProps<WikiPageNode> & {
  onAddChild: (parentId: string) => void;
  onNavigate: (slug: string) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const Icon = pickIcon(node.data.icon);

  const handleClick = (e: React.MouseEvent) => {
    if (node.isEditing) return;
    if (hasChildren && (e.target as HTMLElement).dataset.role === "chevron") {
      node.toggle();
      return;
    }
    onNavigate(node.data.slug);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={dragHandle}
          style={style}
          className={`group flex items-center gap-1 rounded px-1 text-sm hover:bg-accent/50 ${
            node.isSelected ? "bg-accent" : ""
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
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {node.isEditing ? (
            <input
              autoFocus
              defaultValue={node.data.title}
              onBlur={(e) => node.submit(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") node.submit(e.currentTarget.value);
                if (e.key === "Escape") node.reset();
              }}
              className="flex-1 rounded bg-background px-1 text-sm"
            />
          ) : (
            <span className="flex-1 truncate">{node.data.title}</span>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => node.edit()}>
          <Pencil className="mr-2 h-3.5 w-3.5" /> Renomear
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onAddChild(node.data.id)}>
          <FolderPlus className="mr-2 h-3.5 w-3.5" /> Nova subpágina
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive"
          onClick={() => onDelete(node.data.id, node.data.title)}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function WikiTree({
  onSelectSlug,
  selectedId,
}: {
  onSelectSlug: (slug: string) => void;
  selectedId: string | null;
}) {
  const { tree, isLoading, maxDepth } = useWikiPages();
  const moveMutation = useMoveWikiPage();
  const updateMutation = useUpdateWikiPage();
  const deleteMutation = useDeleteWikiPage();
  const createMutation = useCreateWikiPage();

  const [newDialog, setNewDialog] = useState<{ open: boolean; parentId: string | null }>({
    open: false,
    parentId: null,
  });
  const [newTitle, setNewTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    id: string | null;
    title: string;
  }>({ open: false, id: null, title: "" });

  const data = useMemo(() => tree, [tree]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMove: MoveHandler<WikiPageNode> = ({ dragIds, parentId, index }) => {
    const id = dragIds[0];
    if (!id) return;
    moveMutation.mutate({ id, parentId: parentId ?? null, sortOrder: index ?? 0 });
  };

  const handleRename = ({ id, name }: { id: string; name: string }) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateMutation.mutate({ id, title: trimmed });
  };

  const submitNew = async () => {
    const t = newTitle.trim();
    if (!t) return;
    const created = await createMutation.mutateAsync({
      title: t,
      parentId: newDialog.parentId,
    });
    setNewDialog({ open: false, parentId: null });
    setNewTitle("");
    if (created?.slug) onSelectSlug(created.slug);
  };

  return (
    <div className="px-1">
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-xs font-medium text-muted-foreground">Páginas</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 text-xs"
          onClick={() => {
            setNewTitle("");
            setNewDialog({ open: true, parentId: null });
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Nova
        </Button>
      </div>

      <div ref={containerRef} className="min-h-[160px]">
        {isLoading ? (
          <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando…
          </div>
        ) : data.length === 0 ? (
          <div className="px-2 py-2 text-xs text-muted-foreground">
            Nenhuma página ainda. Crie a primeira acima.
          </div>
        ) : (
          <Tree<WikiPageNode>
            data={data}
            openByDefault
            width="100%"
            height={Math.min(560, Math.max(200, data.length * 32))}
            indent={16}
            rowHeight={28}
            selection={selectedId ?? undefined}
            onMove={handleMove}
            onRename={handleRename}
            disableDrop={({ parentNode, dragNodes }) => {
              if (!parentNode) return false;
              const draggingDepth = dragNodes[0]?.level ?? 0;
              return parentNode.level + 1 + draggingDepth >= maxDepth;
            }}
          >
            {(props) => (
              <WikiNode
                {...props}
                onAddChild={(id) => {
                  setNewTitle("");
                  setNewDialog({ open: true, parentId: id });
                }}
                onNavigate={onSelectSlug}
                onDelete={(id, title) =>
                  setConfirmDelete({ open: true, id, title })
                }
              />
            )}
          </Tree>
        )}
      </div>

      <Dialog
        open={newDialog.open}
        onOpenChange={(o) => setNewDialog((s) => ({ ...s, open: o }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newDialog.parentId ? "Nova subpágina" : "Nova página"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="wiki-new-title">Título</Label>
            <Input
              id="wiki-new-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Política de aprovação de mídia paga"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTitle.trim()) submitNew();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewDialog({ open: false, parentId: null })}
            >
              Cancelar
            </Button>
            <Button onClick={submitNew} disabled={!newTitle.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmDelete.open}
        onOpenChange={(o) => setConfirmDelete((s) => ({ ...s, open: o }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir página?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete.title}" será removida. Subpáginas ficam órfãs (vão para a raiz).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete.id) deleteMutation.mutate(confirmDelete.id);
                setConfirmDelete({ open: false, id: null, title: "" });
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WikiSearchBox({ onPickSlug }: { onPickSlug: (slug: string) => void }) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(raw), 250);
    return () => clearTimeout(t);
  }, [raw]);

  const { data: hits = [], isFetching } = useWikiSearch(debounced);

  return (
    <Popover open={open && raw.trim().length >= 2} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar na wiki…"
            className="pl-8"
            aria-label="Buscar na wiki"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[420px] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[60vh] overflow-y-auto">
          {isFetching ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando…
            </div>
          ) : hits.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              Nenhum resultado para "{debounced}".
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {hits.map((h) => {
                const Icon = pickIcon(h.icon);
                return (
                  <li key={h.id}>
                    <button
                      className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent"
                      onClick={() => {
                        onPickSlug(h.slug);
                        setOpen(false);
                        setRaw("");
                      }}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{h.title}</div>
                        {h.snippet ? (
                          <div
                            className="truncate text-xs text-muted-foreground"
                            // snippet vem com <b></b> de ts_headline; sem risco real (XSS é responsabilidade do escritor; mesmo padrão de comentários)
                            dangerouslySetInnerHTML={{ __html: h.snippet }}
                          />
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function VersionsPanel({ pageId, currentBody }: { pageId: string; currentBody: string }) {
  const { data: versions = [], isLoading } = useWikiVersions(pageId);
  const [openDiff, setOpenDiff] = useState<WikiVersion | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <History className="h-4 w-4" /> Histórico (últimas 20)
      </div>
      <Separator />
      {isLoading ? (
        <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando…
        </div>
      ) : versions.length === 0 ? (
        <p className="py-3 text-xs text-muted-foreground">
          Nenhuma versão ainda. Edições serão arquivadas automaticamente.
        </p>
      ) : (
        <ul className="space-y-1">
          {versions.map((v) => (
            <li key={v.id}>
              <button
                className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left hover:bg-accent"
                onClick={() => setOpenDiff(v)}
              >
                <span className="text-xs font-medium">{v.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(v.created_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!openDiff} onOpenChange={(o) => !o && setOpenDiff(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Comparar versão de {openDiff ? formatDate(openDiff.created_at) : ""}
            </DialogTitle>
          </DialogHeader>
          {openDiff ? (
            <SimpleDiff oldBody={openDiff.body} newBody={currentBody} />
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDiff(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ConhecimentoPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { slug } = useParams<{ slug?: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: page, isLoading: pageLoading } = useWikiPage(slug ?? null);
  const updateMutation = useUpdateWikiPage();

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    if (page) {
      setDraftTitle(page.title);
      setDraftBody(page.body);
      setEditing(false);
    }
  }, [page?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!page) return;
    await updateMutation.mutateAsync({
      id: page.id,
      title: draftTitle,
      body: draftBody,
    });
    setEditing(false);
  };

  const handleSelectSlug = (s: string) => {
    navigate(`/app/conhecimento/${s}`);
    if (isMobile) setSidebarOpen(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <WikiSearchBox onPickSlug={handleSelectSlug} />
      </div>
      <ScrollArea className="flex-1 py-2">
        <WikiTree onSelectSlug={handleSelectSlug} selectedId={page?.id ?? null} />
      </ScrollArea>
    </div>
  );

  return (
    <>
      <SEO
        title="Conhecimento — Oxy Growth OS"
        description="Wiki interna do workspace: procedimentos, briefings e decisões da equipe."
      />
      <div className="flex h-[calc(100vh-3.5rem)] flex-col md:flex-row">
        {/* Sidebar desktop */}
        {!isMobile ? (
          <aside className="hidden w-72 shrink-0 border-r border-border md:flex md:flex-col">
            {sidebarContent}
          </aside>
        ) : null}

        {/* Sidebar mobile (sheet) */}
        {isMobile ? (
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <PanelLeft className="h-4 w-4" /> Páginas
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                {sidebarContent}
              </SheetContent>
            </Sheet>
            <Badge variant="outline" className="gap-1">
              <BookOpen className="h-3 w-3" /> Conhecimento
            </Badge>
          </div>
        ) : null}

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto">
          {!slug ? (
            <div className="flex h-full items-center justify-center p-6">
              <EmptyState
                icon={BookOpen}
                title="Wiki interna do workspace"
                description="Selecione uma página ao lado ou crie a primeira para começar a documentar processos, briefings e decisões da equipe."
              />
            </div>
          ) : pageLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando página…
            </div>
          ) : !page ? (
            <div className="flex h-full items-center justify-center p-6">
              <EmptyState
                icon={FileText}
                title="Página não encontrada"
                description="O endereço pode ter mudado. Use a busca no canto esquerdo."
              />
            </div>
          ) : (
            <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {editing ? (
                    <Input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="h-9 flex-1 text-base font-semibold"
                      placeholder="Título da página"
                    />
                  ) : (
                    <h1 className="truncate text-2xl font-semibold tracking-tight">
                      {page.title}
                    </h1>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowVersions((v) => !v)}
                    className="gap-1"
                    aria-pressed={showVersions}
                  >
                    <History className="h-4 w-4" /> Histórico
                  </Button>
                  {editing ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDraftTitle(page.title);
                          setDraftBody(page.body);
                          setEditing(false);
                        }}
                        className="gap-1"
                      >
                        <X className="h-4 w-4" /> Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateMutation.isPending || !draftTitle.trim()}
                        className="gap-1"
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Salvar
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="gap-1"
                    >
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                  )}
                </div>
              </div>

              <div
                className={`grid gap-6 ${
                  showVersions ? "lg:grid-cols-[1fr_280px]" : "grid-cols-1"
                }`}
              >
                <div>
                  {editing ? (
                    <Tabs defaultValue="editor" className="w-full">
                      <TabsList>
                        <TabsTrigger value="editor">Editor</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                      </TabsList>
                      <TabsContent value="editor" className="mt-3">
                        <RichEditor
                          value={draftBody}
                          onChange={setDraftBody}
                          enableMentions
                          enableInlineDatabase
                          placeholder="Digite '/' para comandos ou comece a escrever…"
                          className="min-h-[400px]"
                        />
                      </TabsContent>
                      <TabsContent value="preview" className="mt-3">
                        <Card className="p-4">
                          <RichEditor
                            value={draftBody}
                            onChange={() => undefined}
                            editable={false}
                            enableInlineDatabase
                            className="border-0 p-0"
                          />
                        </Card>
                      </TabsContent>
                    </Tabs>
                  ) : page.body ? (
                    <article className="prose prose-sm max-w-none dark:prose-invert md:prose-base">
                      <RichEditor
                        value={page.body}
                        onChange={() => undefined}
                        editable={false}
                        enableInlineDatabase
                        className="border-0 p-0"
                      />
                    </article>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Página vazia. Clique em <strong>Editar</strong> para começar.
                    </p>
                  )}
                </div>

                {showVersions ? (
                  <aside className="lg:border-l lg:pl-6">
                    <VersionsPanel pageId={page.id} currentBody={page.body} />
                  </aside>
                ) : null}
              </div>

              <p className="mt-8 text-[11px] text-muted-foreground">
                Atualizada em {formatDate(page.updated_at)}
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
