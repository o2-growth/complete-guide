import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { queryProfile } from "@/lib/query-config";
import { toast } from "sonner";

export interface ProjectTreeNode {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  sort_order: number;
  archived: boolean;
  kind: "space_root" | "folder" | "list" | "inbox";
  squad_id: string | null;
  is_private: boolean;
  children: ProjectTreeNode[];
}

const MAX_DEPTH = 3;
// Inbox pessoal: trigger handle_new_user cria um projeto "Inbox de <nome>" por usuário.
// Cada user só vê a própria inbox — evita poluição vinda de signups de teste/QA na sidebar.
const INBOX_PREFIX = "Inbox de ";

interface ProjectFlatRow {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  sort_order: number | null;
  archived: boolean;
  created_by: string | null;
  kind: string | null;
  squad_id: string | null;
  is_private: boolean | null;
}

function buildTree(rows: ProjectFlatRow[]): ProjectTreeNode[] {
  const byId = new Map<string, ProjectTreeNode>();
  rows.forEach((r) => {
    byId.set(r.id, {
      id: r.id,
      name: r.name,
      icon: r.icon,
      color: r.color,
      parent_id: r.parent_id,
      sort_order: r.sort_order ?? 0,
      archived: r.archived,
      kind: (r.kind as ProjectTreeNode["kind"]) ?? "list",
      squad_id: r.squad_id,
      is_private: !!r.is_private,
      children: [],
    });
  });

  const roots: ProjectTreeNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRec = (arr: ProjectTreeNode[]) => {
    arr.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    arr.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

function depthOf(nodes: ProjectTreeNode[], targetId: string, current = 1): number {
  for (const n of nodes) {
    if (n.id === targetId) return current;
    const d = depthOf(n.children, targetId, current + 1);
    if (d > 0) return d;
  }
  return 0;
}

function subtreeDepth(node: ProjectTreeNode, current = 1): number {
  if (!node.children.length) return current;
  return Math.max(...node.children.map((c) => subtreeDepth(c, current + 1)));
}

/**
 * Coleta recursivamente todos os ids descendentes (incluindo o próprio nó).
 */
export function collectDescendantIds(node: ProjectTreeNode): string[] {
  const ids: string[] = [node.id];
  node.children.forEach((c) => ids.push(...collectDescendantIds(c)));
  return ids;
}

export function findNode(nodes: ProjectTreeNode[], id: string): ProjectTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const r = findNode(n.children, id);
    if (r) return r;
  }
  return null;
}

export function useProjectTree() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();

  const query = useQuery({
    ...queryProfile("structural"),
    queryKey: ["project-tree", tenantId, user?.id],
    enabled: !!tenantId,
    queryFn: async (): Promise<ProjectFlatRow[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, icon, color, archived, parent_id, sort_order, created_by, kind, squad_id, is_private")
        .eq("tenant_id", tenantId!)
        .eq("archived", false);
      if (error) throw error;
      const rows = (data ?? []) as ProjectFlatRow[];
      // Esconde inboxes de outros usuários (mantém a do usuário atual).
      return rows.filter((r) => {
        const isInbox = r.kind === "inbox" || r.name.startsWith(INBOX_PREFIX);
        if (!isInbox) return true;
        return r.created_by ? r.created_by === user?.id : false;
      });
    },
  });

  const tree = useMemo(() => buildTree(query.data ?? []), [query.data]);

  const mutateMove = useMutation({
    mutationFn: async ({
      id,
      parentId,
      sortOrder,
    }: {
      id: string;
      parentId: string | null;
      sortOrder: number;
    }) => {
      // Validação de profundidade: max 3 níveis.
      if (parentId) {
        const parentDepth = depthOf(tree, parentId);
        if (parentDepth === 0) throw new Error("Pasta destino inválida");
        const moving = (function find(arr: ProjectTreeNode[]): ProjectTreeNode | null {
          for (const n of arr) {
            if (n.id === id) return n;
            const f = find(n.children);
            if (f) return f;
          }
          return null;
        })(tree);
        if (!moving) throw new Error("Projeto não encontrado");
        if (parentDepth + (subtreeDepth(moving) - 1) > MAX_DEPTH) {
          throw new Error(`Máximo de ${MAX_DEPTH} níveis de hierarquia`);
        }
      }
      const { error } = await supabase
        .from("projects")
        .update({ parent_id: parentId, sort_order: sortOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-tree", tenantId] });
      qc.invalidateQueries({ queryKey: ["projects-list", tenantId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mutateRename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Nome não pode ficar vazio");
      const { error } = await supabase.from("projects").update({ name: trimmed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-tree", tenantId] });
      qc.invalidateQueries({ queryKey: ["projects-list", tenantId] });
      toast.success("Renomeado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mutateCreate = useMutation({
    mutationFn: async (input: {
      name: string;
      parentId?: string | null;
      icon?: string | null;
      color?: string | null;
    }) => {
      if (!tenantId) throw new Error("Sem workspace");
      const trimmed = input.name.trim();
      if (!trimmed) throw new Error("Nome obrigatório");
      if (input.parentId) {
        const parentDepth = depthOf(tree, input.parentId);
        if (parentDepth >= MAX_DEPTH) {
          throw new Error(`Máximo de ${MAX_DEPTH} níveis de hierarquia`);
        }
      }
      const key = trimmed
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Za-z0-9]/g, "")
        .slice(0, 6)
        .toUpperCase() || "PROJ";
      const { error } = await supabase.from("projects").insert([
        {
          tenant_id: tenantId,
          name: trimmed,
          key,
          icon: input.icon ?? null,
          color: input.color ?? null,
          parent_id: input.parentId ?? null,
          sort_order: 999,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-tree", tenantId] });
      qc.invalidateQueries({ queryKey: ["projects-list", tenantId] });
      toast.success("Projeto criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    tree,
    flat: query.data ?? [],
    isLoading: query.isLoading,
    mutateMove,
    mutateRename,
    mutateCreate,
    maxDepth: MAX_DEPTH,
  };
}

export { buildTree, depthOf, subtreeDepth };
