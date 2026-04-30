import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ApiToken {
  id: string;
  name: string;
  token_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  last_delivery_at: string | null;
  last_status: number | null;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  status: string;
  http_status: number | null;
  attempts: number;
  created_at: string;
  delivered_at: string | null;
  response_body: string | null;
}

export interface ChatIntegration {
  id: string;
  provider: "slack" | "teams" | "discord";
  name: string;
  webhook_url: string;
  channel: string | null;
  active: boolean;
  events: string[];
  last_sent_at: string | null;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return "oxy_" + Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function useApiTokens() {
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["api_tokens", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_tokens")
        .select("id,name,token_prefix,scopes,last_used_at,expires_at,revoked_at,created_at")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApiToken[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; scopes: string[] }) => {
      const token = generateToken();
      const hash = await sha256Hex(token);
      const prefix = token.slice(0, 12);
      const { error } = await supabase.from("api_tokens").insert({
        tenant_id: tenantId!,
        created_by: user!.id,
        name: input.name,
        token_prefix: prefix,
        token_hash: hash,
        scopes: input.scopes,
      });
      if (error) throw error;
      return token;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api_tokens", tenantId] });
      toast.success("Token criado. Copie agora — não será exibido novamente.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api_tokens", tenantId] });
      toast.success("Token revogado");
    },
  });

  return { ...list, create, revoke };
}

export function useWebhooks() {
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["webhooks", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("webhooks").select("*").eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Webhook[];
    },
  });

  const deliveries = useQuery({
    queryKey: ["webhook_deliveries", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("webhook_deliveries").select("*")
        .eq("tenant_id", tenantId!).order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return (data ?? []) as WebhookDelivery[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; url: string; events: string[] }) => {
      const { error } = await supabase.from("webhooks").insert({
        tenant_id: tenantId!,
        created_by: user!.id,
        name: input.name,
        url: input.url,
        events: input.events,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks", tenantId] });
      toast.success("Webhook criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (input: { id: string; active: boolean }) => {
      const { error } = await supabase.from("webhooks").update({ active: input.active }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks", tenantId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks", tenantId] });
      toast.success("Webhook removido");
    },
  });

  const dispatchNow = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("webhook-dispatcher", { body: {} });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhook_deliveries", tenantId] });
      toast.success("Fila processada");
    },
  });

  return { list, deliveries, create, toggle, remove, dispatchNow };
}

export function useChatIntegrations() {
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["chat_integrations", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_integrations").select("*")
        .eq("tenant_id", tenantId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChatIntegration[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: { provider: "slack" | "teams" | "discord"; name: string; webhook_url: string; channel?: string }) => {
      const { error } = await supabase.from("chat_integrations").insert({
        tenant_id: tenantId!,
        created_by: user!.id,
        provider: input.provider,
        name: input.name,
        webhook_url: input.webhook_url,
        channel: input.channel ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat_integrations", tenantId] });
      toast.success("Integração conectada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chat_integrations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat_integrations", tenantId] }),
  });

  const testSend = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke("chat-notify", {
        body: {
          tenant_id: tenantId,
          integration_id: id,
          title: "Oxy — teste de integração",
          text: "Se você está vendo isto, sua integração está funcionando 🎉",
          url: window.location.origin + "/app",
        },
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Mensagem de teste enviada"),
    onError: (e: Error) => toast.error(e.message),
  });

  return { list, create, remove, testSend };
}

export function usePushSubscription() {
  const { tenantId } = useWorkspace();
  const { user } = useAuth();

  const subscribe = useMutation({
    mutationFn: async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push não suportado neste navegador");
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        // Subscribe without VAPID (storage only — actual push requires VAPID setup)
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true });
      }
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const endpoint = json.endpoint!;
      const p256dh = json.keys?.p256dh ?? "";
      const auth = json.keys?.auth ?? "";
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user!.id,
        tenant_id: tenantId!,
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
      }, { onConflict: "endpoint" });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Notificações push ativadas neste dispositivo"),
    onError: (e: Error) => toast.error(e.message),
  });

  return { subscribe };
}