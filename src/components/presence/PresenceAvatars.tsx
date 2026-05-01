import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePresence } from "@/hooks/usePresence";
import { cn } from "@/lib/utils";

interface PresenceAvatarsProps {
  room: string | null | undefined;
  className?: string;
  max?: number;
}

function initialsOf(name: string) {
  return name
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function PresenceAvatars({ room, className, max = 4 }: PresenceAvatarsProps) {
  const users = usePresence(room);
  if (!users.length) return null;
  const visible = users.slice(0, max);
  const extra = users.length - visible.length;

  return (
    <div className={cn("flex items-center -space-x-2", className)} aria-label={`${users.length} pessoa(s) vendo`}>
      {visible.map((u) => (
        <Tooltip key={u.user_id}>
          <TooltipTrigger asChild>
            <Avatar className="h-7 w-7 border-2 border-background ring-2 ring-success/40">
              {u.avatar_url ? <AvatarImage src={u.avatar_url} alt={u.display_name} /> : null}
              <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                {initialsOf(u.display_name || u.email || "?") || "?"}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs font-medium">{u.display_name || u.email}</p>
            <p className="text-[10px] text-muted-foreground">vendo agora</p>
          </TooltipContent>
        </Tooltip>
      ))}
      {extra > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold">
          +{extra}
        </div>
      )}
    </div>
  );
}