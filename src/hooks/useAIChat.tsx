import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface UseAIChatOptions {
  taskContext?: { id?: string; title?: string; description?: string } | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

/**
 * Chat streaming token-a-token contra a edge ai-chat (Lovable AI Gateway).
 */
export function useAIChat({ taskContext }: UseAIChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setMessages([]);
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const send = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed || isStreaming) return;

      const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
      setMessages(next);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) throw new Error("Sessão expirada");

        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messages: next, taskContext: taskContext ?? null }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const j = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
          throw new Error(j.error ?? "Falha no chat");
        }
        if (!resp.body) throw new Error("Sem corpo de resposta");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantSoFar = "";
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        const upsert = (chunk: string) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const copy = prev.slice();
            copy[copy.length - 1] = { role: "assistant", content: assistantSoFar };
            return copy;
          });
        };

        let done = false;
        while (!done) {
          const { value, done: d } = await reader.read();
          if (d) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") { done = true; break; }
            try {
              const parsed = JSON.parse(payload);
              const c = parsed.choices?.[0]?.delta?.content;
              if (c) upsert(c);
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          toast.error("Chat: " + (e as Error).message);
          setMessages((prev) => prev.slice(0, -1));
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, taskContext],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, send, cancel, reset };
}