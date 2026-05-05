import { useEffect } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { queryProfile } from "@/lib/query-config";
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
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();

  const q = useQuery({
    ...queryProfile("realtime"),
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

  // Realtime via Broadcast (regra de ouro CLAUDE.md §1.3) — trigger em notifications
  // dispara realtime.send no canal tenant:{id}:notifications-{user_id}.
  useEffect(() => {
    if (!user || !tenantId) return;
    const ch = supabase
      .channel(`tenant:${tenantId}:notifications-${user.id}`)
      .on("broadcast", { event: "*" }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, tenantId, qc]);

  return q;
}

const NOTIF_PAGE_SIZE = 30;

export interface NotificationsFilters {
  /** "unread" | "read" | "all" — apenas filtra client-side as páginas carregadas. */
  status?: "unread" | "read" | "all";
}

export interface NotificationsPage {
  rows: Notification[];
  nextCursor: string | undefined;
}

/**
 * Versão paginada com cursor por created_at desc. Mesmo realtime do hook full.
 * Filtros (read/unread) ficam client-side — server só pagina por created_at.
 */
export function useNotificationsInfinite(_filters: NotificationsFilters = {}) {
  const { user } = useAuth();
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();

  const q = useInfiniteQuery({
    ...queryProfile("realtime"),
    queryKey: ["notifications-infinite", user?.id],
    enabled: !!user,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: NotificationsPage) => lastPage.nextCursor,
    queryFn: async ({ pageParam }): Promise<NotificationsPage> => {
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(NOTIF_PAGE_SIZE);
      if (pageParam) query = query.lt("created_at", pageParam);

      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as unknown as Notification[];
      const nextCursor =
        rows.length === NOTIF_PAGE_SIZE ? rows[rows.length - 1].created_at : undefined;
      return { rows, nextCursor };
    },
  });

  // Realtime via Broadcast: mesmo canal de useNotifications, invalida ambas as queries.
  useEffect(() => {
    if (!user || !tenantId) return;
    const ch = supabase
      .channel(`tenant:${tenantId}:notifications-${user.id}-infinite`)
      .on("broadcast", { event: "*" }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
        qc.invalidateQueries({ queryKey: ["notifications-infinite"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, tenantId, qc]);

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
    ...queryProfile("realtime"),
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