import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export interface RecurrenceRow {
  id: string;
  task_id: string | null;
  rrule: string;
  active: boolean;
  next_run_at: string | null;
  tenant_id: string;
}

export function useRecurrence(taskId: string | null) {
  return useQuery({
    queryKey: ["recurrence", taskId],
    enabled: !!taskId,
    queryFn: async (): Promise<RecurrenceRow | null> => {
      const { data, error } = await supabase
        .from("recurrences")
        .select("id, task_id, rrule, active, next_run_at, tenant_id")
        .eq("task_id", taskId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as RecurrenceRow | null;
    },
  });
}

export function useUpdateRecurrence(taskId: string) {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();

  return useMutation({
    mutationFn: async (rule: string | null) => {
      if (!tenantId) throw new Error("Tenant ausente");

      // Sem regra → remove recurrence se existir.
      if (!rule) {
        const { error } = await supabase.from("recurrences").delete().eq("task_id", taskId);
        if (error) throw error;
        return null;
      }

      // RRULE prefixo "RRULE:" não é necessário no banco. Limpa.
      const clean = rule.startsWith("RRULE:") ? rule.slice(6) : rule;

      // Verifica se já existe.
      const { data: existing } = await supabase
        .from("recurrences")
        .select("id")
        .eq("task_id", taskId)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from("recurrences")
          .update({ rrule: clean, active: true })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("recurrences").insert({
          task_id: taskId,
          tenant_id: tenantId,
          rrule: clean,
          active: true,
        });
        if (error) throw error;
      }
      return clean;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurrence", taskId] });
    },
    onError: (e: Error) => toast.error("Erro ao salvar recorrência: " + e.message),
  });
}
