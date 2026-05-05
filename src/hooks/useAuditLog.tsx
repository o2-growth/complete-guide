import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { queryProfile } from "@/lib/query-config";

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

      type ActorRow = { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null };
      type TaskMini = { id: string; title: string | null; code: string | null };
      type ProjectMini = { id: string; name: string | null; key: string | null };

      const [actors, tasks, projects] = await Promise.all([
        actorIds.length
          ? supabase.from("profiles").select("id, display_name, full_name, avatar_url").in("id", actorIds)
          : Promise.resolve({ data: [] as ActorRow[] }),
        taskIds.length
          ? supabase.from("tasks").select("id, title, code").in("id", taskIds)
          : Promise.resolve({ data: [] as TaskMini[] }),
        projectIds.length
          ? supabase.from("projects").select("id, name, key").in("id", projectIds)
          : Promise.resolve({ data: [] as ProjectMini[] }),
      ]);

      const actorMap = new Map(((actors.data ?? []) as ActorRow[]).map((a) => [a.id, a]));
      const taskMap = new Map(((tasks.data ?? []) as TaskMini[]).map((t) => [t.id, t]));
      const projectMap = new Map(((projects.data ?? []) as ProjectMini[]).map((p) => [p.id, p]));

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

const AUDIT_PAGE_SIZE = 50;

export interface AuditPage {
  rows: AuditEntry[];
  nextCursor: string | undefined;
}

/**
 * Versão paginada do audit log. Cursor é o `created_at` (ISO) da última row,
 * usando .lt() para a próxima página. Search/filtros do tipo `search` ficam
 * client-side sobre as páginas já carregadas (filtro server-side só por
 * `kind`/`actorId`/`projectId`).
 */
export function useAuditLogInfinite(filters: Omit<AuditFilters, "limit"> = {}) {
  const { tenantId } = useWorkspace();

  return useInfiniteQuery({
    ...queryProfile("workload"),
    queryKey: [
      "audit-log-infinite",
      tenantId,
      filters.kind ?? "all",
      filters.actorId ?? "all",
      filters.projectId ?? "all",
    ],
    enabled: !!tenantId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: AuditPage) => lastPage.nextCursor,
    queryFn: async ({ pageParam }): Promise<AuditPage> => {
      let q = supabase
        .from("activities")
        .select("id, created_at, kind, actor_id, task_id, project_id, payload")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(AUDIT_PAGE_SIZE);

      if (pageParam) q = q.lt("created_at", pageParam);
      if (filters.kind && filters.kind !== "all") q = q.eq("kind", filters.kind);
      if (filters.actorId && filters.actorId !== "all") q = q.eq("actor_id", filters.actorId);
      if (filters.projectId && filters.projectId !== "all") q = q.eq("project_id", filters.projectId);

      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as AuditEntry[];

      const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean) as string[])];
      const taskIds = [...new Set(rows.map((r) => r.task_id).filter(Boolean) as string[])];
      const projectIds = [...new Set(rows.map((r) => r.project_id).filter(Boolean) as string[])];

      type ActorRow = { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null };
      type TaskMini = { id: string; title: string | null; code: string | null };
      type ProjectMini = { id: string; name: string | null; key: string | null };

      const [actors, tasks, projects] = await Promise.all([
        actorIds.length
          ? supabase.from("profiles").select("id, display_name, full_name, avatar_url").in("id", actorIds)
          : Promise.resolve({ data: [] as ActorRow[] }),
        taskIds.length
          ? supabase.from("tasks").select("id, title, code").in("id", taskIds)
          : Promise.resolve({ data: [] as TaskMini[] }),
        projectIds.length
          ? supabase.from("projects").select("id, name, key").in("id", projectIds)
          : Promise.resolve({ data: [] as ProjectMini[] }),
      ]);

      const actorMap = new Map(((actors.data ?? []) as ActorRow[]).map((a) => [a.id, a]));
      const taskMap = new Map(((tasks.data ?? []) as TaskMini[]).map((t) => [t.id, t]));
      const projectMap = new Map(((projects.data ?? []) as ProjectMini[]).map((p) => [p.id, p]));

      const enriched = rows.map((r) => ({
        ...r,
        actor: r.actor_id ? actorMap.get(r.actor_id) ?? null : null,
        task: r.task_id ? taskMap.get(r.task_id) ?? null : null,
        project: r.project_id ? projectMap.get(r.project_id) ?? null : null,
      })) as AuditEntry[];

      const nextCursor =
        rows.length === AUDIT_PAGE_SIZE ? rows[rows.length - 1].created_at : undefined;

      return { rows: enriched, nextCursor };
    },
  });
}

export function useAuditActors() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["audit-actors", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data: members, error: e1 } = await supabase
        .from("tenant_members")
        .select("user_id")
        .eq("tenant_id", tenantId!);
      if (e1) throw e1;
      const userIds = [...new Set((members ?? []).map((m) => m.user_id).filter(Boolean) as string[])];
      if (!userIds.length) return [] as Array<{ id: string; display_name: string | null; full_name: string | null; avatar_url: string | null }>;
      const { data: profiles, error: e2 } = await supabase
        .from("profiles")
        .select("id, display_name, full_name, avatar_url")
        .in("id", userIds);
      if (e2) throw e2;
      return profiles ?? [];
    },
  });
}
