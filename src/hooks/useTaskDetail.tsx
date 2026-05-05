import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import type { TaskRow } from "@/hooks/useTasks";

export interface CommentRow {
  id: string;
  task_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  mentions: string[] | null;
  created_at: string;
  updated_at: string;
  author?: { display_name: string | null; avatar_url: string | null; email: string | null };
}

export interface AttachmentRow {
  id: string;
  tenant_id: string;
  task_id: string | null;
  bucket: string;
  path: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export function useTask(taskId: string | null) {
  return useQuery({
    queryKey: ["task", taskId],
    enabled: !!taskId,
    queryFn: async (): Promise<TaskRow | null> => {
      const { data, error } = await supabase.from("tasks").select("*").eq("id", taskId!).maybeSingle();
      if (error) throw error;
      return data as TaskRow | null;
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<TaskRow> }) => {
      const { error } = await supabase.from("tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["task", vars.id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error("Erro ao salvar: " + e.message),
  });
}

export function useComments(taskId: string | null) {
  return useQuery({
    queryKey: ["comments", taskId],
    enabled: !!taskId,
    queryFn: async (): Promise<CommentRow[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as CommentRow[];
      const ids = Array.from(new Set(rows.map((r) => r.author_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, email")
          .in("id", ids);
        const byId = new Map((profs ?? []).map((p) => [p.id, p]));
        rows.forEach((r) => {
          const p = byId.get(r.author_id);
          if (p) r.author = { display_name: p.display_name, avatar_url: p.avatar_url, email: p.email };
        });
      }
      return rows;
    },
  });
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (body: string) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("comments")
        .insert({ task_id: taskId, author_id: user.id, body });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", taskId] }),
    onError: (e: Error) => toast.error("Erro ao comentar: " + e.message),
  });
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", taskId] }),
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useAttachments(taskId: string | null) {
  return useQuery({
    queryKey: ["attachments", taskId],
    enabled: !!taskId,
    queryFn: async (): Promise<AttachmentRow[]> => {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AttachmentRow[];
    },
  });
}

export function useUploadAttachment(taskId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!user || !tenantId) throw new Error("Workspace não carregado");
      if (file.size > 25 * 1024 * 1024) throw new Error("Arquivo maior que 25MB");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${tenantId}/${taskId}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from("attachments").upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
      });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("attachments").insert({
        tenant_id: tenantId,
        task_id: taskId,
        bucket: "attachments",
        path,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: user.id,
      });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      toast.success("Arquivo anexado");
      qc.invalidateQueries({ queryKey: ["attachments", taskId] });
    },
    onError: (e: Error) => toast.error("Upload falhou: " + e.message),
  });
}

export function useDeleteAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (att: AttachmentRow) => {
      await supabase.storage.from(att.bucket).remove([att.path]);
      const { error } = await supabase.from("attachments").delete().eq("id", att.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Arquivo removido");
      qc.invalidateQueries({ queryKey: ["attachments", taskId] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export async function getSignedUrl(bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export function getChecklist(task: TaskRow | null | undefined): ChecklistItem[] {
  const raw = (task as unknown as { checklist?: unknown })?.checklist;
  if (!Array.isArray(raw)) return [];
  return raw as ChecklistItem[];
}

export function useSubtasks(parentId: string | null) {
  return useQuery({
    queryKey: ["subtasks", parentId],
    enabled: !!parentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, code, title, done_at, priority, due_at, status_id")
        .eq("parent_task_id", parentId!)
        .eq("archived", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateSubtask(parentTask: TaskRow) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (title: string) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("tasks").insert({
        tenant_id: parentTask.tenant_id,
        project_id: parentTask.project_id,
        parent_task_id: parentTask.id,
        title,
        priority: "none",
        reporter_id: user.id,
        created_by: user.id,
        number: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtasks", parentTask.id] }),
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}