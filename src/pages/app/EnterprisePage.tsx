import { useState } from "react";
import { Building2, Globe, Shield, Users, FileCheck, Plus, Database, Zap, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useTenantEnterprise, useUpdateTenantEnterprise, useSsoConfigs, useCreateSsoConfig, useImpersonationSessions, useComplianceExports, useRequestComplianceExport } from "@/hooks/useEnterprise";
import { SEO } from "@/components/SEO";

export default function EnterprisePage() {
  const { data: tenant } = useTenantEnterprise();
  const updateTenant = useUpdateTenantEnterprise();
  const { data: sso = [] } = useSsoConfigs();
  const createSso = useCreateSsoConfig();
  const { data: impersonations = [] } = useImpersonationSessions();
  const { data: exports = [] } = useComplianceExports();
  const requestExport = useRequestComplianceExport();

  const [domain, setDomain] = useState("");
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [residency, setResidency] = useState("us-east-1");
  const [slaTier, setSlaTier] = useState<"standard"|"premium"|"enterprise">("standard");

  // SSO dialog
  const [ssoOpen, setSsoOpen] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<"saml"|"oidc">("saml");
  const [ssoMeta, setSsoMeta] = useState("");
  const [ssoDomains, setSsoDomains] = useState("");

  // sync state quando tenant carrega
  useState(() => {
    if (tenant) {
      setDomain(tenant.custom_domain ?? "");
      setWhiteLabel(tenant.white_label);
      setResidency(tenant.data_residency);
      setSlaTier(tenant.sla_tier);
    }
  });

  const saveTenant = () => updateTenant.mutate({ custom_domain: domain || null, white_label: whiteLabel, data_residency: residency, sla_tier: slaTier });

  const submitSso = () => {
    createSso.mutate({ provider: ssoProvider, metadata_url: ssoMeta, domains: ssoDomains.split(",").map((d) => d.trim()).filter(Boolean) });
    setSsoOpen(false);
    setSsoMeta(""); setSsoDomains("");
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
      <SEO title="Enterprise — Oxy" description="White-label, SSO, conformidade e suporte" />
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Building2 className="h-7 w-7 text-primary" /> Enterprise</h1>
        <p className="text-muted-foreground mt-1">Domínio próprio, white-label, SSO, impersonation e conformidade.</p>
      </header>

      <Tabs defaultValue="brand">
        <TabsList>
          <TabsTrigger value="brand"><Globe className="h-4 w-4 mr-1" />Domínio & White-label</TabsTrigger>
          <TabsTrigger value="sso"><Shield className="h-4 w-4 mr-1" />SSO</TabsTrigger>
          <TabsTrigger value="impersonation"><Users className="h-4 w-4 mr-1" />Impersonation</TabsTrigger>
          <TabsTrigger value="compliance"><FileCheck className="h-4 w-4 mr-1" />Conformidade</TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="space-y-4 mt-4">
          <Card className="p-5 space-y-4">
            <div>
              <Label htmlFor="dom">Domínio customizado</Label>
              <Input id="dom" placeholder="app.suaempresa.com" value={domain} onChange={(e) => setDomain(e.target.value)} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Configure CNAME apontando para `app.oxy.com`. SSL automático após validação.</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>White-label completo</Label>
                <p className="text-xs text-muted-foreground">Remove marca "Oxy" da interface, e-mails e relatórios.</p>
              </div>
              <Switch checked={whiteLabel} onCheckedChange={setWhiteLabel} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Data residency</Label>
                <Select value={residency} onValueChange={setResidency}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us-east-1">🇺🇸 US East (Virgínia)</SelectItem>
                    <SelectItem value="eu-west-1">🇪🇺 EU West (Irlanda)</SelectItem>
                    <SelectItem value="sa-east-1">🇧🇷 South America (São Paulo)</SelectItem>
                    <SelectItem value="ap-southeast-1">🇸🇬 Asia Pacific (Singapura)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tier de SLA</Label>
                <Select value={slaTier} onValueChange={(v) => setSlaTier(v as "standard"|"premium"|"enterprise")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (99.5%)</SelectItem>
                    <SelectItem value="premium">Premium (99.9%)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (99.99% + suporte 24/7)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={saveTenant} disabled={updateTenant.isPending}>
              {updateTenant.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-1" />
              )}
              Salvar configurações
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="sso" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">SSO via SAML 2.0 ou OIDC. Membros entram com Okta, Azure AD, Google Workspace etc.</p>
            <Dialog open={ssoOpen} onOpenChange={setSsoOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar SSO</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Configurar SSO</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Provider</Label>
                    <Select value={ssoProvider} onValueChange={(v) => setSsoProvider(v as "saml"|"oidc")}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="saml">SAML 2.0</SelectItem><SelectItem value="oidc">OpenID Connect</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Metadata URL</Label>
                    <Input placeholder="https://idp.suaempresa.com/metadata" value={ssoMeta} onChange={(e) => setSsoMeta(e.target.value)} />
                  </div>
                  <div>
                    <Label>Domínios (separados por vírgula)</Label>
                    <Input placeholder="suaempresa.com, sub.suaempresa.com" value={ssoDomains} onChange={(e) => setSsoDomains(e.target.value)} />
                  </div>
                </div>
                <DialogFooter><Button onClick={submitSso} disabled={!ssoMeta}>Salvar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {sso.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">Nenhum SSO configurado.</Card>}
          {sso.map((s) => (
            <Card key={s.id} className="p-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium uppercase text-sm">{s.provider}</p>
                <p className="text-xs text-muted-foreground truncate">{s.metadata_url}</p>
                <div className="flex gap-1 mt-1">{s.domains.map((d) => <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>)}</div>
              </div>
              <Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Ativo" : "Inativo"}</Badge>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="impersonation" className="space-y-3 mt-4">
          <Card className="p-4 bg-warning/5 border-warning/30">
            <p className="text-sm"><Zap className="h-4 w-4 inline mr-1 text-warning" /> Impersonation permite que admins acessem contas de membros para suporte. Toda sessão é auditada.</p>
          </Card>
          {impersonations.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">Nenhuma sessão de impersonation registrada.</Card>}
          {impersonations.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">Admin → Usuário {s.target_user_id.slice(0,8)}</p>
                <Badge variant={s.ended_at ? "secondary" : "default"}>{s.ended_at ? "Encerrada" : "Ativa"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Motivo: {s.reason}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(s.started_at).toLocaleString("pt-BR")}</p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-3 mt-4">
          <div className="grid md:grid-cols-4 gap-2">
            <Button variant="outline" onClick={() => requestExport.mutate({ kind: "audit" })}>Audit Log</Button>
            <Button variant="outline" onClick={() => requestExport.mutate({ kind: "soc2" })}>SOC 2</Button>
            <Button variant="outline" onClick={() => requestExport.mutate({ kind: "gdpr" })}>GDPR</Button>
            <Button variant="outline" onClick={() => requestExport.mutate({ kind: "full" })}>Backup completo</Button>
          </div>
          {exports.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">Nenhum relatório solicitado.</Card>}
          {exports.map((e) => (
            <Card key={e.id} className="p-4 flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium uppercase">{e.kind}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <Badge variant={e.status === "done" ? "default" : "secondary"}>{e.status}</Badge>
              {e.file_url && <Button size="sm" variant="ghost" asChild><a href={e.file_url} download>Baixar</a></Button>}
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}