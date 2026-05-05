import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { usePlans, useTenantBilling, useChangePlan } from "@/hooks/useWorkspaces";
import { useWorkspace } from "@/hooks/useWorkspace";
import { SEO } from "@/components/SEO";
import { DemoBadge } from "@/components/feedback/DemoBadge";

export default function PlanPage() {
  const { tenantId } = useWorkspace();
  const { data: plans = [] } = usePlans();
  const { data: billing } = useTenantBilling(tenantId);
  const change = useChangePlan();
  const currentPlanId = billing?.plan_id ?? "free";

  return (
    <div className="space-y-6">
      <SEO title="Plano e billing" description="Escolha o plano ideal para seu workspace." />
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Plano do workspace
        </h1>
        <div className="text-sm text-muted-foreground flex items-center gap-2">Plano atual: <Badge>{currentPlanId.toUpperCase()}</Badge></div>
      </div>
      <DemoBadge
        variant="banner"
        feature="Stripe"
        description="Billing está em modo simulação."
        lovableHint="Configure STRIPE_SECRET_KEY e webhook em Lovable Cloud → Secrets para ativar cobrança real."
      />
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const features = (p.features as Record<string, unknown>) ?? {};
          const isCurrent = p.id === currentPlanId;
          return (
            <Card key={p.id} className={isCurrent ? "border-primary shadow-brand" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{p.name}</CardTitle>
                  {isCurrent && <Badge variant="default">Atual</Badge>}
                </div>
                <p className="text-3xl font-bold mt-2">R$ {Number(p.price_monthly).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              </CardHeader>
              <CardContent className="space-y-2">
                <Feature label={`Até ${p.max_members} membros`} />
                <Feature label={`Até ${p.max_projects} projetos`} />
                <Feature label={`${features.automations === -1 ? "Ilimitadas" : features.automations} automações`} />
                <Feature label={`${features.webhooks === -1 ? "Ilimitados" : features.webhooks} webhooks`} />
                <Feature label={`${features.ai_credits} créditos IA/mês`} />
                {features.exports ? <Feature label="Exportações avançadas" /> : null}
                {features.priority_support ? <Feature label="Suporte prioritário" /> : null}
                {features.sso ? <Feature label="SSO / SAML" /> : null}
                <Button
                  className="w-full mt-3"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || !tenantId}
                  onClick={() => tenantId && change.mutate({ tenantId, planId: p.id })}
                >
                  {isCurrent ? "Plano atual" : "Selecionar"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Feature({ label }: { label: string }) {
  return <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-success" /> {label}</div>;
}
