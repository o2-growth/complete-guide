import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";

const QUEUE_KEY = "oxy_error_queue";

interface QueuedError {
  source: string;
  level: string;
  message: string;
  stack?: string;
  url?: string;
  user_agent?: string;
  context?: Record<string, unknown>;
}

function enqueue(e: QueuedError) {
  try {
    const cur = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    cur.push({ ...e, queued_at: new Date().toISOString() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(cur.slice(-50)));
  } catch {
    // Falha ao serializar/persistir é ignorada (storage cheio ou indisponível).
  }
}

async function flush(userId: string | undefined, tenantId: string | null) {
  try {
    const cur: QueuedError[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    if (!cur.length) return;
    const rows = cur.map((e) => ({ ...e, user_id: userId ?? null, tenant_id: tenantId }));
    const { error } = await supabase.from("error_events").insert(rows as never);
    if (!error) localStorage.removeItem(QUEUE_KEY);
  } catch {
    // Falha de rede/storage é tolerada — fila será reenviada no próximo tick.
  }
}

export function reportError(err: Error | string, context: Record<string, unknown> = {}) {
  const e = typeof err === "string" ? { message: err } : { message: err.message, stack: err.stack };
  enqueue({
    source: "react",
    level: "error",
    message: e.message,
    stack: e.stack,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    context,
  });
}

export function useErrorTracking() {
  const { user } = useAuth();
  const { tenantId } = useWorkspace();

  useEffect(() => {
    const onErr = (ev: ErrorEvent) => {
      enqueue({
        source: "window",
        level: "error",
        message: ev.message,
        stack: ev.error?.stack,
        url: window.location.href,
        user_agent: navigator.userAgent,
        context: { filename: ev.filename, lineno: ev.lineno, colno: ev.colno },
      });
    };
    const onRej = (ev: PromiseRejectionEvent) => {
      const reason = ev.reason;
      enqueue({
        source: "promise",
        level: "error",
        message: typeof reason === "string" ? reason : reason?.message ?? "unhandled rejection",
        stack: reason?.stack,
        url: window.location.href,
        user_agent: navigator.userAgent,
      });
    };
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => flush(user.id, tenantId), 15000);
    flush(user.id, tenantId);
    return () => clearInterval(id);
  }, [user, tenantId]);
}
