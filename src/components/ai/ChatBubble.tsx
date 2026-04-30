import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Sparkles, User } from "lucide-react";

interface Props {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

export function ChatBubble({ role, content, pending }: Props) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        {content ? (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-pre:my-2">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : pending ? (
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:300ms]" />
          </span>
        ) : null}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}