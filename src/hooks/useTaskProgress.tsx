import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Atualiza tasks.progress_pct (smallint 0-100).
 */
export function useUpdateTaskProgress(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pct: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(pct)));
      const { error } = await supabase
        .from("tasks")
        .update({ progress_pct: clamped })
        .eq("id", taskId);
      if (error) throw error;
      return clamped;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error("Erro ao salvar progresso: " + e.message),
  });
}
