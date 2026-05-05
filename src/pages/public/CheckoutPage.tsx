import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import logoOxy from "@/assets/logo-oxy.png";
import SEO from "@/components/SEO";
import { DemoBadge } from "@/components/feedback/DemoBadge";
import { usePublicPlans, useCreateCheckout, useMarkCheckoutSuccess } from "@/hooks/useCommercial";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { plan: planSlug } = useParams<{ plan: string }>();
  const [search] = useSearchParams();
  const cycle = (search.get("cycle") as "monthly" | "yearly") ?? "monthly";
  const nav = useNavigate();
  const { user } = useAuth();
  const { data: plans = [] } = usePublicPlans();
  const create = useCreateCheckout();
  const markSuccess = useMarkCheckoutSuccess();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [card, setCard] = useState("4242 4242 4242 4242");

  const plan = plans.find((p) => p.slug === planSlug);
  const amount = plan ? (cycle === "yearly" ? plan.price_yearly : plan.price_monthly) : 0;

  useEffect(() => { if (user?.email) setEmail(user.email); }, [user?.email]);

  if (!plan) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-8 text-center">
          <p>Plano não encontrado.</p>
          <Link to="/precos"><Button className="mt-4">Voltar para preços</Button></Link>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info("Faça login antes de finalizar.");
      nav(`/auth?next=/checkout/${planSlug}?cycle=${cycle}`);
      return;
    }
    try {
      const session = await create.mutateAsync({ plan_slug: plan.slug, billing_cycle: cycle, amount });
      await markSuccess.mutateAsync(session.id);
      setTimeout(() => nav("/app/configuracoes/plano"), 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no checkout");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`Checkout — Plano ${plan.name}`} description={`Ative o plano ${plan.name} no Oxy Growth OS.`} />
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/precos" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <div className="flex items-center gap-2">
            <img src={logoOxy} alt="Oxy" className="h-7 w-7" />
            <span className="font-semibold">Checkout</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <h1 className="text-2xl font-bold">Finalizar assinatura</h1>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" /> Pagamento seguro
          </p>

          <DemoBadge
            variant="banner"
            feature="Stripe"
            description="Checkout em modo preview — nenhuma cobrança real será efetuada."
            lovableHint="Configure STRIPE_SECRET_KEY e webhook em Lovable Cloud → Secrets para ativar cobrança real."
            className="mt-6"
          />

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="card">Cartão (preview)</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="card" value={card} onChange={(e) => setCard(e.target.value)} className="pl-9" />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={create.isPending || markSuccess.isPending}>
              {create.isPending || markSuccess.isPending ? "Processando..." : `Pagar R$ ${amount.toFixed(2)} (preview)`}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Resumo do pedido</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">Plano {plan.name}</p>
                <p className="text-xs text-muted-foreground">Cobrança {cycle === "yearly" ? "anual" : "mensal"}</p>
              </div>
              {plan.highlight && <Badge><Sparkles className="mr-1 h-3 w-3" />Popular</Badge>}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span><span>R$ {amount.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between font-semibold">
                <span>Total</span><span>R$ {amount.toFixed(2)}</span>
              </div>
            </div>
            {plan.slug === "pro" && (
              <p className="mt-3 text-xs text-muted-foreground">Inclui 14 dias de trial — cobrança após o período.</p>
            )}
          </Card>
          <Card className="p-4 text-xs text-muted-foreground">
            Ao continuar, você concorda com os Termos e a Política de Privacidade.
          </Card>
        </div>
      </main>
    </div>
  );
}