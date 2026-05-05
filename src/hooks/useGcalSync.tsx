import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface GcalSyncConfig {
  id: string;
  user_id: string;
  oauth_connection_id: string;
  target_calendar_id: string;
  sync_pull_enabled: boolean;
  sync_push_enabled: boolean;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface GcalCalendar {
  id: string;
  summary: string;
  primary?: boolean;
}

const FALLBACK_CALENDARS: GcalCalendar[] = [
  { id: "primary", summary: "Calendário principal", primary: true },
];

export function useGcalSyncConfig() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["gcal-sync-config", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gcal_sync_config")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as GcalSyncConfig | null;
    },
  });
}

export function useGcalCalendars() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["gcal-calendars", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<GcalCalendar[]> => {
      try {
        const { data, error } = await supabase.functions.invoke("gcal-list-calendars", { body: {} });
        if (error) throw error;
        const list = (data as { calendars?: GcalCalendar[] } | null)?.calendars;
        if (Array.isArray(list) && list.length > 0) return list;
        return FALLBACK_CALENDARS;
      } catch {
        // Edge function pode ainda não existir — retornamos fallback pra UI funcionar.
        return FALLBACK_CALENDARS;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGcalGoogleConnection() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["oauth-connection-google", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oauth_connections")
        .select("id, provider, account_email, scope, expires_at")
        .eq("user_id", user!.id)
        .eq("provider", "google")
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useGcalSyncEnable() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { oauth_connection_id: string; target_calendar_id: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const payload = {
        user_id: user.id,
        oauth_connection_id: input.oauth_connection_id,
        target_calendar_id: input.target_calendar_id,
        sync_pull_enabled: true,
        sync_push_enabled: true,
      };
      const { error } = await supabase
        .from("gcal_sync_config")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sincronização com Google Calendar ativada");
      qc.invalidateQueries({ queryKey: ["gcal-sync-config"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao ativar sincronização"),
  });
}

export function useGcalSyncDisable() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const { error } = await supabase
        .from("gcal_sync_config")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sincronização desconectada");
      qc.invalidateQueries({ queryKey: ["gcal-sync-config"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao desconectar"),
  });
}

export function useGcalToggle() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: { pull?: boolean; push?: boolean }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const update: Record<string, boolean> = {};
      if (typeof patch.pull === "boolean") update.sync_pull_enabled = patch.pull;
      if (typeof patch.push === "boolean") update.sync_push_enabled = patch.push;
      if (Object.keys(update).length === 0) return;
      const { error } = await supabase
        .from("gcal_sync_config")
        .update(update)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gcal-sync-config"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao atualizar"),
  });
}

export function useGcalSyncNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("cron-tick", {
        body: { job: "gcal_pull" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Sincronização disparada");
      qc.invalidateQueries({ queryKey: ["gcal-sync-config"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao sincronizar"),
  });
}

export function useOAuthConnectGoogle() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "https://www.googleapis.com/auth/calendar",
          redirectTo: `${window.location.origin}/app/configuracoes/integracoes-externas`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
      return data;
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao conectar com Google"),
  });
}
