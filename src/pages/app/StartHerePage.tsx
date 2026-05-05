import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket, Users, User, Building2, Sparkles, PlayCircle,
  Compass, BookOpen, Wand2, CheckCircle2, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/useConfetti";
import { useGuidedTour } from "@/hooks/useGuidedTour";
import { GuidedTour } from "@/components/onboarding/GuidedTour";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";
import { Progress } from "@/components/ui/progress";
import { SEO } from "@/components/SEO";
import DailyFocusCard from "@/components/ai/DailyFocusCard";

type Persona = "agencia" | "freelancer" | "interno";

const PERSONAS: { id: Persona; icon: typeof Users; title: string; description: string }[] = [
  { id: "agencia", icon: Users, title: "Agência", description: "Múltiplos clientes, squads, calendário editorial." },
  { id: "freelancer", icon: User, title: "Freelancer / Solo", description: "Você + alguns clientes, foco em entrega." },
  { id: "interno", icon: Building2, title: "Time interno", description: "Marketing in-house ou produto." },
];

const TOUR_STEPS = [
  { selector: "[data-tour='sidebar']", title: "Sua navegação principal", description: "Tudo organizado em grupos: tarefas, social, insights, sistema." },
  { selector: "[data-tour='topbar']", title: "Busca global e atalhos", description: "Use Cmd/Ctrl+K para a paleta de comandos." },
  { selector: "[data-tour='quickadd']", title: "Captura rápida", description: "Quick Add entende linguagem natural em PT-BR (data, prioridade, @assignee)." },
];

export default function StartHerePage() {
  const navigate = useNavigate();
  const fire = useConfetti();
  const { steps, completed, total } = useOnboardingChecklist();
  const tour = useGuidedTour(TOUR_STEPS, "main");
  const [persona, setPersona] = useState<Persona | null>(null);
  const [seeding, setSeeding] = useState(false);

  const seed = async (p: Persona) => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.rpc("seed_sample_data", { _persona: p });
      if (error) throw error;
      toast.success("Dados de exemplo criados!", { description: "Você já pode explorar." });
      fire(window.innerWidth / 2, 200);
      if (data) navigate(`/app/projetos/${data}`);
    } catch (e) {
      toast.error("Não foi possível criar agora", { description: e instanceof Error ? e.message : "" });
    } finally {
      setSeeding(false);
    }
  };

  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="container max-w-6xl space-y-8 py-8">
      <SEO title="Comece aqui — Oxy Growth OS" description="Trilha de onboarding guiada: escolha persona, gere dados de exemplo e faça o tour." />

      <DailyFocusCard />

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-brand">
          <Rocket className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comece aqui</h1>
          <p className="text-sm text-muted-foreground">Trilha rápida para você decolar em 5 minutos.</p>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/30">
        <div className="bg-gradient-brand p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Seu progresso</p>
              <p className="mt-1 text-2xl font-bold">{completed} de {total} concluídos</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-extrabold">{pct}%</p>
            </div>
          </div>
          <Progress value={pct} className="mt-4 h-2 bg-primary-foreground/20" />
        </div>
        <ul className="divide-y">
          {steps.map(s => (
            <li key={s.key} className="flex items-center gap-3 p-4">
              {s.done
                ? <CheckCircle2 className="h-5 w-5 text-success" />
                : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${s.done ? "line-through text-muted-foreground" : ""}`}>{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
              {!s.done && (
                <Button size="sm" variant="outline" onClick={() => navigate(s.href)}>{s.cta}</Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Gerar dados de exemplo</h2>
          <Badge variant="secondary" className="ml-auto">opcional</Badge>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Escolha o perfil mais próximo do seu. Criamos um projeto exemplo com tarefas pré-prontas — pode arquivar a qualquer momento.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {PERSONAS.map(p => (
            <button
              key={p.id}
              onClick={() => setPersona(p.id)}
              className={`group rounded-lg border p-4 text-left transition-all hover:border-primary hover:shadow-elevated ${
                persona === p.id ? "border-primary ring-2 ring-primary/30" : ""
              }`}
            >
              <p.icon className="mb-2 h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              <p className="text-sm font-semibold">{p.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => persona && seed(persona)} disabled={!persona || seeding}>
            {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Criar dados de exemplo
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-5">
          <Compass className="mb-2 h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Tour interativo</h3>
          <p className="mt-1 text-xs text-muted-foreground">Conheça as 3 áreas-chave do produto em 30 segundos.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={tour.start}>
            <PlayCircle className="mr-2 h-3.5 w-3.5" /> Começar tour
          </Button>
        </Card>
        <Card className="p-5">
          <BookOpen className="mb-2 h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Atalhos de teclado</h3>
          <p className="mt-1 text-xs text-muted-foreground">Gmail-style: g+i Inbox, g+h Hoje, ? para ver tudo.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate("/app/atalhos")}>
            Ver atalhos
          </Button>
        </Card>
        <Card className="p-5">
          <Sparkles className="mb-2 h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Copilot IA</h3>
          <p className="mt-1 text-xs text-muted-foreground">Pergunte sobre tarefas, métricas, simulações.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate("/app/copilot")}>
            Abrir Copilot
          </Button>
        </Card>
      </div>

      <GuidedTour
        active={tour.active}
        step={tour.step}
        total={tour.total}
        current={tour.current}
        onNext={tour.next}
        onPrev={tour.prev}
        onSkip={tour.finish}
      />
    </div>
  );
}