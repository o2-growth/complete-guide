import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Store, Download, Star, Search } from "lucide-react";
import { useMarketplaceTemplates, useInstallTemplate, useMyMarketplaceInstalls } from "@/hooks/useMarketplace";
import { SEO } from "@/components/SEO";

export default function MarketplacePage() {
  const { data: templates = [], isLoading } = useMarketplaceTemplates();
  const { data: installs = [] } = useMyMarketplaceInstalls();
  const install = useInstallTemplate();
  const [q, setQ] = useState("");

  const filtered = templates.filter((t) => !q || t.name.toLowerCase().includes(q.toLowerCase()));
  const installedIds = new Set(installs.map((i) => i.template_id));

  return (
    <div className="space-y-6 p-6">
      <SEO title="Marketplace de templates · Oxy" description="Instale templates prontos no seu workspace" />
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Store className="h-6 w-6" /> Marketplace</h1>
          <p className="text-muted-foreground">Templates prontos da comunidade e oficiais.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-64" placeholder="Buscar template..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!isLoading && filtered.length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          Ainda não há templates publicados. Volte em breve.
        </CardContent></Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <Card key={t.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t.name}</CardTitle>
                {t.is_official && <Badge>Oficial</Badge>}
              </div>
              <CardDescription className="line-clamp-2">{t.description || "—"}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="h-3 w-3" />{Number(t.rating_avg).toFixed(1)}</span>
                <span className="flex items-center gap-1"><Download className="h-3 w-3" />{t.install_count}</span>
                <Badge variant="outline" className="capitalize">{t.category}</Badge>
              </div>
              <Button
                size="sm"
                disabled={installedIds.has(t.id) || install.isPending}
                onClick={() => install.mutate(t.id)}
              >
                {installedIds.has(t.id) ? "Instalado" : "Instalar no workspace"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
