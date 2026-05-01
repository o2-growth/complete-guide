import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import logoOxy from "@/assets/logo-oxy.png";
import SEO from "@/components/SEO";
import { usePublicPlans, useConvertLead } from "@/hooks/useCommercial";
import { Input } from "@/components/ui/input";

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const [email, setEmail] = useState("");
  const { data: plans = [] } = usePublicPlans();
  const lead = useConvertLead();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Preços — Oxy Growth OS"
        description="Planos Free, Pro e Business para times de marketing e operações. Trial de 14 dias no Pro."
        canonical={typeof window !== "undefined" ? window.location.origin + "/precos" : undefined}
      />
      {/* Header simples */}
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoOxy} alt="Oxy" className="h-8 w-8" />
            <span className="font-semibold">Oxy Growth OS</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link to="/precos" className="text-sm text-muted-foreground hover:text-foreground">Preços</Link>
            <Link to="/auth"><Button size="sm">Entrar</Button></Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4" variant="secondary"><Sparkles className="mr-1 h-3 w-3" />Preços simples</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Escolha o plano certo para o seu time</h1>
          <p className="mt-4 text-muted-foreground">Comece grátis. Sem cartão. Sem amarras.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Label htmlFor="cycle" className={!yearly ? "font-semibold" : "text-muted-foreground"}>Mensal</Label>
            <Switch id="cycle" checked={yearly} onCheckedChange={setYearly} />
            <Label htmlFor="cycle" className={yearly ? "font-semibold" : "text-muted-foreground"}>
              Anual <Badge variant="outline" className="ml-1 text-success">-20%</Badge>
            </Label>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p) => {
            const price = yearly ? p.price_yearly / 12 : p.price_monthly;
            return (
              <Card key={p.id} className={`p-6 ${p.highlight ? "border-primary ring-2 ring-primary/40 shadow-lg" : ""}`}>
                {p.highlight && <Badge className="mb-3">Mais popular</Badge>}
                <h3 className="text-2xl font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">R$ {price.toFixed(0)}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                {yearly && p.price_yearly > 0 && (
                  <p className="text-xs text-muted-foreground">
                    R$ {p.price_yearly.toFixed(0)} cobrado anualmente
                  </p>
                )}
                <Link to={p.slug === "business" ? "/precos#contato" : `/checkout/${p.slug}?cycle=${yearly ? "yearly" : "monthly"}`}>
                  <Button className="mt-6 w-full" variant={p.highlight ? "default" : "outline"}>
                    {p.cta_label} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <ul className="mt-6 space-y-2">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        {/* Bloco de contato vendas */}
        <Card id="contato" className="mt-16 mx-auto max-w-2xl p-8">
          <h2 className="text-2xl font-bold">Precisa de algo maior?</h2>
          <p className="mt-2 text-muted-foreground">
            Para times com mais de 25 pessoas, SSO custom ou onboarding assistido, fale com a gente.
          </p>
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (email) lead.mutate({ email, source: "pricing", plan: "business" });
              setEmail("");
            }}
          >
            <Input type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" />
            <Button type="submit" disabled={lead.isPending}>Falar com vendas</Button>
          </form>
        </Card>

        {/* FAQ rápido */}
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold">Perguntas frequentes</h2>
          <div className="mt-6 space-y-4">
            {[
              ["Posso testar antes de pagar?", "Sim — o plano Pro inclui 14 dias de trial sem cartão. O Free é gratuito para sempre."],
              ["Posso mudar de plano depois?", "Pode subir ou descer a qualquer momento. Cobrança proporcional automática."],
              ["Os meus dados ficam seguros?", "Backups diários, RLS por workspace, conformidade LGPD/GDPR e auditoria completa."],
              ["Como funciona o cancelamento?", "Cancele direto pelas configurações. Mantém acesso até o fim do ciclo pago."],
            ].map(([q, a]) => (
              <Card key={q} className="p-4">
                <p className="font-semibold">{q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-20 border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Oxy Growth OS — Construído com 💙
        </div>
      </footer>
    </div>
  );
}