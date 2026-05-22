import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import type { Database } from "@/integrations/supabase/types";

type ActivityKind = Database["public"]["Enums"]["activity_kind"];

export interface TaskActivityEvent {
  id: string;
  kind: ActivityKind;
  actorId: string | null;
  actorName: string;
  actorEmail: string | null;
  createdAt: string;
  payload: Record<string, unknown> | null;
  /** Frase pronta pra exibir, ex: "criou esta tarefa". */
  label: string;
}

function labelFor(kind: ActivityKind, payload: Record<string, unknown> | null): string {
  switch (kind) {
    case "created":
      return "criou esta tarefa";
    case "updated": {
      const fields = payload?.fields as string[] | undefined;
      if (fields && fields.length > 0) {
        return `atualizou ${fields.join(", ")}`;
      }
      return "atualizou a tarefa";
    }
    case "status_changed": {
      const to = payload?.to as string | undefined;
      return to ? `mudou status para ${to}` : "mudou o status";
    }
    case "assigned": {
      const to = payload?.assignee_name as string | undefined;
      return to ? `atribuiu para ${to}` : "atribuiu a tarefa";
    }
    case "commented":
      return "comentou";
    case "deleted":
      return "removeu a tarefa";
    case "attached":
      return "anexou um arquivo";
    case "time_logged": {
      const min = payload?.minutes as number | undefined;
      return min ? `registrou ${min}min` : "registrou tempo";
    }
    default:
      return String(kind);
  }
}

/**
 * Busca a sequência de eventos da tabela activities pra uma task.
 * Resolve nome do actor batendo o id contra tenant_members em memória
 * (evita join no banco e reusa o cache do hook useTenantMembers).
 */
export function useTaskActivity(taskId: string | null) {
  const { data: members = [] } = useTenantMembers();
  const memberMap = new Map(
    members.map((m) => [
      m.id,
      { name: m.display_name || m.full_name || m.email || "—", email: m.email },
    ]),
  );

  return useQuery({
    queryKey: ["task-activity", taskId],
    enabled: !!taskId,
    staleTime: 15_000,
    queryFn: async (): Promise<TaskActivityEvent[]> => {
      const { data, error } = await supabase
        .from("activities")
        .select("id, kind, actor_id, payload, created_at")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((row) => {
        const actor = row.actor_id ? memberMap.get(row.actor_id) : null;
        const payload = (row.payload as Record<string, unknown> | null) ?? null;
        return {
          id: row.id,
          kind: row.kind,
          actorId: row.actor_id,
          actorName: actor?.name ?? "Sistema",
          actorEmail: actor?.email ?? null,
          createdAt: row.created_at,
          payload,
          label: labelFor(row.kind, payload),
        };
      });
    },
  });
}
