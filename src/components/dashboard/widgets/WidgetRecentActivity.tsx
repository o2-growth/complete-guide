import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { queryProfile } from "@/lib/query-config";

interface ActivityRow {
  id: string;
  action: string | null;
  task_id: string | null;
  user_id: string | null;
  created_at: string;
  meta: Record<string, unknown> | null;
}

interface Config {
  limit?: number;
}

export function WidgetRecentActivity({ config }: { config: Config }) {
  const limit = config.limit ?? 8;
  const { tenantId } = useWorkspace();

  const { data, isLoading } = useQuery({
    ...queryProfile("workload"),
    queryKey: ["dashboard-widget-activity", tenantId, limit],
    enabled: !!tenantId,
    queryFn: async (): Promise<ActivityRow[]> => {
      const { data, error } = await supabase
        .from("activities")
        .select("id,action,task_id,user_id,created_at,meta")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as ActivityRow[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  if (!data?.length) {
    return <p className="text-xs text-muted-foreground text-center py-6">Sem atividades.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {data.map((a) => (
        <li key={a.id} className="flex items-start gap-2 border-b pb-2 last:border-b-0 last:pb-0">
          <span className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate">{a.action ?? "atividade"}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(parseISO(a.created_at), { locale: ptBR, addSuffix: true })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
