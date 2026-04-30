import {
  ArrowRight,
  Sparkles,
  Megaphone,
  TrendingUp,
  CheckCircle2,
  Zap,
  Brain,
  KanbanSquare,
  Calendar,
  Timer,
  LineChart,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import logoOxy from "@/assets/logo-oxy.png";
import heroBg from "@/assets/hero-bg.jpg";
import SEO from "@/components/SEO";

const squads = [
  {
    name: "IA & Automação",
    icon: Sparkles,
    color: "squad-ia",
    desc: "Automações n8n, integrações de LLM e o motor do Gênio.",
  },
  {
    name: "Marketing",
    icon: Megaphone,
    color: "squad-marketing",
    desc: "Conteúdo orgânico, copies, campanhas e materiais comerciais.",
  },
  {
    name: "Expansão",
    icon: TrendingUp,
    color: "squad-expansao",
    desc: "Captação e onboarding de franqueados da Franquia O2.",
  },
];

const features = [
  { icon: KanbanSquare, title: "Kanban + Lista + Timeline", desc: "Múltiplas visões por projeto, drag-drop e auto-atribuição." },
  { icon: Calendar, title: "Calendário editorial", desc: "Plano editorial pivota direto no calendário com previews fiéis." },
  { icon: Timer, title: "Pomodoro & Time tracking", desc: "Foco com sons ambientes, sync multi-device e apontamento manual." },
  { icon: Brain, title: "Gênio Growth (IA)", desc: "Geração de copy, categorização, busca semântica e resumo semanal." },
  { icon: LineChart, title: "Workload & relatórios", desc: "Heatmap de carga, eficiência estimada vs realizada, export PDF/Excel." },
  { icon: ShieldCheck, title: "Portal de Demandas", desc: "Solicitantes externos abrem demanda sem consumir licença." },
];

const setupSteps = [
  { done: true, label: "Lovable Cloud habilitado" },
  { done: true, label: "Design system O2 (azul Oxy + dourado)" },
  { done: true, label: "Tipografia Inter + tokens semânticos" },
  { done: true, label: "Cliente Supabase configurado" },
  { done: false, label: "Migration inicial do schema (Passo 2)" },
  { done: false, label: "Autenticação + Onboarding (Passo 3)" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Oxy Growth OS — sistema operacional do time de Growth"
        description="TickTick + Ekyte para times de Growth: tarefas, calendário editorial, workload, IA Gênio e relatórios — tudo num só lugar."
        canonical="https://oxy.o2inc.com/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Oxy Growth OS",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
          publisher: { "@type": "Organization", name: "O2 Inc." },
          description: "Sistema operacional do time de Growth da O2 — produtividade, mídias sociais, IA e relatórios.",
        }}
      />
      {/* HERO */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-[0.55]"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/85 to-background" />

        <nav className="container flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <img src={logoOxy} alt="Oxy Growth OS" width={40} height={40} className="h-10 w-10" />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight">Oxy Growth OS</span>
              <span className="text-[11px] text-muted-foreground">por O2 Inc.</span>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
              <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Em construção · Passo 1 de 16
            </Badge>
          </div>
        </nav>

        <div className="container py-16 md:py-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <Badge className="mb-6 bg-accent/20 text-accent-foreground hover:bg-accent/20">
              Ferramenta interna · pt-BR
            </Badge>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl">
              O sistema operacional do{" "}
              <span className="text-gradient-brand">time de Growth</span> da O2.
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              TickTick + Ekyte adaptado para o time de Growth: Inbox, Kanban, calendário editorial,
              workload, time tracking, portal de demandas e o Gênio Growth — tudo num só lugar.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="hero" size="xl" asChild>
                <a href="#setup">
                  Ver progresso da construção <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <a href="#funcionalidades">Conhecer funcionalidades</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* SQUADS */}
      <section className="container py-16">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">Três squads, um sistema</h2>
          <p className="text-muted-foreground">
            Cada squad com seu workflow, mas operando sob a mesma camada de produtividade.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {squads.map((s) => (
            <Card key={s.name} className="group relative overflow-hidden p-6 transition-all hover:shadow-elevated">
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ backgroundColor: `hsl(var(--${s.color}))` }}
              />
              <div
                className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `hsl(var(--${s.color}) / 0.12)` }}
              >
                <s.icon
                  className="h-6 w-6"
                  style={{ color: `hsl(var(--${s.color}))` }}
                />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{s.name}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" className="bg-gradient-subtle py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4">Visão do produto</Badge>
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              Velocidade do TickTick, opinião do Ekyte
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Toda tarefa nasce com um Tipo (fluxo + checklist + estimativa) e o usuário trabalha
              com a UX rápida do dia a dia.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="p-6 transition-all hover:-translate-y-0.5 hover:shadow-soft">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SETUP STATUS */}
      <section id="setup" className="container py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">
              <Zap className="mr-1.5 h-3 w-3" /> Passo 1 concluído
            </Badge>
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              Setup do projeto
            </h2>
            <p className="text-muted-foreground">
              Tema visual, tokens semânticos e backend prontos. Próximo passo: schema do banco.
            </p>
          </div>

          <Card className="p-6 md:p-8">
            <ul className="space-y-3">
              {setupSteps.map((step) => (
                <li
                  key={step.label}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <CheckCircle2
                    className={`h-5 w-5 shrink-0 ${
                      step.done ? "text-success" : "text-muted-foreground/40"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      step.done ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.done && (
                    <Badge variant="outline" className="ml-auto border-success/30 text-success">
                      OK
                    </Badge>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-sm">
              <p className="font-medium text-foreground">Roadmap de 16 passos</p>
              <p className="mt-1 text-muted-foreground">
                Estamos seguindo a sequência do PRD §14 — um passo por turno, sem pular etapas.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-card">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <img src={logoOxy} alt="" width={20} height={20} className="h-5 w-5" loading="lazy" />
            <span>© {new Date().getFullYear()} O2 Inc. — Oxy Growth OS</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Ferramenta interna</span>
            <span className="text-muted-foreground/40">·</span>
            <span>Lovable Cloud</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
