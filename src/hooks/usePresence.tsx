import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PresenceUser {
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  online_at: string;
}

/**
 * Realtime presence em uma "room" (ex: task:UUID, project:UUID).
 * Retorna lista de usuários conectados na mesma sala — exceto você.
 */
export function usePresence(room: string | null | undefined) {
  const { user } = useAuth();
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!user || !room) return;

    const channel = supabase.channel(`presence:${room}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const all: PresenceUser[] = [];
        Object.entries(state).forEach(([key, metas]) => {
          if (key === user.id) return;
          const meta = metas[0];
          if (meta) all.push(meta);
        });
        setUsers(all);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            email: user.email ?? "",
            display_name: user.user_metadata?.display_name ?? user.email ?? "",
            avatar_url: user.user_metadata?.avatar_url ?? null,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user, room]);

  return users;
}