import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export type SquadKind = "ia" | "marketing" | "expansao" | "custom";
export type SquadRole = "lead" | "specialist";

export interface Squad {
  id: string;
  tenant_id: string;
  name: string;
  kind: SquadKind;
  color: string | null;
  description: string | null;
}

export interface SquadMember {
  id: string;
  squad_id: string;
  user_id: string;
  role_in_squad: SquadRole;
  capacity_hours_week: number | null;
}

export interface MemberProfile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export interface SquadWithStats extends Squad {
  members: (SquadMember & { profile: MemberProfile | null })[];
  totalCapacity: number;
  openTasks: number;
  doneLast30: number;
  overdue: number;
}

export function useSquads() {
  const { tenantId, loading } = useWorkspace();
  return useQuery({
    queryKey: ["squads", tenantId],
    enabled: !loading && !!tenantId,
    queryFn: async (): Promise<SquadWithStats[]> => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceIso = since.toISOString();
      const nowIso = new Date().toISOString();

      const [squadsRes, smRes, profilesRes, projectsRes, statusesRes] = await Promise.all([
        supabase.from("squads").select("*").eq("tenant_id", tenantId!).order("name"),
        supabase.from("squad_members").select("*"),
        supabase.from("profiles").select("id,full_name,display_name,avatar_url,email"),
        supabase.from("projects").select("id,squad_id").eq("tenant_id", tenantId!),
        supabase.from("task_statuses").select("id,is_done").eq("tenant_id", tenantId!),
      ]);
      if (squadsRes.error) throw squadsRes.error;

      const squads = (squadsRes.data ?? []) as Squad[];
      const sm = (smRes.data ?? []) as SquadMember[];
      const profilesMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p as MemberProfile]));
      const projectsBySquad = new Map<string, string[]>();
      for (const p of projectsRes.data ?? []) {
        if (!p.squad_id) continue;
        const arr = projectsBySquad.get(p.squad_id) ?? [];
        arr.push(p.id);
        projectsBySquad.set(p.squad_id, arr);
      }
      const doneStatusIds = new Set((statusesRes.data ?? []).filter((s) => s.is_done).map((s) => s.id));

      const result: SquadWithStats[] = [];
      for (const s of squads) {
        const members = sm
          .filter((m) => m.squad_id === s.id)
          .map((m) => ({ ...m, profile: profilesMap.get(m.user_id) ?? null }));
        const totalCapacity = members.reduce((acc, m) => acc + (m.capacity_hours_week ?? 0), 0);
        const projectIds = projectsBySquad.get(s.id) ?? [];

        let openTasks = 0;
        let doneLast30 = 0;
        let overdue = 0;
        if (projectIds.length > 0) {
          const [openRes, doneRes, overdueRes] = await Promise.all([
            supabase
              .from("tasks")
              .select("id", { count: "exact", head: true })
              .in("project_id", projectIds)
              .eq("archived", false)
              .is("done_at", null),
            supabase
              .from("tasks")
              .select("id", { count: "exact", head: true })
              .in("project_id", projectIds)
              .gte("done_at", sinceIso),
            supabase
              .from("tasks")
              .select("id", { count: "exact", head: true })
              .in("project_id", projectIds)
              .eq("archived", false)
              .is("done_at", null)
              .lt("due_at", nowIso),
          ]);
          openTasks = openRes.count ?? 0;
          doneLast30 = doneRes.count ?? 0;
          overdue = overdueRes.count ?? 0;
        }
        result.push({ ...s, members, totalCapacity, openTasks, doneLast30, overdue });
        void doneStatusIds; // reserved for future status-based stats
      }
      return result;
    },
  });
}

export function useCreateSquad() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { name: string; kind: SquadKind; color?: string; description?: string }) => {
      if (!tenantId) throw new Error("Sem workspace");
      const { error } = await supabase.from("squads").insert([
        {
          tenant_id: tenantId,
          name: input.name,
          kind: input.kind,
          color: input.color ?? null,
          description: input.description ?? null,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["squads", tenantId] });
      toast.success("Squad criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddSquadMember() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { squad_id: string; user_id: string; role: SquadRole; capacity?: number }) => {
      const { error } = await supabase.from("squad_members").insert([
        {
          squad_id: input.squad_id,
          user_id: input.user_id,
          role_in_squad: input.role,
          capacity_hours_week: input.capacity ?? 40,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["squads", tenantId] });
      toast.success("Membro adicionado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveSquadMember() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("squad_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["squads", tenantId] }),
  });
}

export function useTenantMembers() {
  const { tenantId, loading } = useWorkspace();
  return useQuery({
    queryKey: ["tenant-members", tenantId],
    enabled: !loading && !!tenantId,
    queryFn: async () => {
      const [tmRes, profRes] = await Promise.all([
        supabase.from("tenant_members").select("user_id").eq("tenant_id", tenantId!),
        supabase.from("profiles").select("id,full_name,display_name,avatar_url,email"),
      ]);
      const ids = new Set((tmRes.data ?? []).map((m) => m.user_id));
      return (profRes.data ?? []).filter((p) => ids.has(p.id)) as MemberProfile[];
    },
  });
}