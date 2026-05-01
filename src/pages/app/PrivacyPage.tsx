import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Download, Trash2, FileCheck } from "lucide-react";
import { useConsents, useSetConsent, usePrivacyRequests, useExportPersonalData, useRequestDeletion, CONSENT_LABELS, type ConsentKind } from "@/hooks/usePrivacy";
import { SEO } from "@/components/SEO";

export default function PrivacyPage() {
  const { data: consents = [] } = useConsents();
  const { data: requests = [] } = usePrivacyRequests();
  const setConsent = useSetConsent();
  const exportMine = useExportPersonalData();
  const deleteReq = useRequestDeletion();
  const [delNotes, setDelNotes] = useState("");

  const latestByKind = (kind: ConsentKind) => consents.find((c) => c.kind === kind);
  const isGranted = (kind: ConsentKind) => latestByKind(kind)?.granted ?? (kind === "terms" || kind === "privacy");

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <SEO title="Privacidade (LGPD/GDPR) · Oxy" description="Controle seus dados pessoais" />
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="h-6 w-6" /> Privacidade & dados pessoais</h1>
        <p className="text-muted-foreground">Conforme LGPD e GDPR, você controla seus dados.</p>
      </header>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5" /> Consentimentos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(CONSENT_LABELS) as ConsentKind[]).map((kind) => (
            <div key={kind} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div>
                <div className="text-sm font-medium">{CONSENT_LABELS[kind]}</div>
                <div className="text-xs text-muted-foreground">{latestByKind(kind) ? `atualizado em ${new Date(latestByKind(kind)!.granted_at).toLocaleDateString("pt-BR")}` : "—"}</div>
              </div>
              <Switch checked={isGranted(kind)} onCheckedChange={(v) => setConsent.mutate({ kind, granted: v })} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Direito de portabilidade</CardTitle>
          <CardDescription>Baixe um JSON com seus dados pessoais armazenados.</CardDescription></CardHeader>
        <CardContent>
          <Button onClick={() => exportMine.mutate()} disabled={exportMine.isPending}>
            {exportMine.isPending ? "Gerando..." : "Exportar meus dados"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" /> Direito ao esquecimento</CardTitle>
          <CardDescription>Solicitar exclusão de conta. Processado em até 30 dias.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Textarea placeholder="Motivo (opcional)" value={delNotes} onChange={(e) => setDelNotes(e.target.value)} />
          <Button variant="destructive" onClick={() => deleteReq.mutate(delNotes, { onSuccess: () => setDelNotes("") })}>
            Solicitar exclusão da minha conta
          </Button>
        </CardContent>
      </Card>

      {requests.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Histórico de pedidos</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {requests.map((r) => (
                <li key={r.id} className="py-2 flex items-center justify-between text-sm">
                  <div><span className="font-medium uppercase">{r.kind}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</span></div>
                  <Badge variant={r.status === "done" ? "default" : "secondary"}>{r.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
