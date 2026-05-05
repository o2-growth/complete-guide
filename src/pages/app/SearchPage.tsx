import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, ListTodo, FolderKanban, MessageSquare, Paperclip,
  Pin, Trash2, Plus, History, Sparkles, ListFilter,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  applySmartListFilters,
  collectTagIds,
  type RuleGroup,
} from "@/lib/smart-list-query";
import { SavedViewsList } from "@/components/saved-views/SavedViewsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  useAdvancedSearch, useSearchHistory, useRecordSearch,
  useSavedViews, useCreateSavedView, useDeleteSavedView,
  useGroupedResults, type SearchResult,
} from "@/hooks/useGlobalSearchAdvanced";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";

const KIND_META: Record<SearchResult["kind"], { label: string; icon: typeof ListTodo; tab: string }> = {
  task: { label: "Tarefa", icon: ListTodo, tab: "tasks" },
  project: { label: "Projeto", icon: FolderKanban, tab: "projects" },
  comment: { label: "Comentário", icon: MessageSquare, tab: "comments" },
  attachment: { label: "Anexo", icon: Paperclip, tab: "attachments" },
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [saveOpen, setSaveOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const [outerTab, setOuterTab] = useState<"search" | "smart-lists">("search");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewId = searchParams.get("view");
  const smartListResults = useSmartListResults(viewId);
  const { data: results, isLoading } = useAdvancedSearch(q);

  useEffect(() => {
    if (viewId) setOuterTab("smart-lists");
  }, [viewId]);
  const { data: history } = useSearchHistory(8);
  const { data: views } = useSavedViews();
  const recordSearch = useRecordSearch();
  const createView = useCreateSavedView();
  const deleteView = useDeleteSavedView();
  const grouped = useGroupedResults(results);

  // Registra busca após resultados chegarem.
  // recordSearch é uma mutation cuja identidade muda a cada render — ignoramos
  // de propósito para que o efeito reaja só à query/resultado.
  useEffect(() => {
    if (q.trim().length >= 3 && results && !isLoading) {
      const timer = setTimeout(() => {
        recordSearch.mutate({ query: q.trim(), resultCount: results.length });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [q, results, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = (() => {
    if (!results) return [];
    if (tab === "all") return results;
    return results.filter((r) => KIND_META[r.kind].tab === tab);
  })();

  const handleSaveView = async () => {
    if (!viewName.trim() || !q.trim()) return;
    await createView.mutateAsync({
      name: viewName.trim(),
      source: "tasks",
      filters: { query: q.trim(), tab },
      icon: "Search",
      color: "#0EA5E9",
    });
    toast.success("Visão salva 📌");
    setSaveOpen(false);
    setViewName("");
  };

  const exportCSV = () => {
    if (!results?.length) return;
    const rows = [
      ["tipo", "título", "subtítulo", "url"].join(","),
      ...results.map((r) =>
        [KIND_META[r.kind].label, r.title, r.subtitle, r.url]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `busca-${q.replace(/[^a-z0-9]+/gi, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  return (
    <div className="container max-w-6xl py-6">
      <SEO title="Busca global · Oxy" description="Encontre qualquer tarefa, projeto, comentário ou anexo no workspace." />

      <div className="mb-6">
        <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
          <Search className="mr-1.5 h-3 w-3" /> Busca global
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Encontre qualquer coisa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tarefas, projetos, comentários e anexos do workspace inteiro.
        </p>
      </div>

      <Tabs
        value={outerTab}
        onValueChange={(v) => setOuterTab(v as "search" | "smart-lists")}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="search">Busca</TabsTrigger>
          <TabsTrigger value="smart-lists">
            <ListFilter className="mr-1.5 h-3.5 w-3.5" /> Saved views
          </TabsTrigger>
        </TabsList>
        <TabsContent value="smart-lists" className="mt-6">
          {viewId && smartListResults.data && (
            <div className="mb-4 rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Smart list aplicada — {smartListResults.data.length} tarefas</p>
              <ul className="mt-2 space-y-1">
                {smartListResults.data.slice(0, 30).map((t) => (
                  <li key={t.id} className="text-xs">
                    <button
                      className="hover:underline"
                      onClick={() => navigate(`/app/projetos/${t.project_id}?task=${t.id}`)}
                    >
                      {t.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <SavedViewsList />
        </TabsContent>
        <TabsContent value="search" className="mt-6">

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Digite ao menos 2 caracteres…"
                className="pl-9 h-11"
                autoFocus
              />
            </div>
            {q.trim().length >= 2 && (
              <>
                <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-11">
                      <Pin className="mr-2 h-4 w-4" /> Salvar visão
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Salvar busca como visão</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="view-name">Nome</Label>
                      <Input
                        id="view-name"
                        value={viewName}
                        onChange={(e) => setViewName(e.target.value)}
                        placeholder="Ex: Tarefas urgentes do João"
                        autoFocus
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancelar</Button>
                      <Button onClick={handleSaveView} disabled={!viewName.trim()}>Salvar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={exportCSV} className="h-11" disabled={!results?.length}>
                  CSV
                </Button>
              </>
            )}
          </div>

          {q.trim().length < 2 ? (
            <EmptyState
              icon={Sparkles}
              title="Pronto para buscar"
              description="Digite no mínimo 2 caracteres para começar. Resultados aparecem em tempo real."
            />
          ) : isLoading ? (
            <ListSkeleton rows={6} />
          ) : !results || results.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum resultado"
              description={`Nada encontrado para "${q}". Tente outros termos ou simplifique a busca.`}
            />
          ) : (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">Todos ({results.length})</TabsTrigger>
                <TabsTrigger value="tasks">Tarefas ({grouped.task.length})</TabsTrigger>
                <TabsTrigger value="projects">Projetos ({grouped.project.length})</TabsTrigger>
                <TabsTrigger value="comments">Comentários ({grouped.comment.length})</TabsTrigger>
                <TabsTrigger value="attachments">Anexos ({grouped.attachment.length})</TabsTrigger>
              </TabsList>
              <TabsContent value={tab} className="mt-4">
                <div className="space-y-2">
                  {filtered.map((r) => {
                    const M = KIND_META[r.kind];
                    return (
                      <button
                        key={`${r.kind}-${r.id}`}
                        onClick={() => navigate(r.url)}
                        className="group flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/30"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <M.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{r.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {M.label}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Sidebar: visões salvas + histórico */}
        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Pin className="h-4 w-4 text-primary" /> Visões salvas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {!views || views.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Salve uma busca pra acessar rapidamente depois.
                </p>
              ) : (
                views.map((v) => (
                  <div
                    key={v.id}
                    className="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/40"
                  >
                    <button
                      onClick={() => {
                        const f = v.filters as Record<string, unknown>;
                        if (typeof f.query === "string") setQ(f.query);
                        if (typeof f.tab === "string") setTab(f.tab);
                      }}
                      className="flex-1 truncate text-left text-sm"
                    >
                      {v.name}
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => deleteView.mutate(v.id)}
                      aria-label="Excluir visão"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4 text-primary" /> Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {!history || history.length === 0 ? (
                <p className="text-xs text-muted-foreground">Suas buscas recentes aparecem aqui.</p>
              ) : (
                history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setQ(h.query)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/40"
                  >
                    <span className="truncate">{h.query}</span>
                    <span className="text-[10px] text-muted-foreground">{h.result_count}</span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Executa as filters JSONB de uma saved_view contra a tabela tasks.
 * Pré-resolve tags em task_tags (por causa do M:N) e usa
 * applySmartListFilters para o resto.
 */
function useSmartListResults(viewId: string | null) {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["smart-list-results", viewId, tenantId],
    enabled: !!viewId && !!tenantId,
    queryFn: async () => {
      const { data: view, error } = await supabase
        .from("saved_views")
        .select("filters")
        .eq("id", viewId!)
        .single();
      if (error) throw error;
      const group = view?.filters as unknown as RuleGroup;
      if (!group || !Array.isArray(group.rules)) return [];

      const tagIds = collectTagIds(group);
      let tagFilteredTaskIds: string[] | undefined;
      if (tagIds.length) {
        const { data: tt } = await supabase
          .from("task_tags")
          .select("task_id")
          .in("tag_id", tagIds);
        tagFilteredTaskIds = Array.from(new Set((tt ?? []).map((r) => r.task_id)));
      }

      const baseQuery = supabase
        .from("tasks")
        .select("id, title, project_id, due_at, priority")
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .limit(200);
      const filtered = applySmartListFilters(
        baseQuery as never,
        group,
        tagFilteredTaskIds,
      ) as typeof baseQuery;

      const { data: rows, error: rowsErr } = await filtered;
      if (rowsErr) throw rowsErr;
      return (rows ?? []) as Array<{
        id: string;
        title: string;
        project_id: string;
        due_at: string | null;
        priority: string;
      }>;
    },
  });
}