import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor, Range } from "@tiptap/core";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import type { TaskRow } from "@/hooks/useTasks";

interface TagRow {
  id: string;
  name: string;
  color: string | null;
}

interface Props {
  editor: Editor;
  range: Range;
  task: TaskRow | null;
  onDone: () => void;
}

export function TagCommand({ editor, range, task, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  const consumedRef = useRef(false);

  useEffect(() => {
    if (!consumedRef.current) {
      consumedRef.current = true;
      editor.chain().focus().deleteRange(range).run();
      setOpen(true);
    }
  }, [editor, range]);

  const { data: tags, isLoading } = useQuery({
    queryKey: ["rich-editor-tags", tenantId],
    enabled: !!tenantId && open,
    queryFn: async (): Promise<TagRow[]> => {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name, color")
        .eq("tenant_id", tenantId!)
        .order("name");
      if (error) throw error;
      return (data ?? []) as TagRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tags ?? [];
    return (tags ?? []).filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, search]);

  const showCreate =
    search.trim().length > 0 &&
    !(tags ?? []).some((t) => t.name.toLowerCase() === search.trim().toLowerCase());

  const close = () => {
    setOpen(false);
    onDone();
  };

  const insertTag = (tag: TagRow) => {
    const slug = tag.name.replace(/\s+/g, "-").toLowerCase();
    const color = tag.color ?? "#0ea5e9";
    editor
      .chain()
      .focus()
      .insertContent(
        `<span style="color:${color};font-weight:500">#${escapeHtml(slug)}</span>&nbsp;`,
      )
      .run();
    if (task) {
      void supabase
        .from("task_tags")
        .upsert({ task_id: task.id, tag_id: tag.id }, { onConflict: "task_id,tag_id" })
        .then(({ error }) => {
          if (error) toast.error("Tag não vinculada: " + error.message);
          else qc.invalidateQueries({ queryKey: ["task-tags", task.id] });
        });
    }
    close();
  };

  const create = async () => {
    if (!tenantId || !search.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({ tenant_id: tenantId, name: search.trim() })
        .select("id, name, color")
        .single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["rich-editor-tags", tenantId] });
      insertTag(data as TagRow);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "erro";
      toast.error("Erro ao criar tag: " + msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inserir tag</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ou criar tag…"
        />
        <div className="max-h-64 overflow-auto">
          {isLoading ? (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          ) : filtered.length === 0 && !showCreate ? (
            <p className="p-2 text-sm text-muted-foreground">
              Nenhuma tag encontrada.
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => insertTag(t)}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span
                      className="h-3 w-3 rounded-full border"
                      style={{ backgroundColor: t.color ?? "#0ea5e9" }}
                    />
                    <span>#{t.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {showCreate && (
          <Button
            variant="outline"
            onClick={create}
            disabled={creating}
            className="w-full justify-start"
          >
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Criar tag &quot;{search.trim()}&quot;
          </Button>
        )}
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
