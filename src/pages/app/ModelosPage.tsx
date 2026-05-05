import { useMemo, useState } from "react";
import { FileStack, Filter, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { TemplateCard } from "@/components/modelos/TemplateCard";
import { TemplateEditorDialog } from "@/components/modelos/TemplateEditorDialog";
import {
  TEMPLATE_KIND_LABELS,
  TEMPLATE_KINDS,
  useDeleteTemplate,
  useUnifiedTemplates,
  useUpdateTemplate,
  useUseTemplate,
  type TemplateKind,
  type UnifiedTemplate,
} from "@/hooks/useUnifiedTemplates";
import { toast } from "sonner";

type TabValue = "all" | TemplateKind;

export default function ModelosPage() {
  const [tab, setTab] = useState<TabValue>("all");
  const [q, setQ] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const filterKind = tab === "all" ? undefined : tab;
  const { data = [], isLoading } = useUnifiedTemplates(filterKind);

  const update = useUpdateTemplate();
  const del = useDeleteTemplate();
  const useTpl = useUseTemplate();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<UnifiedTemplate | null>(null);
  const [defaultKindForNew, setDefaultKindForNew] = useState<TemplateKind>("task_checklist");
  const [confirmDelete, setConfirmDelete] = useState<UnifiedTemplate | null>(null);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    data.forEach((t) => t.tags.forEach((tag) => s.add(tag)));
    return [...s].sort();
  }, [data]);

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    return data.filter((t) => {
      if (tagFilter && !t.tags.includes(tagFilter)) return false;
      if (!norm) return true;
      return (
        t.name.toLowerCase().includes(norm) ||
        (t.description ?? "").toLowerCase().includes(norm) ||
        t.tags.some((tag) => tag.toLowerCase().includes(norm))
      );
    });
  }, [data, q, tagFilter]);

  const openNew = () => {
    setEditing(null);
    setDefaultKindForNew(tab === "all" ? "task_checklist" : tab);
    setEditorOpen(true);
  };

  const openEdit = (tpl: UnifiedTemplate) => {
    setEditing(tpl);
    setEditorOpen(true);
  };

  const togglePin = (tpl: UnifiedTemplate) => {
    update.mutate({ id: tpl.id, patch: { is_pinned: !tpl.is_pinned } });
  };

  const useNow = async (tpl: UnifiedTemplate) => {
    // Da página de Modelos, "Usar" só registra uso e copia conteúdo relevante para o clipboard.
    // Integrações específicas (checklist em tarefa, legenda em post) usam <TemplatePicker>.
    try {
      const body = await useTpl.mutateAsync(tpl.id);
      const text = extractCopyableText(tpl.kind, body);
      if (text) {
        await navigator.clipboard.writeText(text);
        toast.success("Modelo aplicado e copiado pra área de transferência");
      } else {
        toast.success("Uso registrado");
      }
    } catch {
      // toast já tratado
    }
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileStack className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Modelos</h1>
            <p className="text-sm text-muted-foreground">
              Catálogo unificado de checklists, mensagens, briefs, legendas e formulários reutilizáveis.
            </p>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo modelo
        </Button>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">Todos</TabsTrigger>
          {TEMPLATE_KINDS.map((k) => (
            <TabsTrigger key={k} value={k}>
              {TEMPLATE_KIND_LABELS[k]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, descrição ou tag…" className="pl-8" />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Button
              size="sm"
              variant={tagFilter === null ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setTagFilter(null)}
            >
              Todas tags
            </Button>
            {allTags.slice(0, 8).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={tagFilter === t ? "default" : "outline"}
                className="h-7 text-xs"
                onClick={() => setTagFilter(tagFilter === t ? null : t)}
              >
                #{t}
              </Button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando modelos…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm font-semibold">Nenhum modelo {tab !== "all" && `de ${TEMPLATE_KIND_LABELS[tab].toLowerCase()}`} aqui ainda.</p>
          <p className="mt-1 text-xs text-muted-foreground">Crie seu primeiro modelo para reutilizá-lo nas tarefas, posts e briefings.</p>
          <Button className="mt-4" size="sm" onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Criar modelo
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{filtered.length} resultado(s)</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                onUse={useNow}
                onEdit={openEdit}
                onDelete={(t) => setConfirmDelete(t)}
                onTogglePin={togglePin}
              />
            ))}
          </div>
        </>
      )}

      <TemplateEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editing}
        defaultKind={editing ? undefined : defaultKindForNew}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O modelo "{confirmDelete?.name}" será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) del.mutate(confirmDelete.id);
                setConfirmDelete(null);
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

function extractCopyableText(kind: TemplateKind, body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  switch (kind) {
    case "message": {
      const subject = typeof b.subject === "string" ? b.subject : "";
      const main = typeof b.body === "string" ? b.body : "";
      return [subject, main].filter(Boolean).join("\n\n");
    }
    case "content_caption":
      return typeof b.text === "string" ? b.text : null;
    case "hashtag_group":
      return Array.isArray(b.tags) ? (b.tags as string[]).map((t) => `#${t}`).join(" ") : null;
    case "task_checklist":
      return Array.isArray(b.items)
        ? (b.items as Array<{ text: string; required?: boolean }>)
            .map((it) => `- [ ] ${it.text}${it.required ? " *" : ""}`)
            .join("\n")
        : null;
    case "brief":
      return [
        b.context && `Contexto: ${b.context}`,
        b.target && `Público: ${b.target}`,
        b.deliverables && `Entregáveis: ${b.deliverables}`,
        b.deadline_template && `Prazo: ${b.deadline_template}`,
      ]
        .filter(Boolean)
        .join("\n");
    default:
      return null;
  }
}
