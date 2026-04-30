import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PreviewContent } from "./preview-utils";

interface Props {
  content: PreviewContent;
  className?: string;
}

export function IgStoryPreview({ content, className }: Props) {
  const handle = content.authorHandle?.replace(/^@/, "") || "oxygrowth";
  return (
    <div className={cn("relative w-[260px] overflow-hidden rounded-2xl border bg-black shadow-lg", className)}>
      <div className="relative aspect-[9/16] w-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
        {content.imageUrl && (
          <img src={content.imageUrl} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-x-0 top-0 h-1 bg-white/30">
          <div className="h-full w-1/3 bg-white" />
        </div>
        <div className="absolute inset-x-0 top-3 flex items-center gap-2 px-3">
          <Avatar className="h-7 w-7 ring-2 ring-white">
            {content.authorAvatar && <AvatarImage src={content.authorAvatar} />}
            <AvatarFallback className="text-[10px]">{handle.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-semibold text-white drop-shadow">{handle}</span>
          <span className="text-[10px] text-white/70">2h</span>
        </div>
        {content.headline && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-lg bg-black/40 p-3 text-center backdrop-blur-sm">
            <p className="text-base font-bold leading-tight text-white">{content.headline}</p>
          </div>
        )}
        {content.ctaLabel && (
          <div className="absolute inset-x-0 bottom-6 flex justify-center">
            <button className="rounded-full bg-white px-5 py-1.5 text-xs font-semibold text-black shadow-lg">
              {content.ctaLabel} ↑
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
