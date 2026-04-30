import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PreviewContent, formatLikes, truncate } from "./preview-utils";

interface Props {
  content: PreviewContent;
  className?: string;
}

export function IgFeedPreview({ content, className }: Props) {
  const handle = content.authorHandle?.replace(/^@/, "") || "oxygrowth";
  return (
    <div className={cn("w-full max-w-[420px] overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm", className)}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Avatar className="h-8 w-8 ring-2 ring-pink-500/60">
          {content.authorAvatar && <AvatarImage src={content.authorAvatar} alt={handle} />}
          <AvatarFallback className="text-[10px]">{handle.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 leading-tight">
          <p className="text-xs font-semibold">{handle}</p>
          <p className="text-[10px] text-muted-foreground">São Paulo, Brasil</p>
        </div>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="relative aspect-square w-full bg-gradient-to-br from-pink-500/20 via-fuchsia-500/20 to-orange-400/20">
        {content.imageUrl ? (
          <img src={content.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sem imagem · 1080×1080
          </div>
        )}
      </div>
      <div className="space-y-1.5 px-3 py-2.5">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5" />
          <MessageCircle className="h-5 w-5" />
          <Send className="h-5 w-5" />
          <Bookmark className="ml-auto h-5 w-5" />
        </div>
        <p className="text-xs font-semibold">{formatLikes(1234)} curtidas</p>
        <p className="text-xs leading-relaxed">
          <span className="font-semibold">{handle}</span>{" "}
          {truncate(content.caption || "Adicione uma legenda envolvente em até 2.200 caracteres.", 180)}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">há 2 horas</p>
      </div>
    </div>
  );
}
