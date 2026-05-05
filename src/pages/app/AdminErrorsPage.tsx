import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AlertOctagon, ChevronDown, ChevronRight } from "lucide-react";
import { useErrorEvents } from "@/hooks/useAdminObservability";
import { SEO } from "@/components/SEO";

export default function AdminErrorsPage() {
  const { data = [], isLoading, refetch } = useErrorEvents(150);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const n = new Set(open);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setOpen(n);
  };

  return (
    <div className="space-y-6 p-6">
      <SEO title="Admin · Erros" description="Stack traces e contexto dos erros capturados" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertOctagon className="h-6 w-6 text-destructive" /> Erros do app
          </h1>
          <p className="text-sm text-muted-foreground">{data.length} eventos recentes (limite 150).</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Atualizar</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Stack traces</CardTitle></CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && data.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum erro capturado. 🎉</p>
          )}
          <ScrollArea className="max-h-[70vh]">
            <ul className="space-y-2">
              {data.map((e) => {
                const isOpen = open.has(e.id);
                return (
                  <li key={e.id} className="rounded-md border">
                    <button
                      onClick={() => toggle(e.id)}
                      className="flex w-full items-start gap-2 p-3 text-left hover:bg-muted/50"
                      aria-expanded={isOpen}
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4 mt-0.5" /> : <ChevronRight className="h-4 w-4 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="destructive" className="text-[10px]">{e.level}</Badge>
                          <Badge variant="outline" className="text-[10px]">{e.source}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</span>
                        </div>
                        <p className="text-sm font-mono mt-1 truncate">{e.message}</p>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t p-3 space-y-2 text-xs">
                        {e.url && <p><strong>URL:</strong> {e.url}</p>}
                        {e.user_agent && <p className="truncate"><strong>UA:</strong> {e.user_agent}</p>}
                        {e.stack && (
                          <pre className="whitespace-pre-wrap rounded bg-muted p-2 font-mono text-[11px] max-h-64 overflow-auto">{e.stack}</pre>
                        )}
                        {e.context && Object.keys(e.context).length > 0 && (
                          <pre className="whitespace-pre-wrap rounded bg-muted p-2 font-mono text-[11px]">{JSON.stringify(e.context, null, 2)}</pre>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
