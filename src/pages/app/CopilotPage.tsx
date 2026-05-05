import { useState, useRef, useEffect } from "react";
import { useCopilot } from "@/hooks/useCopilot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, Plus, Trash2, Wrench, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Como estamos vs o setor este mês?",
  "Simule dobrar o budget de boost",
  "E se eu adicionar 2 designers de 30h/semana?",
  "Quais são os 3 maiores riscos agora?",
];

export default function CopilotPage() {
  const { conversations, activeId, setActiveId, messages, send, sending, newConversation, deleteConversation } = useCopilot();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, sending]);

  const submit = async () => {
    if (!input.trim() || sending) return;
    const txt = input; setInput("");
    await send(txt);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <Card className="w-64 p-3 flex flex-col">
        <Button onClick={newConversation} className="w-full mb-3" size="sm"><Plus className="h-4 w-4 mr-1" />Nova conversa</Button>
        <ScrollArea className="flex-1 -mx-3 px-3">
          {conversations.length === 0 && <p className="text-xs text-muted-foreground p-2">Nenhuma conversa ainda.</p>}
          {conversations.map(c => (
            <div key={c.id} className={cn("group flex items-center gap-1 rounded-md px-2 py-1.5 text-xs cursor-pointer hover:bg-accent", activeId === c.id && "bg-accent")}
              onClick={() => setActiveId(c.id)}>
              <span className="flex-1 truncate">{c.title}</span>
              <Trash2 className="h-3 w-3 opacity-0 group-hover:opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} />
            </div>
          ))}
        </ScrollArea>
      </Card>

      <Card className="flex-1 flex flex-col">
        <div className="border-b p-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">Oxy Copilot</h2>
            <p className="text-xs text-muted-foreground">Acessa tarefas, posts, OKRs, anomalias, ROAS e benchmarks em tempo real.</p>
          </div>
        </div>
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <Bot className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Pergunte algo. O copiloto usa ferramentas para responder com dados reais.</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-xl mt-2">
                {SUGGESTIONS.map(s => (
                  <Button key={s} size="sm" variant="outline" className="text-xs h-auto py-1.5" onClick={() => { setInput(s); }}>{s}</Button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-3">
            {messages.map(m => (
              <div key={m.id} className={cn("flex gap-2", m.role === "user" && "justify-end")}>
                {m.role !== "user" && <div className="shrink-0 mt-1">{m.role === "tool" ? <Wrench className="h-4 w-4 text-muted-foreground" /> : <Bot className="h-4 w-4 text-primary" />}</div>}
                <div className={cn("max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap",
                  m.role === "user" ? "bg-primary text-primary-foreground" :
                  m.role === "tool" ? "bg-muted/50 text-xs font-mono" : "bg-muted")}>
                  {m.role === "tool" ? (
                    <>
                      <Badge variant="outline" className="mb-1 text-[10px]">{m.tool_name}</Badge>
                      <pre className="text-[10px] overflow-x-auto">{JSON.stringify(m.tool_result, null, 2).slice(0, 600)}</pre>
                    </>
                  ) : m.content || (m.role === "assistant" ? <em className="text-muted-foreground">(usando ferramentas...)</em> : "")}
                </div>
                {m.role === "user" && <div className="shrink-0 mt-1"><User className="h-4 w-4" /></div>}
              </div>
            ))}
            {sending && <div className="flex gap-2"><Bot className="h-4 w-4 text-primary mt-1" /><div className="bg-muted rounded-lg p-3 text-sm"><span className="animate-pulse">Pensando…</span></div></div>}
          </div>
        </ScrollArea>
        <div className="border-t p-3 flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Pergunte algo ao copiloto..."
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} disabled={sending} />
          <Button onClick={submit} disabled={sending || !input.trim()}><Send className="h-4 w-4" /></Button>
        </div>
      </Card>
    </div>
  );
}