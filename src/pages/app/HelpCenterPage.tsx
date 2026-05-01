import { useState } from "react";
import { Search, BookOpen, FileText, Activity, History, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useHelpCategories, useHelpArticles, useChangelog, useSystemStatus } from "@/hooks/useHelpCenter";
import { SEO } from "@/components/SEO";

export default function HelpCenterPage() {
  const [q, setQ] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const { data: categories = [] } = useHelpCategories();
  const { data: articles = [] } = useHelpArticles(q);
  const { data: changelog = [] } = useChangelog();
  const { data: status = [] } = useSystemStatus();

  const openArticle = articles.find((a) => a.slug === openSlug);

  const statusIcon = (s: string) => {
    if (s === "operational") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (s === "degraded") return <AlertTriangle className="h-4 w-4 text-warning" />;
    if (s === "outage") return <XCircle className="h-4 w-4 text-destructive" />;
    return <Wrench className="h-4 w-4 text-muted-foreground" />;
  };

  const kindBadge = (k: string) => {
    const map: Record<string, string> = { feature: "bg-primary/10 text-primary", fix: "bg-warning/10 text-warning", improvement: "bg-success/10 text-success", breaking: "bg-destructive/10 text-destructive" };
    return <Badge className={map[k] ?? ""} variant="secondary">{k}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <SEO title="Central de Ajuda — Oxy" description="Artigos, changelog e status do sistema" />
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Central de Ajuda</h1>
        <p className="text-muted-foreground mt-1">Artigos, novidades e status do sistema.</p>
      </header>

      <Tabs defaultValue="kb">
        <TabsList>
          <TabsTrigger value="kb"><BookOpen className="h-4 w-4 mr-1" /> Base de conhecimento</TabsTrigger>
          <TabsTrigger value="changelog"><History className="h-4 w-4 mr-1" /> Changelog</TabsTrigger>
          <TabsTrigger value="status"><Activity className="h-4 w-4 mr-1" /> Status</TabsTrigger>
        </TabsList>

        <TabsContent value="kb" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar artigos..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          {openArticle ? (
            <Card className="p-6">
              <Button variant="ghost" size="sm" onClick={() => setOpenSlug(null)} className="mb-4">← Voltar</Button>
              <h2 className="text-2xl font-bold mb-3">{openArticle.title}</h2>
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90">{openArticle.body_md}</pre>
              <div className="mt-4 flex gap-1 flex-wrap">
                {openArticle.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {categories.map((c) => {
                const items = articles.filter((a) => a.category_id === c.id);
                if (items.length === 0 && q.trim()) return null;
                return (
                  <Card key={c.id} className="p-4">
                    <h3 className="font-semibold mb-1">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{c.description}</p>
                    <div className="space-y-1">
                      {items.map((a) => (
                        <button key={a.id} onClick={() => setOpenSlug(a.slug)} className="w-full text-left flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted text-sm">
                          <span className="flex items-center gap-2"><FileText className="h-3 w-3 text-muted-foreground" />{a.title}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </button>
                      ))}
                      {items.length === 0 && <p className="text-xs text-muted-foreground">Sem artigos.</p>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="changelog" className="space-y-3 mt-4">
          {changelog.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">v{c.version}</Badge>
                {kindBadge(c.kind)}
                <span className="text-xs text-muted-foreground ml-auto">{new Date(c.released_at).toLocaleDateString("pt-BR")}</span>
              </div>
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{c.body_md}</p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="status" className="space-y-2 mt-4">
          {status.map((s) => (
            <Card key={s.id} className="p-4 flex items-center gap-3">
              {statusIcon(s.status)}
              <div className="flex-1">
                <p className="font-medium">{s.service}</p>
                {s.message && <p className="text-xs text-muted-foreground">{s.message}</p>}
              </div>
              <Badge variant="outline" className="capitalize">{s.status}</Badge>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}