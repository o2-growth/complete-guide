import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

export interface DashboardTask {
  id: string;
  title: string;
  code: string | null;
  priority: "none" | "low" | "medium" | "high" | "urgent";
  status_id: string | null;
  type_id: string | null;
  assignee_id: string | null;
  project_id: string;
  due_at: string | null;
  done_at: string | null;
  created_at: string;
  updated_at: string;
  estimate_minutes: number | null;
  spent_minutes: number;
}

export type DateRange = "7d" | "30d" | "90d";

function rangeStart(range: DateRange) {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useDashboardData(range: DateRange) {
  const { tenantId, loading: wsLoading } = useWorkspace();

  return useQuery({
    queryKey: ["dashboard", tenantId, range],
    enabled: !wsLoading && !!tenantId,
    queryFn: async () => {
      const since = rangeStart(range).toISOString();

      const [tasksRes, statusesRes, typesRes, projectsRes, profilesRes, timeRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("id,title,code,priority,status_id,type_id,assignee_id,project_id,due_at,done_at,created_at,updated_at,estimate_minutes,spent_minutes")
          .eq("tenant_id", tenantId!)
          .eq("archived", false)
          .gte("created_at", since)
          .limit(1000),
        supabase.from("task_statuses").select("id,name,slug,color,is_done").eq("tenant_id", tenantId!),
        supabase.from("task_types").select("id,name,slug,color,icon").eq("tenant_id", tenantId!),
        supabase.from("projects").select("id,name,key,color").eq("tenant_id", tenantId!),
        supabase.from("profiles").select("id,full_name,display_name,avatar_url"),
        supabase
          .from("time_entries")
          .select("id,task_id,user_id,minutes,started_at,ended_at")
          .eq("tenant_id", tenantId!)
          .gte("started_at", since)
          .limit(1000),
      ]);

      if (tasksRes.error) throw tasksRes.error;

      return {
        tasks: (tasksRes.data ?? []) as DashboardTask[],
        statuses: statusesRes.data ?? [],
        types: typesRes.data ?? [],
        projects: projectsRes.data ?? [],
        profiles: profilesRes.data ?? [],
        timeEntries: timeRes.data ?? [],
        since,
      };
    },
  });
}