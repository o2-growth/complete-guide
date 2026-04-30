import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

export type ActivityKind =
  | "created"
  | "updated"
  | "status_changed"
  | "assigned"
  | "commented"
  | "deleted"
  | "attached"
  | "time_logged";

export interface AuditEntry {
  id: string;
  created_at: string;
  kind: ActivityKind;
  actor_id: string | null;
  task_id: string | null;
  project_id: string | null;
  payload: Record<string, unknown>;
  actor?: { display_name: string | null; full_name: string | null; avatar_url: string | null } | null;
  task?: { title: string | null; code: string | null } | null;
  project?: { name: string | null; key: string | null } | null;
}

export interface AuditFilters {
  kind?: ActivityKind | "all";
  actorId?: string | "all";
  projectId?: string | "all";
  search?: string;
  limit?: number;
}

export function useAuditLog(filters: AuditFilters = {}) {
  const { tenantId } = useWorkspace();
  const limit = filters.limit ?? 200;

  return useQuery({
    queryKey: ["audit-log", tenantId, filters],
    enabled: !!tenantId,
    queryFn: async (): Promise<AuditEntry[]> => {
      let q = supabase
        .from("activities")
        .select("id, created_at, kind, actor_id, task_id, project_id, payload")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (filters.kind && filters.kind !== "all") q = q.eq("kind", filters.kind);
      if (filters.actorId && filters.actorId !== "all") q = q.eq("actor_id", filters.actorId);
      if (filters.projectId && filters.projectId !== "all") q = q.eq("project_id", filters.projectId);

      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as AuditEntry[];

      const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean) as string[])];
      const taskIds = [...new Set(rows.map((r) => r.task_id).filter(Boolean) as string[])];
      const projectIds = [...new Set(rows.map((r) => r.project_id).filter(Boolean) as string[])];

      const [actors, tasks, projects] = await Promise.all([
        actorIds.length
          ? supabase.from("profiles").select("id, display_name, full_name, avatar_url").in("id", actorIds)
          : Promise.resolve({ data: [] as any[] }),
        taskIds.length
          ? supabase.from("tasks").select("id, title, code").in("id", taskIds)
          : Promise.resolve({ data: [] as any[] }),
        projectIds.length
          ? supabase.from("projects").select("id, name, key").in("id", projectIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const actorMap = new Map((actors.data ?? []).map((a: any) => [a.id, a]));
      const taskMap = new Map((tasks.data ?? []).map((t: any) => [t.id, t]));
      const projectMap = new Map((projects.data ?? []).map((p: any) => [p.id, p]));

      let enriched = rows.map((r) => ({
        ...r,
        actor: r.actor_id ? actorMap.get(r.actor_id) ?? null : null,
        task: r.task_id ? taskMap.get(r.task_id) ?? null : null,
        project: r.project_id ? projectMap.get(r.project_id) ?? null : null,
      }));

      if (filters.search?.trim()) {
        const s = filters.search.trim().toLowerCase();
        enriched = enriched.filter(
          (e) =>
            e.task?.title?.toLowerCase().includes(s) ||
            e.task?.code?.toLowerCase().includes(s) ||
            e.project?.name?.toLowerCase().includes(s) ||
            (e.actor?.display_name ?? e.actor?.full_name ?? "").toLowerCase().includes(s)
        );
      }

      return enriched;
    },
  });
}

export function useAuditActors() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["audit-actors", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_members")
        .select("user_id, profiles:user_id(id, display_name, full_name, avatar_url)")
        .eq("tenant_id", tenantId!);
      if (error) throw error;
      return (data ?? []).map((m: any) => m.profiles).filter(Boolean);
    },
  });
}
