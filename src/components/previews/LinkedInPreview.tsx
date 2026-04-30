import { ThumbsUp, MessageSquare, Repeat2, Send, Globe2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PreviewContent, truncate } from "./preview-utils";

interface Props {
  content: PreviewContent;
  className?: string;
}

export function LinkedInPreview({ content, className }: Props) {
  const name = content.authorName || "Oxy Growth";
  return (
    <div className={cn("w-full max-w-[520px] overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <div className="flex items-start gap-3 px-4 pt-4">
        <Avatar className="h-12 w-12">
          {content.authorAvatar && <AvatarImage src={content.authorAvatar} />}
          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 leading-tight">
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">{content.brandName || "Marketing & Growth"}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            2h · <Globe2 className="h-3 w-3" />
          </p>
        </div>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
        {truncate(
          content.caption ||
            "Compartilhe um insight, case ou aprendizado. Posts do LinkedIn aceitam até 3.000 caracteres — capriche nos 3 primeiros parágrafos.",
          600,
        )}
      </div>
      {content.imageUrl && (
        <div className="relative aspect-[1.91/1] w-full bg-muted">
          <img src={content.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="flex items-center justify-between border-t px-4 py-1.5 text-xs text-muted-foreground">
        <span>👍❤️🎯 312</span>
        <span>48 comentários · 12 reposts</span>
      </div>
      <div className="grid grid-cols-4 border-t text-xs">
        {[
          { icon: ThumbsUp, label: "Curtir" },
          { icon: MessageSquare, label: "Comentar" },
          { icon: Repeat2, label: "Repostar" },
          { icon: Send, label: "Enviar" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex items-center justify-center gap-1.5 py-2 text-muted-foreground hover:bg-muted/40"
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
