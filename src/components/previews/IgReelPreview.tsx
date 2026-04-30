import { Heart, MessageCircle, Send, Music2, Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PreviewContent, formatLikes, truncate } from "./preview-utils";

interface Props {
  content: PreviewContent;
  className?: string;
}

export function IgReelPreview({ content, className }: Props) {
  const handle = content.authorHandle?.replace(/^@/, "") || "oxygrowth";
  return (
    <div className={cn("relative w-[260px] overflow-hidden rounded-2xl border bg-black shadow-lg", className)}>
      <div className="relative aspect-[9/16] w-full bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600">
        {content.imageUrl && (
          <img src={content.imageUrl} alt="" className="h-full w-full object-cover opacity-90" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
            <Play className="h-7 w-7 fill-white text-white" />
          </div>
        </div>
        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 text-white">
          <div className="flex flex-col items-center">
            <Heart className="h-6 w-6 drop-shadow" />
            <span className="text-[10px] font-semibold">{formatLikes(8421)}</span>
          </div>
          <div className="flex flex-col items-center">
            <MessageCircle className="h-6 w-6 drop-shadow" />
            <span className="text-[10px] font-semibold">142</span>
          </div>
          <Send className="h-6 w-6 drop-shadow" />
        </div>
        <div className="absolute inset-x-0 bottom-0 space-y-1.5 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 ring-1 ring-white">
              {content.authorAvatar && <AvatarImage src={content.authorAvatar} />}
              <AvatarFallback className="text-[10px]">{handle.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold">{handle}</span>
            <button className="ml-auto rounded border border-white px-2 py-0.5 text-[10px] font-semibold">
              Seguir
            </button>
          </div>
          <p className="text-[11px] leading-snug">
            {truncate(content.caption || "Adicione legenda + #hashtags do reel.", 100)}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] opacity-80">
            <Music2 className="h-3 w-3" />
            <span>som original · {handle}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
