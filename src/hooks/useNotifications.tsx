import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  severity: "info" | "warning" | "critical";
  read_at: string | null;
  created_at: string;
  payload: Record<string, unknown>;
}

export interface NotificationPrefs {
  user_id: string;
  tenant_id: string;
  email_digest: "off" | "daily" | "weekly";
  in_app_enabled: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
}

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as Notification[];
    },
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      });
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  return q;
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return (data ?? []).filter((n) => !n.read_at).length;
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      const { error } = await supabase.rpc("mark_notifications_read", { _ids: ids ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useScanNotifications() {
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("scan-notifications", {
        body: { tenant_id: tenantId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notificações atualizadas");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useNotificationPrefs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notification_prefs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as NotificationPrefs | null;
    },
  });
}

export function useUpdatePrefs() {
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<NotificationPrefs>) => {
      if (!user || !tenantId) throw new Error("workspace");
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          tenant_id: tenantId,
          ...patch,
          updated_at: new Date().toISOString(),
        } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification_prefs"] });
      toast.success("Preferências salvas");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}