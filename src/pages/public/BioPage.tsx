import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface BioPageData {
  id: string; title: string; bio: string | null; avatar_url: string | null;
  theme: { bg?: string; fg?: string; accent?: string; button_style?: string };
  active: boolean;
}
interface BioLinkData {
  id: string; label: string; icon: string | null; position: number;
}

export default function PublicBioPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<BioPageData | null>(null);
  const [links, setLinks] = useState<BioLinkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: p } = await supabase.from("bio_pages")
        .select("id,title,bio,avatar_url,theme,active").eq("slug", slug).maybeSingle();
      if (p && p.active) {
        setPage(p as unknown as BioPageData);
        const { data: ls } = await supabase.from("bio_links")
          .select("id,label,icon,position").eq("page_id", p.id).eq("active", true).order("position");
        setLinks((ls ?? []) as BioLinkData[]);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Carregando…</div>;
  }
  if (!page) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Página não encontrada</div>;
  }

  const bg = page.theme?.bg ?? "#0F172A";
  const fg = page.theme?.fg ?? "#FFFFFF";
  const accent = page.theme?.accent ?? "#0EA5E9";
  const rounded = page.theme?.button_style === "pill" ? "rounded-full" : "rounded-xl";

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const redirectBase = `https://${projectId}.supabase.co/functions/v1/bio-redirect`;

  return (
    <main style={{ backgroundColor: bg, color: fg }} className="min-h-screen">
      <div className="mx-auto max-w-md px-6 py-12">
        {page.avatar_url && (
          <img src={page.avatar_url} alt={page.title}
            className="mx-auto h-24 w-24 rounded-full object-cover mb-4 ring-2"
            style={{ borderColor: accent }} />
        )}
        <h1 className="text-center text-2xl font-bold">{page.title}</h1>
        {page.bio && <p className="mt-2 text-center text-sm opacity-80">{page.bio}</p>}

        <div className="mt-8 space-y-3">
          {links.length === 0 && <p className="text-center text-sm opacity-60">Nenhum link disponível.</p>}
          {links.map((l) => (
            <a key={l.id}
              href={`${redirectBase}?id=${l.id}`}
              className={`block w-full px-5 py-4 ${rounded} text-center font-medium transition-transform hover:scale-[1.02]`}
              style={{ backgroundColor: accent, color: bg }}>
              {l.label}
            </a>
          ))}
        </div>

        <p className="mt-12 text-center text-[10px] opacity-40">Powered by Oxy Growth OS</p>
      </div>
    </main>
  );
}