import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
}

export function useCommentReactions(commentIds: string[]) {
  return useQuery({
    queryKey: ["comment_reactions", commentIds.join(",")],
    enabled: commentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comment_reactions")
        .select("*")
        .in("comment_id", commentIds);
      if (error) throw error;
      return (data ?? []) as unknown as CommentReaction[];
    },
  });
}

export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, emoji }: { commentId: string; emoji: string }) => {
      const { data, error } = await supabase.rpc("toggle_comment_reaction", {
        _comment_id: commentId,
        _emoji: emoji,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comment_reactions"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useEditComment(taskId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => {
      if (!user) throw new Error("auth");
      const { error } = await supabase
        .from("comments")
        .update({ body, edited_at: new Date().toISOString() })
        .eq("id", id)
        .eq("author_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", taskId] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReplyComment(taskId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ parentId, body }: { parentId: string; body: string }) => {
      if (!user) throw new Error("auth");
      const mentions = Array.from(body.matchAll(/@(\w[\w.-]*)/g)).map(m => m[1]);
      const { error } = await supabase
        .from("comments")
        .insert({ task_id: taskId, author_id: user.id, body, parent_id: parentId, mentions });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", taskId] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
