import { Sparkles } from "lucide-react";
import { AIChat } from "@/components/ai/AIChat";

export default function GeniusPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Gênio Growth</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Assistente de IA para copy, ideias, planejamento e produtividade. Use linguagem natural.
        </p>
      </div>
      <div className="flex-1 overflow-hidden px-6">
        <AIChat />
      </div>
    </div>
  );
}