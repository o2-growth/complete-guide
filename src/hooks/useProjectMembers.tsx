import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ProjectRole = "owner" | "editor" | "commenter" | "viewer";

export interface ProjectMemberRow {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  profile?: {
    id: string;
    display_name: string | null;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export function useProjectMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-members", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<ProjectMemberRow[]> => {
      const { data, error } = await supabase
        .from("project_members")
        .select("id, project_id, user_id, role")
        .eq("project_id", projectId!);
      if (error) throw error;
      const rows = (data ?? []) as ProjectMemberRow[];
      if (rows.length === 0) return [];
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, full_name, email, avatar_url")
        .in("id", ids);
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      return rows.map((r) => ({ ...r, profile: byId.get(r.user_id) ?? null }));
    },
  });
}

export function useAddProjectMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { project_id: string; user_id: string; role: ProjectRole }) => {
      const { error } = await supabase.from("project_members").insert([input]);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["project-members", vars.project_id] });
      toast.success("Membro adicionado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProjectMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; project_id: string; role: ProjectRole }) => {
      const { error } = await supabase
        .from("project_members")
        .update({ role: input.role })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["project-members", vars.project_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveProjectMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; project_id: string }) => {
      const { error } = await supabase.from("project_members").delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["project-members", vars.project_id] });
      toast.success("Membro removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}