import { toast } from "sonner";
import type { WorkloadStatus } from "@/hooks/useWorkload";

/**
 * Mostra um toast de aviso quando o assignee escolhido já está em overload.
 * Não bloqueia a atribuição — apenas alerta o gestor.
 */
export function warnIfOverload(
  taskTitle: string,
  percentage: number,
  status: WorkloadStatus,
) {
  if (status !== "overload") return;
  toast.warning(`Responsável já está sobrecarregado (${percentage}%)`, {
    description: `A tarefa "${taskTitle}" foi atribuída mesmo assim — considere realocar ou redistribuir.`,
  });
}
