import { NavLink, useLocation } from "react-router-dom";
import { Inbox, Sun, CalendarDays, Bell, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";

interface MobileBottomNavProps {
  onQuickAdd?: () => void;
}

const items = [
  { to: "/app", icon: Inbox, label: "Inbox", end: true },
  { to: "/app/hoje", icon: Sun, label: "Hoje" },
  { to: "/app/calendario", icon: CalendarDays, label: "Agenda" },
  { to: "/app/notificacoes", icon: Bell, label: "Alertas" },
] as const;

/**
 * Bottom navigation visível apenas em viewports < md (768px).
 * Inclui FAB central de Quick Add quando onQuickAdd é fornecido.
 */
export function MobileBottomNav({ onQuickAdd }: MobileBottomNavProps) {
  const { pathname } = useLocation();
  const unread = useUnreadCount();

  const isActive = (url: string, end?: boolean) =>
    end ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <>
      <nav
        aria-label="Navegação inferior"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-[env(safe-area-inset-bottom)]"
      >
        {items.slice(0, 2).map((it) => {
          const active = isActive(it.to, it.end);
          return (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <it.icon className="h-5 w-5" />
              <span>{it.label}</span>
            </NavLink>
          );
        })}

        {/* FAB Quick Add */}
        <div className="flex flex-1 items-center justify-center">
          <button
            onClick={onQuickAdd}
            aria-label="Nova tarefa"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground shadow-brand transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>

        {items.slice(2).map((it) => {
          const active = isActive(it.to, it.end);
          const showBadge = it.to === "/app/notificacoes" && unread > 0;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <it.icon className="h-5 w-5" />
              <span>{it.label}</span>
              {showBadge && (
                <Badge
                  variant="destructive"
                  className="absolute right-3 top-1 h-4 min-w-4 rounded-full px-1 text-[9px]"
                >
                  {unread > 9 ? "9+" : unread}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </nav>
      {/* Spacer para evitar que conteúdo fique escondido sob a barra */}
      <div className="h-16 md:hidden" aria-hidden="true" />
    </>
  );
}