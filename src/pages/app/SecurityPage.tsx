import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, KeyRound, Activity, Trash2 } from "lucide-react";
import { useMfaFactors, useEnrollTotp, useVerifyTotp, useUnenrollTotp, useSecurityAudit } from "@/hooks/useSecurity";
import { SEO } from "@/components/SEO";

export default function SecurityPage() {
  const { data: factors } = useMfaFactors();
  const { data: events = [] } = useSecurityAudit(30);
  const enroll = useEnrollTotp();
  const verify = useVerifyTotp();
  const unenroll = useUnenrollTotp();
  const [code, setCode] = useState("");
  const [enrollment, setEnrollment] = useState<{ id: string; uri: string; secret: string } | null>(null);

  const totpFactors = factors?.totp ?? [];
  const verified = totpFactors.find((f) => f.status === "verified");

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <SEO title="Segurança · Oxy" description="2FA, sessões e auditoria de acesso" />
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6" /> Segurança</h1>
        <p className="text-muted-foreground">Proteja sua conta com autenticação em 2 fatores e revise o histórico de acesso.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Autenticação em 2 fatores (TOTP)</CardTitle>
          <CardDescription>Use um app como Google Authenticator, 1Password ou Authy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verified ? (
            <div className="flex items-center justify-between rounded-lg border border-success/40 bg-success/5 p-4">
              <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-success" />
                <span className="text-sm">2FA ativo ({verified.friendly_name || "TOTP"})</span></div>
              <Button size="sm" variant="outline" onClick={() => unenroll.mutate(verified.id)}>Remover</Button>
            </div>
          ) : enrollment ? (
            <div className="space-y-3">
              <p className="text-sm">Escaneie o QR no seu app autenticador:</p>
              <div className="rounded border p-3 inline-block bg-card">
                <img alt="QR TOTP" src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(enrollment.uri)}`} className="h-44 w-44" />
              </div>
              <p className="text-xs text-muted-foreground break-all">Secret: <code>{enrollment.secret}</code></p>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Código de 6 dígitos</Label>
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} />
                </div>
                <Button onClick={() => verify.mutate({ factorId: enrollment.id, code }, { onSuccess: () => { setEnrollment(null); setCode(""); } })}>Verificar</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => enroll.mutate("Authenticator", { onSuccess: (d) => setEnrollment({ id: d.id, uri: d.totp.uri, secret: d.totp.secret }) })}>
              Ativar 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Histórico de acesso</CardTitle>
          <CardDescription>Últimos 30 eventos da sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
          ) : (
            <ul className="divide-y">
              {events.map((e) => (
                <li key={e.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{e.event}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                  <Badge variant={e.severity === "critical" || e.severity === "error" ? "destructive" : "secondary"}>{e.severity}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
