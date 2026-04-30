import { useEffect, useRef, useState } from "react";
import { Send, Square, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAIChat } from "@/hooks/useAIChat";
import { ChatBubble } from "./ChatBubble";

interface Props {
  taskContext?: { id?: string; title?: string; description?: string } | null;
  suggestions?: string[];
  placeholder?: string;
}

const DEFAULT_SUGGESTIONS = [
  "Sugira 3 ideias de post para Instagram sobre lançamento de produto",
  "Como melhorar o engajamento dos meus Reels?",
  "Crie um roteiro de e-mail marketing de boas-vindas",
  "Quebre meu fluxo de produção de conteúdo em etapas claras",
];

export function AIChat({ taskContext, suggestions = DEFAULT_SUGGESTIONS, placeholder }: Props) {
  const [input, setInput] = useState("");
  const { messages, isStreaming, send, cancel, reset } = useAIChat({ taskContext });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    if (!input.trim() || isStreaming) return;
    send(input);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-1 py-4">
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Gênio Growth</h3>
              <p className="text-sm text-muted-foreground">
                Seu copiloto de produtividade e marketing. Pergunte qualquer coisa.
              </p>
            </div>
            <div className="grid w-full gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-lg border bg-card px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <ChatBubble
              key={i}
              role={m.role}
              content={m.content}
              pending={isStreaming && i === messages.length - 1 && m.role === "assistant" && !m.content}
            />
          ))
        )}
      </div>

      <div className="border-t bg-background/80 px-1 py-3 backdrop-blur">
        {messages.length > 0 && (
          <div className="mb-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs">
              <RotateCcw className="mr-1 h-3 w-3" /> Nova conversa
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={placeholder ?? "Pergunte ao Gênio Growth… (Enter para enviar, Shift+Enter para quebrar linha)"}
            rows={2}
            className="min-h-[60px] resize-none"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button onClick={cancel} size="icon" variant="destructive" className="h-[60px]">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} size="icon" disabled={!input.trim()} className="h-[60px]">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}