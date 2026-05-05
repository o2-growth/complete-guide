import { useState } from "react";
import { Hash, Loader2, Sparkles, FileText, Plus, Copy, FileStack } from "lucide-react";
import { TemplatePicker } from "@/components/modelos/TemplatePicker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCaptionSnippets, useHashtagGroups, useSaveSnippet, useSaveHashtagGroup, bumpSnippetUsage, generateCaptionVariations } from "@/hooks/useSocialContent";
import type { SocialChannel } from "@/hooks/useSocialMedia";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  taskId: string;
  channel: SocialChannel | null;
  caption: string;
  onCaptionChange: (next: string) => void;
}

export function TaskSocialContentPanel({ taskId, channel, caption, onCaptionChange }: Props) {
  const { data: snippets = [] } = useCaptionSnippets(channel);
  const { data: groups = [] } = useHashtagGroups(channel);
  const saveSnippet = useSaveSnippet();
  const saveGroup = useSaveHashtagGroup();
  const [variations, setVariations] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [tone, setTone] = useState("profissional");
  const [unifiedPickerOpen, setUnifiedPickerOpen] = useState(false);

  const persist = async (next: string) => {
    onCaptionChange(next);
    await supabase.from("tasks").update({ social_caption: next }).eq("id", taskId);
  };

  const insertSnippet = async (id: string, body: string) => {
    const next = caption ? `${caption}\n\n${body}` : body;
    await persist(next);
    await bumpSnippetUsage(id);
    toast.success("Legenda inserida");
  };

  const insertHashtags = async (tags: string[]) => {
    const formatted = tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
    const next = caption ? `${caption}\n\n${formatted}` : formatted;
    await persist(next);
    toast.success("Hashtags inseridas");
  };

  const generate = async () => {
    if (!caption.trim()) return toast.error("Escreva um briefing na legenda primeiro");
    setGenerating(true);
    try {
      const v = await generateCaptionVariations(caption, channel, tone, 3);
      setVariations(v);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar");
    } finally {
      setGenerating(false);
    }
  };

  const saveCurrentAsSnippet = async () => {
    const name = window.prompt("Nome desta legenda:");
    if (!name || !caption.trim()) return;
    await saveSnippet.mutateAsync({ name, body: caption, channel });
  };

  const insertUnifiedCaption = async (body: unknown) => {
    const text = (body as { text?: string })?.text ?? "";
    if (!text) {
      toast.error("Modelo de legenda vazio");
      return;
    }
    const next = caption ? `${caption}\n\n${text}` : text;
    await persist(next);
    toast.success("Legenda do catálogo inserida");
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-primary" />
          Conteúdo & IA
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setUnifiedPickerOpen(true)}>
          <FileStack className="mr-1 h-3 w-3" /> Inserir legenda
        </Button>
      </div>
      <TemplatePicker
        open={unifiedPickerOpen}
        onOpenChange={setUnifiedPickerOpen}
        kind="content_caption"
        title="Inserir legenda do catálogo"
        onSelect={(body) => insertUnifiedCaption(body)}
      />

      <Tabs defaultValue="snippets">
        <TabsList className="h-8">
          <TabsTrigger value="snippets" className="text-xs">Legendas</TabsTrigger>
          <TabsTrigger value="hashtags" className="text-xs">Hashtags</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs">IA</TabsTrigger>
        </TabsList>

        <TabsContent value="snippets" className="mt-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{snippets.length} salvas</span>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={saveCurrentAsSnippet}>
              <Plus className="mr-1 h-3 w-3" /> Salvar atual
            </Button>
          </div>
          <ScrollArea className="h-48">
            <div className="space-y-1.5 pr-2">
              {snippets.length === 0 && <p className="text-[11px] text-muted-foreground">Nenhuma legenda ainda.</p>}
              {snippets.map((s) => (
                <button
                  key={s.id}
                  onClick={() => insertSnippet(s.id, s.body)}
                  className="w-full rounded border bg-background p-2 text-left text-[11px] hover:border-primary"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{s.name}</span>
                    <Badge variant="outline" className="text-[9px]">{s.usage_count}x</Badge>
                  </div>
                  <p className="line-clamp-2 text-muted-foreground">{s.body}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="hashtags" className="mt-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{groups.length} grupos</span>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => {
              const name = window.prompt("Nome do grupo:");
              if (!name) return;
              const tags = window.prompt("Hashtags separadas por espaço ou vírgula:");
              if (!tags) return;
              const list = tags.split(/[\s,]+/).map((t) => t.replace(/^#+/, "")).filter(Boolean);
              await saveGroup.mutateAsync({ name, hashtags: list, channel });
            }}>
              <Plus className="mr-1 h-3 w-3" /> Novo grupo
            </Button>
          </div>
          <ScrollArea className="h-48">
            <div className="space-y-1.5 pr-2">
              {groups.length === 0 && <p className="text-[11px] text-muted-foreground">Nenhum grupo ainda.</p>}
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => insertHashtags(g.hashtags)}
                  className="w-full rounded border bg-background p-2 text-left text-[11px] hover:border-primary"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3" />
                    <span className="font-semibold">{g.name}</span>
                    <Badge variant="outline" className="text-[9px]">{g.hashtags.length}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-muted-foreground">{g.hashtags.slice(0, 6).map((t) => `#${t}`).join(" ")}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ai" className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="tom (profissional, descontraído...)" className="h-8 text-xs" />
            <Button size="sm" onClick={generate} disabled={generating} className="h-8">
              {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              <span className="ml-1.5">Gerar 3 variações</span>
            </Button>
          </div>
          <ScrollArea className="h-44">
            <div className="space-y-2 pr-2">
              {variations.length === 0 && <p className="text-[11px] text-muted-foreground">Use a legenda atual como briefing e clique em Gerar.</p>}
              {variations.map((v, i) => (
                <div key={i} className="rounded border bg-background p-2 text-[11px]">
                  <div className="mb-1 flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px]">Variação {i + 1}</Badge>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(v); toast.success("Copiada"); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => persist(v)}>Usar</Button>
                    </div>
                  </div>
                  <Textarea readOnly value={v} className="min-h-[60px] resize-none text-[11px]" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
