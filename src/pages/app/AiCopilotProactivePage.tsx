import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import ProactiveSuggestions from "@/components/ai/ProactiveSuggestions";
import DailyFocusCard from "@/components/ai/DailyFocusCard";
import { useTodaySummary, useGenerateDailySummary } from "@/hooks/useAiSuggestions";

export default function AiCopilotProactivePage() {
  const { data: summary } = useTodaySummary();
  const gen = useGenerateDailySummary();

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      <SEO title="IA Proativa — Oxy" description="Sugestões contextuais e briefing matinal gerado por IA." />
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Sparkles className="h-7 w-7 text-primary" /> IA Proativa</h1>
        <p className="mt-1 text-muted-foreground">Sugestões contextuais e seu briefing matinal — atualizados automaticamente.</p>
      </header>

      <DailyFocusCard />

      <Card className="border-primary/20 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Briefing matinal</h2>
          <Button size="sm" onClick={() => gen.mutate()} disabled={gen.isPending}>
            {gen.isPending ? "Gerando..." : summary ? "Regenerar" : "Gerar agora"}
          </Button>
        </div>
        {summary ? (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{summary.content}</p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Ainda sem briefing para hoje. Clique em "Gerar agora".</p>
        )}
      </Card>

      <ProactiveSuggestions />
    </div>
  );
}