import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

export interface SearchResult {
  kind: "task" | "project" | "post";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

/**
 * Busca global debounced (250ms) — tarefas, projetos e posts agendados.
 * Usa ilike no servidor; limita 8 por tipo.
 */
export function useGlobalSearch(query: string) {
  const { tenantId } = useWorkspace();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenantId || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const q = `%${query.trim()}%`;
      const [tasks, projects] = await Promise.all([
        supabase.from("tasks").select("id,title,status,publish_state").eq("tenant_id", tenantId).ilike("title", q).limit(8),
        supabase.from("projects").select("id,name,archived_at").eq("tenant_id", tenantId).ilike("name", q).limit(6),
      ]);
      if (cancelled) return;

      type TaskRow = { id: string; title: string; status: string; publish_state: string | null };
      type ProjectRow = { id: string; name: string; archived_at: string | null };

      const out: SearchResult[] = [];
      ((tasks.data ?? []) as TaskRow[]).forEach((t) => {
        const isPost = !!t.publish_state;
        out.push({
          kind: isPost ? "post" : "task",
          id: t.id,
          title: t.title,
          subtitle: isPost ? `Post · ${t.publish_state}` : `Tarefa · ${t.status}`,
          href: isPost ? "/app/social" : "/app",
        });
      });
      ((projects.data ?? []) as ProjectRow[]).forEach((p) => out.push({
        kind: "project",
        id: p.id,
        title: p.name,
        subtitle: p.archived_at ? "Projeto arquivado" : "Projeto",
        href: `/app/projetos/${p.id}`,
      }));
      setResults(out);
      setLoading(false);
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, tenantId]);

  return { results, loading };
}