import { useMemo, useState } from "react";
import { CalendarRange, Lightbulb, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCadence, useToggleCadenceSlot } from "@/hooks/useSocialOps";
import { useBestTimeToPost } from "@/hooks/useSocialIntel";
import type { SocialChannel } from "@/hooks/useSocialMedia";
import { cn } from "@/lib/utils";

const DOWS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CHANNELS: SocialChannel[] = ["instagram", "linkedin", "tiktok", "facebook", "youtube", "twitter"];

export default function SocialCadencePage() {
  const [channel, setChannel] = useState<SocialChannel>("instagram");
  const { data: slots = [] } = useCadence();
  const toggle = useToggleCadenceSlot();
  const { data: best = [] } = useBestTimeToPost();

  const map = useMemo(() => {
    const m = new Map<string, typeof slots[number]>();
    for (const s of slots) if (s.channel === channel) m.set(`${s.dow}-${s.hour}`, s);
    return m;
  }, [slots, channel]);

  const bestMap = useMemo(() => {
    const m = new Map<string, number>();
    const max = Math.max(1, ...best.map((b) => b.score));
    for (const b of best) m.set(`${b.dow}-${b.hour}`, b.score / max);
    return m;
  }, [best]);

  const totalSlots = slots.filter((s) => s.channel === channel).length;
  const targetWeek = slots.filter((s) => s.channel === channel).reduce((a, s) => a + (s.target_posts || 1), 0);

  return (
    <div className="space-y-4 p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarRange className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Cadência de publicação</h1>
          <p className="text-sm text-muted-foreground">
            Defina quando cada canal deve publicar. Sobreposto: melhor horário baseado nas métricas (verde mais escuro = melhor).
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{totalSlots} slots</Badge>
          <Badge variant="outline">{targetWeek} posts/sem</Badge>
        </div>
      </header>

      <Tabs value={channel} onValueChange={(v) => setChannel(v as SocialChannel)}>
        <TabsList className="overflow-x-auto">
          {CHANNELS.map((c) => (
            <TabsTrigger key={c} value={c} className="capitalize">{c}</TabsTrigger>
          ))}
        </TabsList>

        {CHANNELS.map((c) => (
          <TabsContent key={c} value={c}>
            <Card className="overflow-x-auto p-3">
              <table className="w-full text-[10px]">
                <thead>
                  <tr>
                    <th className="w-10"></th>
                    {HOURS.map((h) => (
                      <th key={h} className="px-0.5 text-muted-foreground font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DOWS.map((dow, dowIdx) => (
                    <tr key={dow}>
                      <td className="pr-2 text-muted-foreground font-medium">{dow}</td>
                      {HOURS.map((h) => {
                        const k = `${dowIdx}-${h}`;
                        const slot = map.get(k);
                        const heat = bestMap.get(k) ?? 0;
                        return (
                          <td key={h} className="p-0">
                            <button
                              onClick={() => toggle.mutate({ channel: c, dow: dowIdx, hour: h, existing: slot })}
                              title={`${dow} ${h}h${heat > 0 ? ` · score ${(heat * 100).toFixed(0)}` : ""}`}
                              style={!slot && heat > 0 ? { background: `rgba(16,185,129,${0.15 + heat * 0.5})` } : undefined}
                              className={cn(
                                "h-6 w-full border border-border/40 transition hover:scale-110 hover:z-10 relative",
                                slot && "bg-primary text-primary-foreground font-bold",
                              )}
                            >
                              {slot ? "●" : ""}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="p-4">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Como funciona</p>
            <p>Clique numa célula para adicionar/remover um slot de cadência. As células com tom verde indicam horários historicamente bons (baseado em métricas dos seus posts publicados — quanto mais escuro, maior o engajamento médio). Use isso como guia para preencher slots que coincidam com sua audiência.</p>
          </div>
        </div>
        {best.length === 0 && (
          <div className="mt-2 flex items-start gap-2 rounded border border-dashed p-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
            <span>Sem dados de "melhor horário" ainda. Publique alguns posts e use o botão "Coletar métricas" no relatório de campanha para popular a heatmap.</span>
          </div>
        )}
      </Card>
    </div>
  );
}