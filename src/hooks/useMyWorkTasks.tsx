import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjects } from "@/hooks/useProjects";
import { queryProfile } from "@/lib/query-config";
import type { TaskRow } from "@/hooks/useTasks";

export type MyWorkTab = "pending" | "done" | "delegated";

export interface MyWorkGroup {
  key: string;
  label: string;
  count: number;
  tasks: Array<TaskRow & { projectName?: string }>;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
function endOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function useMyWorkTasks(tab: MyWorkTab) {
  const { user } = useAuth();
  const { tenantId, loading: wsLoading } = useWorkspace();
  const { data: projects = [] } = useProjects();

  const query = useQuery({
    ...queryProfile("workload"),
    queryKey: ["my-work", tab, user?.id, tenantId],
    enabled: !!user && !wsLoading && !!tenantId,
    queryFn: async () => {
      let q = supabase
        .from("tasks")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("archived", false)
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(300);

      if (tab === "done") {
        q = q.not("done_at", "is", null).eq("assignee_id", user!.id);
      } else if (tab === "delegated") {
        q = q
          .or(`reporter_id.eq.${user!.id},created_by.eq.${user!.id}`)
          .not("assignee_id", "is", null)
          .not("assignee_id", "eq", user!.id)
          .is("done_at", null);
      } else {
        q = q.eq("assignee_id", user!.id).is("done_at", null);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TaskRow[];
    },
  });

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects],
  );

  const groups = useMemo((): MyWorkGroup[] => {
    const rows = (query.data ?? []).map((t) => ({
      ...t,
      projectName: projectMap.get(t.project_id) ?? undefined,
    }));
    if (tab !== "pending") {
      return [{ key: "all", label: "Todas", count: rows.length, tasks: rows }];
    }

    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    const weekEnd = endOfWeek();

    const today: typeof rows = [];
    const overdue: typeof rows = [];
    const next: typeof rows = [];
    const unscheduled: typeof rows = [];

    for (const t of rows) {
      if (!t.due_at) {
        unscheduled.push(t);
        continue;
      }
      const due = new Date(t.due_at);
      if (due < todayStart) overdue.push(t);
      else if (due <= todayEnd) today.push(t);
      else if (due <= weekEnd) next.push(t);
      else unscheduled.push(t);
    }

    return [
      { key: "today", label: "Hoje", count: today.length, tasks: today },
      { key: "overdue", label: "Em atraso", count: overdue.length, tasks: overdue },
      { key: "next", label: "Próximo", count: next.length, tasks: next },
      { key: "unscheduled", label: "Não programado", count: unscheduled.length, tasks: unscheduled },
    ];
  }, [query.data, tab, projectMap]);

  return { ...query, groups };
}
