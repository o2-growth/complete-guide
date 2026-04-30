import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type SkillCategory = "design" | "copy" | "tech" | "data" | "management" | "media" | "other";

export interface Skill {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  color: string | null;
  icon: string | null;
}

export interface UserSkill {
  id: string;
  tenant_id: string;
  user_id: string;
  skill_id: string;
  level: number;
  years_experience: number | null;
  endorsements_count: number;
  notes: string | null;
}

export interface MemberProfile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export function useSkillsMatrix() {
  const { tenantId, loading: wsLoading } = useWorkspace();

  return useQuery({
    queryKey: ["skills-matrix", tenantId],
    enabled: !wsLoading && !!tenantId,
    queryFn: async () => {
      const [skillsRes, userSkillsRes, membersRes, profilesRes] = await Promise.all([
        supabase.from("skills").select("*").eq("tenant_id", tenantId!).order("category").order("name"),
        supabase.from("user_skills").select("*").eq("tenant_id", tenantId!),
        supabase.from("tenant_members").select("user_id,role").eq("tenant_id", tenantId!),
        supabase.from("profiles").select("id,full_name,display_name,avatar_url,email"),
      ]);

      if (skillsRes.error) throw skillsRes.error;
      if (userSkillsRes.error) throw userSkillsRes.error;

      const memberIds = new Set((membersRes.data ?? []).map((m) => m.user_id));
      const members = (profilesRes.data ?? []).filter((p) => memberIds.has(p.id)) as MemberProfile[];

      return {
        skills: (skillsRes.data ?? []) as Skill[],
        userSkills: (userSkillsRes.data ?? []) as UserSkill[],
        members,
      };
    },
  });
}

export function useUpsertUserSkill() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ skillId, level, years }: { skillId: string; level: number; years?: number }) => {
      if (!user || !tenantId) throw new Error("Sem workspace");
      const { error } = await supabase
        .from("user_skills")
        .upsert(
          {
            tenant_id: tenantId,
            user_id: user.id,
            skill_id: skillId,
            level,
            years_experience: years ?? 0,
          },
          { onConflict: "user_id,skill_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skills-matrix", tenantId] });
      toast.success("Skill atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveUserSkill() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (userSkillId: string) => {
      const { error } = await supabase.from("user_skills").delete().eq("id", userSkillId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills-matrix", tenantId] }),
  });
}

export function useEndorseSkill() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (userSkillId: string) => {
      const { error } = await supabase.rpc("endorse_user_skill", { _user_skill_id: userSkillId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skills-matrix", tenantId] });
      toast.success("Endosso registrado 👍");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}