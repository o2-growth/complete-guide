import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

export interface ListNode { id: string; name: string; color: string | null; folder_id: string | null; }
export interface FolderNode { id: string; name: string; lists: ListNode[]; }
export interface SpaceNode {
  id: string; name: string; color: string | null;
  folders: FolderNode[];
  lists: ListNode[]; // lists directly in space (no folder)
}

export function useSpaceTree() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["space-tree", tenantId],
    enabled: !!tenantId,
    staleTime: 30_000,
    queryFn: async (): Promise<SpaceNode[]> => {
      if (!tenantId) return [];
      const [{ data: spaces }, { data: folders }, { data: lists }] = await Promise.all([
        supabase.from("spaces").select("id,name,color,sort_order")
          .eq("tenant_id", tenantId).is("archived_at", null).order("sort_order"),
        supabase.from("folders").select("id,name,space_id,sort_order")
          .eq("tenant_id", tenantId).is("archived_at", null).order("sort_order"),
        supabase.from("lists").select("id,name,color,space_id,folder_id,sort_order")
          .eq("tenant_id", tenantId).is("archived_at", null).order("sort_order"),
      ]);
      const tree: SpaceNode[] = (spaces ?? []).map((s) => ({
        id: s.id, name: s.name, color: s.color,
        folders: (folders ?? []).filter((f) => f.space_id === s.id).map((f) => ({
          id: f.id, name: f.name,
          lists: (lists ?? []).filter((l) => l.folder_id === f.id).map((l) => ({
            id: l.id, name: l.name, color: l.color, folder_id: l.folder_id,
          })),
        })),
        lists: (lists ?? []).filter((l) => l.space_id === s.id && !l.folder_id).map((l) => ({
          id: l.id, name: l.name, color: l.color, folder_id: l.folder_id,
        })),
      }));
      return tree;
    },
  });
}