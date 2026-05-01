import { useRef, useState } from "react";
import { Database, Upload, Download, FileJson, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useImportJobs, useExportJobs, useImportTasks, useExportWorkspace, parseCSV } from "@/hooks/useDataManagement";
import { EmptyState } from "@/components/EmptyState";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const TARGET_FIELDS = [
  { value: "title", label: "Título *" },
  { value: "description", label: "Descrição" },
  { value: "priority", label: "Prioridade" },
  { value: "due_at", label: "Data de vencimento" },
  { value: "", label: "— ignorar —" },
];

export default function DataPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [csvText, setCsvText] = useState<string>("");
  const [csvFilename, setCsvFilename] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const importJobs = useImportJobs();
  const exportJobs = useExportJobs();
  const importTasks = useImportTasks();
  const exportWs = useExportWorkspace();

  const handleFile = async (file: File) => {
    const text = await file.text();
    setCsvText(text);
    setCsvFilename(file.name);
    const parsed = parseCSV(text);
    setHeaders(parsed.headers);
    // auto-mapeia campos comuns
    const auto: Record<string, string> = {};
    parsed.headers.forEach((h) => {
      const low = h.toLowerCase();
      if (low.match(/title|nome|task|t[íi]tulo/)) auto[h] = "title";
      else if (low.match(/desc/)) auto[h] = "description";
      else if (low.match(/prio/)) auto[h] = "priority";
      else if (low.match(/due|prazo|venc/)) auto[h] = "due_at";
      else auto[h] = "";
    });
    setMapping(auto);
  };

  const handleImport = async () => {
    if (!Object.values(mapping).includes("title")) {
      toast.error("Mapeie ao menos uma coluna como 'Título'");
      return;
    }
    try {
      const r = await importTasks.mutateAsync({ csvText, mapping, filename: csvFilename });
      toast.success(`Importadas ${r.created}/${r.total} tarefas`);
      setCsvText(""); setCsvFilename(""); setHeaders([]); setMapping({});
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      toast.error("Falha na importação: " + (e as Error).message);
    }
  };

  return (
    <div className="container max-w-5xl py-6">
      <SEO title="Gestão de dados · Oxy" description="Importe CSV de outras ferramentas e exporte seu workspace." />

      <div className="mb-6">
        <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
          <Database className="mr-1.5 h-3 w-3" /> Dados
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Importar & exportar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Migre de Trello/Asana/Notion via CSV e leve seus dados a qualquer momento.
        </p>
      </div>

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import"><Upload className="mr-2 h-4 w-4" /> Importar</TabsTrigger>
          <TabsTrigger value="export"><Download className="mr-2 h-4 w-4" /> Exportar</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Selecione um arquivo CSV</CardTitle>
              <CardDescription>
                Exporte do Trello, Asana, Notion ou ClickUp como CSV e arraste aqui.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Button onClick={() => fileRef.current?.click()} variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Escolher arquivo
              </Button>
              {csvFilename && (
                <p className="text-xs text-muted-foreground">
                  ✓ {csvFilename} — {headers.length} colunas detectadas
                </p>
              )}
            </CardContent>
          </Card>

          {headers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. Mapeie as colunas</CardTitle>
                <CardDescription>
                  Diga ao Oxy o que cada coluna do seu CSV representa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {headers.map((h) => (
                  <div key={h} className="grid grid-cols-2 items-center gap-3">
                    <Label className="font-mono text-xs truncate">{h}</Label>
                    <Select
                      value={mapping[h] ?? ""}
                      onValueChange={(v) => setMapping((m) => ({ ...m, [h]: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {TARGET_FIELDS.map((f) => (
                          <SelectItem key={f.value || "ignore"} value={f.value || "_ignore"}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <Button
                  onClick={handleImport}
                  disabled={importTasks.isPending}
                  className="w-full"
                >
                  {importTasks.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando…</>
                  ) : (
                    <>3. Importar para Inbox</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileJson className="h-4 w-4 text-primary" /> JSON completo
                </CardTitle>
                <CardDescription>Tarefas + projetos com todos os campos.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => exportWs.mutate("json")} disabled={exportWs.isPending} className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Baixar .json
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSpreadsheet className="h-4 w-4 text-primary" /> CSV de tarefas
                </CardTitle>
                <CardDescription>Compatível com Excel, Google Sheets.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => exportWs.mutate("csv")} disabled={exportWs.isPending} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Baixar .csv
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Importações</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {!importJobs.data?.length ? (
                <EmptyState icon={Upload} title="Nenhuma importação ainda" variant="plain" />
              ) : importJobs.data.map((j) => (
                <div key={j.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {j.status === "done" ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> :
                     j.status === "failed" ? <XCircle className="h-4 w-4 text-destructive shrink-0" /> :
                     <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{j.filename ?? j.source}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(j.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{j.created_count} ok · {j.error_count} erros</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Exportações</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {!exportJobs.data?.length ? (
                <EmptyState icon={Download} title="Nenhuma exportação ainda" variant="plain" />
              ) : exportJobs.data.map((j) => (
                <div key={j.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    {j.status === "done" ? <CheckCircle2 className="h-4 w-4 text-success" /> :
                     j.status === "failed" ? <XCircle className="h-4 w-4 text-destructive" /> :
                     <Loader2 className="h-4 w-4 animate-spin" />}
                    <div>
                      <p className="font-medium uppercase">{j.format}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(j.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {j.size_bytes ? `${(j.size_bytes / 1024).toFixed(1)} KB` : j.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}