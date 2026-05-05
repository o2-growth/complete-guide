import { useEffect, useRef, useState } from "react";
import type { Editor, Range } from "@tiptap/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { Loader2, FileText, ListTodo, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/useWorkspace";

interface Props {
  editor: Editor;
  range: Range;
  onDone: () => void;
}

interface WikiHit {
  id: string;
  title: string;
}

export function LinkedItemCommand({ editor, range, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const consumedRef = useRef(false);
  const { tenantId } = useWorkspace();
  const { results, loading } = useGlobalSearch(search);

  useEffect(() => {
    if (!consumedRef.current) {
      consumedRef.current = true;
      editor.chain().focus().deleteRange(range).run();
      setOpen(true);
    }
  }, [editor, range]);

  const { data: wikiHits } = useQuery({
    queryKey: ["rich-editor-wiki-search", tenantId, search],
    enabled: !!tenantId && search.trim().length >= 2,
    queryFn: async (): Promise<WikiHit[]> => {
      const { data, error } = await supabase
        .from("wiki_pages")
        .select("id, title")
        .eq("tenant_id", tenantId!)
        .ilike("title", `%${search.trim()}%`)
        .limit(6);
      if (error) throw error;
      return (data ?? []) as WikiHit[];
    },
  });

  const close = () => {
    setOpen(false);
    onDone();
  };

  const insert = (title: string, href: string) => {
    editor
      .chain()
      .focus()
      .insertContent(`<p><a href="${href}">📎 ${escapeHtml(title)}</a></p>`)
      .run();
    close();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vincular tarefa ou nota</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tarefa ou nota… (mín. 2 letras)"
        />
        <div className="max-h-72 overflow-auto">
          {loading ? (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
            </div>
          ) : (
            <ul className="space-y-1">
              {results.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => insert(r.title, r.href)}
                    className="flex w-full items-start gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted"
                  >
                    {r.kind === "post" ? (
                      <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ListTodo className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-medium">{r.title}</div>
                      {r.subtitle && (
                        <div className="truncate text-[11px] text-muted-foreground">
                          {r.subtitle}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
              {(wikiHits ?? []).map((w) => (
                <li key={`wiki-${w.id}`}>
                  <button
                    type="button"
                    onClick={() => insert(w.title, `/app/conhecimento?page=${w.id}`)}
                    className="flex w-full items-start gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{w.title}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        Nota
                      </div>
                    </div>
                  </button>
                </li>
              ))}
              {!loading &&
                results.length === 0 &&
                (wikiHits?.length ?? 0) === 0 &&
                search.trim().length >= 2 && (
                  <p className="p-2 text-sm text-muted-foreground">
                    Nada encontrado.
                  </p>
                )}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
