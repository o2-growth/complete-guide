import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { queryProfile } from "@/lib/query-config";
import { toast } from "sonner";

const MAX_DEPTH = 4;

export interface WikiPage {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  slug: string;
  title: string;
  body: string;
  icon: string | null;
  cover_image: string | null;
  is_published: boolean;
  sort_order: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WikiPageNode extends WikiPage {
  children: WikiPageNode[];
}

export interface WikiVersion {
  id: string;
  page_id: string;
  body: string;
  title: string;
  created_by: string | null;
  created_at: string;
}

export interface WikiSearchHit {
  id: string;
  slug: string;
  title: string;
  parent_id: string | null;
  icon: string | null;
  rank: number;
  snippet: string;
}

function buildTree(rows: WikiPage[]): WikiPageNode[] {
  const byId = new Map<string, WikiPageNode>();
  rows.forEach((r) => {
    byId.set(r.id, { ...r, children: [] });
  });
  const roots: WikiPageNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortRec = (arr: WikiPageNode[]) => {
    arr.sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
    arr.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

function depthOf(nodes: WikiPageNode[], targetId: string, current = 1): number {
  for (const n of nodes) {
    if (n.id === targetId) return current;
    const d = depthOf(n.children, targetId, current + 1);
    if (d > 0) return d;
  }
  return 0;
}

function subtreeDepth(node: WikiPageNode, current = 1): number {
  if (!node.children.length) return current;
  return Math.max(...node.children.map((c) => subtreeDepth(c, current + 1)));
}

function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `pagina-${Date.now().toString(36)}`
  );
}

export function useWikiPages(tenantIdArg?: string | null) {
  const { tenantId: ctxTenantId } = useWorkspace();
  const tenantId = tenantIdArg ?? ctxTenantId;

  const query = useQuery({
    ...queryProfile("structural"),
    queryKey: ["wiki-pages", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<WikiPage[]> => {
      const { data, error } = await supabase
        .from("wiki_pages")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as WikiPage[];
    },
  });

  const tree = useMemo(() => buildTree(query.data ?? []), [query.data]);
  return { ...query, tree, flat: query.data ?? [], maxDepth: MAX_DEPTH };
}

export function useWikiPage(slugOrId: string | null | undefined) {
  const { tenantId } = useWorkspace();
  return useQuery({
    ...queryProfile("workload"),
    queryKey: ["wiki-page", tenantId, slugOrId],
    enabled: !!tenantId && !!slugOrId,
    queryFn: async (): Promise<WikiPage | null> => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        slugOrId!,
      );
      const filterCol = isUuid ? "id" : "slug";
      const { data, error } = await supabase
        .from("wiki_pages")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq(filterCol, slugOrId!)
        .maybeSingle();
      if (error) throw error;
      return (data as WikiPage | null) ?? null;
    },
  });
}

export function useCreateWikiPage() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      parentId?: string | null;
      body?: string;
      icon?: string | null;
    }) => {
      if (!tenantId) throw new Error("Sem workspace");
      if (!user) throw new Error("Sem sessão");
      const trimmed = input.title.trim();
      if (!trimmed) throw new Error("Título obrigatório");

      // Slug único por tenant — sufixar com timestamp se colidir
      const baseSlug = slugify(trimmed);
      const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

      const { data, error } = await supabase
        .from("wiki_pages")
        .insert([
          {
            tenant_id: tenantId,
            parent_id: input.parentId ?? null,
            slug,
            title: trimmed,
            body: input.body ?? "",
            icon: input.icon ?? "FileText",
            sort_order: 999,
            created_by: user.id,
            updated_by: user.id,
          },
        ])
        .select("*")
        .single();
      if (error) throw error;
      return data as WikiPage;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wiki-pages", tenantId] });
      toast.success("Página criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateWikiPage() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string;
      body?: string;
      icon?: string | null;
      parent_id?: string | null;
      sort_order?: number;
      is_published?: boolean;
    }) => {
      if (!user) throw new Error("Sem sessão");
      const patch: Record<string, unknown> = { updated_by: user.id };
      if (typeof input.title === "string") patch.title = input.title.trim();
      if (typeof input.body === "string") patch.body = input.body;
      if (input.icon !== undefined) patch.icon = input.icon;
      if (input.parent_id !== undefined) patch.parent_id = input.parent_id;
      if (typeof input.sort_order === "number") patch.sort_order = input.sort_order;
      if (typeof input.is_published === "boolean") patch.is_published = input.is_published;

      const { error } = await supabase
        .from("wiki_pages")
        .update(patch)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["wiki-pages", tenantId] });
      qc.invalidateQueries({ queryKey: ["wiki-page", tenantId] });
      qc.invalidateQueries({ queryKey: ["wiki-versions", vars.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteWikiPage() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wiki_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wiki-pages", tenantId] });
      toast.success("Página excluída");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMoveWikiPage() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { tree } = useWikiPages(tenantId);
  return useMutation({
    mutationFn: async (input: { id: string; parentId: string | null; sortOrder: number }) => {
      if (input.parentId === input.id) {
        throw new Error("Página não pode ser movida para dentro de si mesma");
      }
      if (input.parentId) {
        const parentDepth = depthOf(tree, input.parentId);
        if (parentDepth === 0) throw new Error("Página destino inválida");
        const moving = (function find(arr: WikiPageNode[]): WikiPageNode | null {
          for (const n of arr) {
            if (n.id === input.id) return n;
            const f = find(n.children);
            if (f) return f;
          }
          return null;
        })(tree);
        if (!moving) throw new Error("Página não encontrada");
        if (parentDepth + (subtreeDepth(moving) - 1) >= MAX_DEPTH) {
          throw new Error(`Wiki suporta no máximo ${MAX_DEPTH} níveis`);
        }
      }
      const { error } = await supabase
        .from("wiki_pages")
        .update({ parent_id: input.parentId, sort_order: input.sortOrder })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wiki-pages", tenantId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useWikiSearch(query: string) {
  const { tenantId } = useWorkspace();
  const trimmed = query.trim();
  return useQuery({
    ...queryProfile("realtime"),
    queryKey: ["wiki-search", tenantId, trimmed],
    enabled: !!tenantId && trimmed.length >= 2,
    queryFn: async (): Promise<WikiSearchHit[]> => {
      const { data, error } = await supabase.rpc("wiki_search", {
        _tenant: tenantId!,
        _q: trimmed,
      });
      if (error) throw error;
      return (data ?? []) as WikiSearchHit[];
    },
  });
}

export function useWikiVersions(pageId: string | null | undefined) {
  return useQuery({
    ...queryProfile("workload"),
    queryKey: ["wiki-versions", pageId],
    enabled: !!pageId,
    queryFn: async (): Promise<WikiVersion[]> => {
      const { data, error } = await supabase
        .from("wiki_versions")
        .select("*")
        .eq("page_id", pageId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as WikiVersion[];
    },
  });
}
