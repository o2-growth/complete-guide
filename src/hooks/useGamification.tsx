import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export interface Achievement { id: string; code: string; name: string; description: string; icon: string | null; xp_reward: number; category: string; rarity: "common"|"rare"|"epic"|"legendary"; threshold_kind: string | null; threshold_value: number | null; }
export interface UserAchievement { id: string; user_id: string; achievement_id: string; unlocked_at: string; }
export interface UserXp { user_id: string; tenant_id: string; xp_total: number; level: number; current_streak: number; longest_streak: number; last_activity_date: string | null; }
export interface LeaderboardEntry { user_id: string; display_name: string | null; avatar_url: string | null; xp_total: number; level: number; current_streak: number; achievements_count: number; }

export const useAchievements = () => useQuery({
  queryKey: ["achievements"],
  queryFn: async () => {
    const { data, error } = await supabase.from("achievements").select("*").order("rarity").order("threshold_value");
    if (error) throw error;
    return (data ?? []) as Achievement[];
  },
});

export const useMyAchievements = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_achievements").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as UserAchievement[];
    },
  });
};

export const useMyXp = () => {
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["my-xp", user?.id, tenantId],
    enabled: !!user && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_xp").select("*").eq("user_id", user!.id).eq("tenant_id", tenantId!).maybeSingle();
      if (error) throw error;
      return data as UserXp | null;
    },
  });
};

export const useLeaderboard = () => {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["leaderboard", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("squad_leaderboard", { _tenant: tenantId! });
      if (error) throw error;
      return (data ?? []) as LeaderboardEntry[];
    },
  });
};

export const useAwardXp = () => {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async ({ kind, xp, refId, refKind }: { kind: string; xp: number; refId?: string; refKind?: string }) => {
      if (!tenantId) throw new Error("no tenant");
      const { data, error } = await supabase.rpc("award_xp", { _tenant: tenantId, _kind: kind, _xp: xp, _ref_id: refId ?? null, _ref_kind: refKind ?? null });
      if (error) throw error;
      // verifica conquistas
      await supabase.rpc("check_achievements", { _tenant: tenantId });
      return data as { xp_total: number; level: number; streak: number };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["my-xp"] });
      qc.invalidateQueries({ queryKey: ["my-achievements"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success(`+${data ? "" : ""}XP conquistado!`, { description: `Total: ${data?.xp_total ?? 0} • Nível ${data?.level ?? 1}` });
    },
  });
};

export const useCheckAchievements = () => {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("no tenant");
      const { data, error } = await supabase.rpc("check_achievements", { _tenant: tenantId });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["my-achievements"] });
      if (count > 0) toast.success(`${count} nova(s) conquista(s)!`);
    },
  });
};