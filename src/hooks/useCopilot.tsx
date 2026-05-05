import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool_name?: string | null;
  tool_result?: unknown;
  created_at: string;
}

export interface CopilotConversation {
  id: string;
  title: string;
  updated_at: string;
}

export function useCopilot() {
  const { tenantId } = useWorkspace();
  const [conversations, setConversations] = useState<CopilotConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("copilot_conversations")
      .select("id,title,updated_at").eq("tenant_id", tenantId).order("updated_at", { ascending: false }).limit(30);
    setConversations((data ?? []) as CopilotConversation[]);
  }, [tenantId]);

  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase.from("copilot_messages")
      .select("*").eq("conversation_id", convId).order("created_at");
    setMessages((data ?? []) as CopilotMessage[]);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => { if (activeId) loadMessages(activeId); else setMessages([]); }, [activeId, loadMessages]);

  const send = async (text: string) => {
    if (!tenantId || !text.trim()) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("copilot-chat", {
        body: { conversation_id: activeId, tenant_id: tenantId, user_message: text },
      });
      if (error) throw error;
      const newId = (data as { conversation_id?: string } | null)?.conversation_id;
      if (newId && newId !== activeId) setActiveId(newId);
      else if (activeId) await loadMessages(activeId);
      if (newId) await loadMessages(newId);
      await loadConversations();
    } catch (e: unknown) {
      toast.error("Erro no copiloto: " + (e instanceof Error ? e.message : String(e)));
    } finally { setSending(false); }
  };

  const newConversation = () => { setActiveId(null); setMessages([]); };
  const deleteConversation = async (id: string) => {
    await supabase.from("copilot_conversations").delete().eq("id", id);
    if (activeId === id) newConversation();
    await loadConversations();
  };

  return { conversations, activeId, setActiveId, messages, send, sending, newConversation, deleteConversation };
}