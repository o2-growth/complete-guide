import { useEffect, useRef } from "react";
import type { Editor, Range } from "@tiptap/core";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useQueryClient } from "@tanstack/react-query";
import type { TaskRow } from "@/hooks/useTasks";

interface Props {
  editor: Editor;
  range: Range;
  task: TaskRow | null;
  onDone: () => void;
}

function formatBytes(b: number | null | undefined) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentCommand({ editor, range, task, onDone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!task) {
      toast.error("Anexos só funcionam dentro de tarefas");
      editor.chain().focus().deleteRange(range).run();
      onDone();
      return;
    }
    if (!triggeredRef.current) {
      triggeredRef.current = true;
      // Limpa o "/anexo" antes de abrir o picker
      editor.chain().focus().deleteRange(range).run();
      // Aguarda render do input invisível
      requestAnimationFrame(() => inputRef.current?.click());
    }
  }, [task, editor, range, onDone]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task || !user || !tenantId) {
      onDone();
      return;
    }
    try {
      if (file.size > 25 * 1024 * 1024) {
        toast.error("Arquivo maior que 25MB");
        onDone();
        return;
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${tenantId}/task-rich/${task.id}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("attachments")
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type || undefined,
        });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("attachments").insert({
        tenant_id: tenantId,
        task_id: task.id,
        bucket: "attachments",
        path,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: user.id,
      });
      if (insErr) throw insErr;

      const { data: signed } = await supabase.storage
        .from("attachments")
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      const url = signed?.signedUrl ?? "#";
      const isImage = (file.type || "").startsWith("image/");

      if (isImage) {
        editor
          .chain()
          .focus()
          .insertContent(`<p><img src="${url}" alt="${file.name}" /></p>`)
          .run();
      } else {
        const label = `${file.name} (${formatBytes(file.size)})`;
        editor
          .chain()
          .focus()
          .insertContent(
            `<p><a href="${url}" target="_blank" rel="noreferrer">📎 ${label}</a></p>`,
          )
          .run();
      }

      qc.invalidateQueries({ queryKey: ["attachments", task.id] });
      toast.success("Arquivo anexado");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "erro desconhecido";
      toast.error("Upload falhou: " + msg);
    } finally {
      onDone();
    }
  };

  return (
    <input
      ref={inputRef}
      type="file"
      accept="*/*"
      className="hidden"
      onChange={handleChange}
      onCancel={() => onDone()}
    />
  );
}
