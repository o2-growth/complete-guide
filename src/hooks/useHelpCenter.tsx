import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HelpCategory { id: string; slug: string; name: string; description: string | null; icon: string | null; position: number; }
export interface HelpArticle { id: string; category_id: string | null; slug: string; title: string; body_md: string; tags: string[]; views: number; helpful_count: number; }
export interface ChangelogEntry { id: string; version: string; title: string; body_md: string; kind: string; released_at: string; }
export interface SystemStatus { id: string; service: string; status: string; message: string | null; updated_at: string; }

export const useHelpCategories = () => useQuery({
  queryKey: ["help-categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("help_categories").select("*").order("position");
    if (error) throw error;
    return (data ?? []) as HelpCategory[];
  },
});

export const useHelpArticles = (q: string = "") => useQuery({
  queryKey: ["help-articles", q],
  queryFn: async () => {
    let query = supabase.from("help_articles").select("*").eq("published", true).order("title");
    if (q.trim()) query = query.or(`title.ilike.%${q}%,body_md.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as HelpArticle[];
  },
});

export const useChangelog = () => useQuery({
  queryKey: ["changelog"],
  queryFn: async () => {
    const { data, error } = await supabase.from("changelog_entries").select("*").order("released_at", { ascending: false }).limit(30);
    if (error) throw error;
    return (data ?? []) as ChangelogEntry[];
  },
});

export const useSystemStatus = () => useQuery({
  queryKey: ["system-status"],
  queryFn: async () => {
    const { data, error } = await supabase.from("system_status").select("*").order("service");
    if (error) throw error;
    return (data ?? []) as SystemStatus[];
  },
});