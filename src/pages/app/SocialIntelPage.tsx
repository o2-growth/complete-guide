import { useState } from "react";
import { Brain, Sparkles, Target, Clock, Users, Plus, Trash2, ExternalLink, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useContentBriefs, useSaveBrief, useDeleteBrief, generateBriefAI,
  useBestTimeToPost,
  useCompetitors, useSaveCompetitor, useDeleteCompetitor,
  useCompetitorPosts, useSaveCompetitorPost,
} from "@/hooks/useSocialIntel";
import type { SocialChannel } from "@/hooks/useSocialMedia";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const DOW_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function SocialIntelPage() {
  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inteligência de conteúdo</h1>
          <p className="text-sm text-muted-foreground">Pautas IA, melhor horário e concorrentes em um só lugar.</p>
        </div>
      </header>

      <Tabs defaultValue="briefs">
        <TabsList>
          <TabsTrigger value="briefs"><Sparkles className="mr-1.5 h-4 w-4" /> Pautas IA</TabsTrigger>
          <TabsTrigger value="time"><Clock className="mr-1.5 h-4 w-4" /> Melhor horário</TabsTrigger>
          <TabsTrigger value="competitors"><Users className="mr-1.5 h-4 w-4" /> Concorrentes</TabsTrigger>
        </TabsList>

        <TabsContent value="briefs" className="space-y-4 pt-4"><BriefsTab /></TabsContent>
        <TabsContent value="time" className="space-y-4 pt-4"><BestTimeTab /></TabsContent>
        <TabsContent value="competitors" className="space-y-4 pt-4"><CompetitorsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ===== Briefings IA ===== */
function BriefsTab() {
  const { data: briefs = [] } = useContentBriefs();
  const save = useSaveBrief();
  const del = useDeleteBrief();

  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("profissional, próximo");
  const [channels, setChannels] = useState<SocialChannel[]>(["instagram"]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return toast.error("Informe o tema");
    setLoading(true);
    try {
      const brief = await generateBriefAI({ topic, channels, audience, tone });
      await save.mutateAsync({
        title: brief.title || topic,
        objective: brief.objective ?? null,
        audience: audience || null, tone,
        channels,
        angles: brief.angles ?? [],
        hooks: brief.hooks ?? [],
        generated_by_ai: true,
      });
      setTopic("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha");
    } finally { setLoading(false); }
  };

  return (
    <>
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Gerar pauta</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">Tema</Label>
            <Textarea rows={2} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: como uma loja de roupas pequena pode aumentar vendas no Instagram em dezembro" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Audiência</Label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Empreendedoras 25-40" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tom</Label>
            <Input value={tone} onChange={(e) => setTone(e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">Canais</Label>
            <div className="flex flex-wrap gap-1.5">
              {(["instagram", "linkedin", "tiktok", "youtube", "email"] as SocialChannel[]).map((c) => (
                <Badge key={c} variant={channels.includes(c) ? "default" : "outline"} className="cursor-pointer capitalize"
                  onClick={() => setChannels((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])}>
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={handleGenerate} disabled={loading || !topic}>
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
            Gerar com Gênio
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {briefs.map((b) => (
          <Card key={b.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="text-sm font-semibold">{b.title}</h4>
                {b.objective && <p className="mt-0.5 text-xs text-muted-foreground">{b.objective}</p>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => del.mutate(b.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(b.channels ?? []).map((c) => <Badge key={c} variant="outline" className="text-[10px] capitalize">{c}</Badge>)}
            </div>
            {b.angles?.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-medium uppercase text-muted-foreground">Ângulos</p>
                <ul className="mt-1 space-y-1 text-xs">
                  {b.angles.map((a, i) => (
                    <li key={i}><span className="font-medium">{a.name}</span> — <span className="text-muted-foreground">{a.summary}</span> {a.format && <Badge variant="secondary" className="ml-1 text-[9px]">{a.format}</Badge>}</li>
                  ))}
                </ul>
              </div>
            )}
            {b.hooks?.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-medium uppercase text-muted-foreground">Hooks</p>
                <div className="mt-1 space-y-1">
                  {b.hooks.map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <Target className="mt-0.5 h-3 w-3 text-primary" />
                      <span className="flex-1">{h}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { navigator.clipboard.writeText(h); toast.success("Copiado"); }}>
                        <Copy className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
        {briefs.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground md:col-span-2">
            Nenhuma pauta ainda. Gere a primeira acima.
          </Card>
        )}
      </div>
    </>
  );
}

/* ===== Best time ===== */
function BestTimeTab() {
  const { data: bestTimes = [], isLoading } = useBestTimeToPost();
  const top = bestTimes.slice(0, 10);
  const max = top[0]?.score ?? 1;
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold">Melhores horários (com base nas suas métricas)</h3>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
        top.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Ainda sem dados suficientes. Registre métricas dos posts publicados para que o sistema aprenda os melhores horários.
          </p>
        ) : (
          <div className="space-y-1.5">
            {top.map((b) => (
              <div key={`${b.dow}-${b.hour}`} className="flex items-center gap-3">
                <span className="w-12 text-xs font-medium">{DOW_LABEL[b.dow]}</span>
                <span className="w-14 text-xs">{String(b.hour).padStart(2, "0")}:00</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(b.score / max) * 100}%` }} />
                </div>
                <span className="w-20 text-right text-xs text-muted-foreground">{b.score} pts ({b.samples}x)</span>
              </div>
            ))}
          </div>
        )}
      <p className="mt-4 text-xs text-muted-foreground">
        💡 Pontuação = alcance médio + (likes + comentários) × 5, agrupado por dia da semana e hora de publicação.
      </p>
    </Card>
  );
}

/* ===== Competitors ===== */
function CompetitorsTab() {
  const { data: competitors = [] } = useCompetitors();
  const save = useSaveCompetitor();
  const del = useDeleteCompetitor();
  const savePost = useSaveCompetitorPost();

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [channel, setChannel] = useState<SocialChannel>("instagram");
  const [followers, setFollowers] = useState("");

  const [selected, setSelected] = useState<string | null>(null);
  const { data: posts = [] } = useCompetitorPosts(selected);

  const [postCaption, setPostCaption] = useState("");
  const [postLikes, setPostLikes] = useState("");
  const [postUrl, setPostUrl] = useState("");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Adicionar concorrente</h3>
        <div className="space-y-2">
          <Input placeholder="Nome (ex: Marca X)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="@handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
          <div className="flex gap-2">
            <Select value={channel} onValueChange={(v) => setChannel(v as SocialChannel)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["instagram", "linkedin", "tiktok", "youtube", "facebook"] as SocialChannel[]).map((c) =>
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Seguidores" value={followers} onChange={(e) => setFollowers(e.target.value)} />
          </div>
          <Button size="sm" className="w-full" onClick={async () => {
            if (!name) return toast.error("Nome obrigatório");
            await save.mutateAsync({ name, handle: handle || null, channel, followers: followers ? Number(followers) : null });
            setName(""); setHandle(""); setFollowers("");
          }}><Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar</Button>
        </div>

        <div className="mt-4 space-y-1.5">
          <h4 className="text-xs font-medium text-muted-foreground">Acompanhando ({competitors.length})</h4>
          {competitors.map((c) => (
            <div key={c.id}
              className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition ${selected === c.id ? "bg-primary/5 border-primary" : "hover:bg-muted/30"}`}
              onClick={() => setSelected(c.id)}>
              <div className="flex-1">
                <p className="text-xs font-medium">{c.name} <span className="text-muted-foreground">{c.handle}</span></p>
                <p className="text-[10px] text-muted-foreground capitalize">{c.channel} · {c.followers?.toLocaleString("pt-BR") ?? "—"} seguidores</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); del.mutate(c.id); }}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Posts do concorrente</h3>
        {!selected ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Selecione um concorrente à esquerda.</p>
        ) : (
          <>
            <div className="space-y-2 border-b pb-3">
              <Textarea rows={2} placeholder="Legenda do post" value={postCaption} onChange={(e) => setPostCaption(e.target.value)} />
              <div className="flex gap-2">
                <Input type="number" placeholder="Likes" value={postLikes} onChange={(e) => setPostLikes(e.target.value)} />
                <Input placeholder="URL" value={postUrl} onChange={(e) => setPostUrl(e.target.value)} />
              </div>
              <Button size="sm" className="w-full" onClick={async () => {
                if (!postCaption && !postUrl) return toast.error("Informe legenda ou URL");
                await savePost.mutateAsync({
                  competitor_id: selected,
                  caption: postCaption || null, url: postUrl || null,
                  likes: postLikes ? Number(postLikes) : null,
                });
                setPostCaption(""); setPostLikes(""); setPostUrl("");
              }}><Plus className="mr-1.5 h-3.5 w-3.5" /> Registrar post</Button>
            </div>
            <div className="mt-3 space-y-1.5">
              {posts.map((p) => (
                <div key={p.id} className="rounded-md border p-2 text-xs">
                  {p.caption && <p className="line-clamp-2">{p.caption}</p>}
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                    {p.posted_at && <span>{format(new Date(p.posted_at), "dd MMM", { locale: ptBR })}</span>}
                    {p.likes != null && <span>❤️ {p.likes.toLocaleString("pt-BR")}</span>}
                    {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="ml-auto text-primary"><ExternalLink className="h-3 w-3" /></a>}
                  </div>
                </div>
              ))}
              {posts.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Nenhum post registrado.</p>}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}