import { useEffect, useRef, useState } from "react";
import type { Editor, Range } from "@tiptap/core";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TaskRow } from "@/hooks/useTasks";

interface Props {
  editor: Editor;
  range: Range;
  task: TaskRow | null;
  onDone: () => void;
}

export function SubtaskCommand({ editor, range, task, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();
  const consumedRef = useRef(false);

  useEffect(() => {
    if (!task) {
      toast.error("Subtarefas só funcionam dentro de tarefas");
      editor.chain().focus().deleteRange(range).run();
      onDone();
      return;
    }
    if (!consumedRef.current) {
      consumedRef.current = true;
      editor.chain().focus().deleteRange(range).run();
      setOpen(true);
    }
  }, [task, editor, range, onDone]);

  const create = async () => {
    if (!task || !user) {
      onDone();
      return;
    }
    const t = title.trim();
    if (!t) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          tenant_id: task.tenant_id,
          project_id: task.project_id,
          parent_task_id: task.id,
          title: t,
          priority: "none",
          reporter_id: user.id,
          created_by: user.id,
          number: 0,
        })
        .select("id")
        .single();
      if (error) throw error;

      const href = `/app/projetos/${task.project_id}?task=${data.id}`;
      editor
        .chain()
        .focus()
        .insertContent(
          `<p><a href="${href}">↳ ${escapeHtml(t)}</a></p>`,
        )
        .run();

      qc.invalidateQueries({ queryKey: ["subtasks", task.id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Subtarefa criada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "erro";
      toast.error("Erro ao criar subtarefa: " + msg);
    } finally {
      setBusy(false);
      setOpen(false);
      onDone();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setOpen(false);
          onDone();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova subtarefa</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !busy) {
              e.preventDefault();
              create();
            }
          }}
          placeholder="Título da subtarefa"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => { setOpen(false); onDone(); }}>
            Cancelar
          </Button>
          <Button onClick={create} disabled={busy || !title.trim()}>
            Criar
          </Button>
        </DialogFooter>
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
