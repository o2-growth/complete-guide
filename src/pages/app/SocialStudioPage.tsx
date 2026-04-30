import { useState } from "react";
import { Wand2, Sparkles, ImagePlus, Loader2, Save, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IgFeedPreview } from "@/components/previews/IgFeedPreview";
import { IgStoryPreview } from "@/components/previews/IgStoryPreview";
import { IgReelPreview } from "@/components/previews/IgReelPreview";
import { LinkedInPreview } from "@/components/previews/LinkedInPreview";
import { generateImageAI, generateBriefAI } from "@/hooks/useSocialIntel";
import { generateCaptionVariations } from "@/hooks/useSocialContent";
import { useUploadAsset } from "@/hooks/useSocialMedia";
import { toast } from "sonner";

export default function SocialStudioPage() {
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [aspect, setAspect] = useState<"square" | "portrait" | "landscape">("square");
  const [variations, setVariations] = useState<string[]>([]);
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingCopy, setLoadingCopy] = useState(false);
  const upload = useUploadAsset();

  const handleGenImage = async () => {
    if (!imagePrompt) return toast.error("Descreva a imagem");
    setLoadingImage(true);
    try {
      const url = await generateImageAI(imagePrompt, aspect);
      if (url) { setImageUrl(url); toast.success("Imagem gerada"); }
      else toast.error("IA não retornou imagem");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); }
    finally { setLoadingImage(false); }
  };

  const handleGenCopy = async () => {
    if (!caption) return toast.error("Escreva um briefing curto");
    setLoadingCopy(true);
    try {
      const v = await generateCaptionVariations(caption, "instagram", "profissional, próximo", 3);
      setVariations(v);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); }
    finally { setLoadingCopy(false); }
  };

  const handleSaveAsset = async () => {
    if (!imageUrl?.startsWith("data:")) return toast.error("Gere uma imagem primeiro");
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], `studio-${Date.now()}.png`, { type: blob.type || "image/png" });
      await upload.mutateAsync({ file });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); }
  };

  const previewContent = {
    kind: "ig_feed" as const,
    text: caption,
    accountName: "@suamarca",
    image: imageUrl ?? undefined,
  };

  return (
    <div className="space-y-4 p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Wand2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Studio criativo</h1>
          <p className="text-sm text-muted-foreground">Componha imagem + legenda e veja em todos os canais.</p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Editor */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><ImagePlus className="h-4 w-4 text-primary" /> Imagem</h3>
            <div className="space-y-2">
              <Textarea rows={2} placeholder="Descreva a imagem (ex: foto top-down de café latte com folhas, luz natural, fundo madeira)"
                value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} />
              <div className="flex gap-2">
                <Select value={aspect} onValueChange={(v) => setAspect(v as typeof aspect)}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">Quadrada 1:1</SelectItem>
                    <SelectItem value="portrait">Vertical 4:5</SelectItem>
                    <SelectItem value="landscape">Horizontal 16:9</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleGenImage} disabled={loadingImage} className="flex-1">
                  {loadingImage ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
                  Gerar imagem (IA)
                </Button>
              </div>
              {imageUrl && (
                <div className="space-y-2">
                  <img src={imageUrl} alt="" className="w-full rounded-md border" />
                  <Button variant="outline" size="sm" className="w-full" onClick={handleSaveAsset} disabled={upload.isPending}>
                    <Save className="mr-1.5 h-3.5 w-3.5" /> Salvar na biblioteca
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Legenda</h3>
            <Textarea rows={6} placeholder="Escreva a legenda ou um briefing para a IA gerar variações..."
              value={caption} onChange={(e) => setCaption(e.target.value)} />
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={handleGenCopy} disabled={loadingCopy || !caption}>
              {loadingCopy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
              Gerar 3 variações
            </Button>

            {variations.length > 0 && (
              <div className="mt-3 space-y-2">
                {variations.map((v, i) => (
                  <div key={i} className="rounded-md border p-2 text-xs">
                    <p className="line-clamp-3 whitespace-pre-wrap">{v}</p>
                    <div className="mt-1.5 flex gap-1.5">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setCaption(v)}>Usar</Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => { navigator.clipboard.writeText(v); toast.success("Copiado"); }}>
                        <Copy className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Previews multi-canal */}
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Preview multi-canal</h3>
          <Tabs defaultValue="ig_feed">
            <TabsList>
              <TabsTrigger value="ig_feed">IG Feed</TabsTrigger>
              <TabsTrigger value="ig_story">Story</TabsTrigger>
              <TabsTrigger value="ig_reel">Reel</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            </TabsList>
            <TabsContent value="ig_feed" className="flex justify-center pt-4">
              <IgFeedPreview content={previewContent} />
            </TabsContent>
            <TabsContent value="ig_story" className="flex justify-center pt-4">
              <IgStoryPreview content={{ ...previewContent, kind: "ig_story" }} />
            </TabsContent>
            <TabsContent value="ig_reel" className="flex justify-center pt-4">
              <IgReelPreview content={{ ...previewContent, kind: "ig_reel" }} />
            </TabsContent>
            <TabsContent value="linkedin" className="flex justify-center pt-4">
              <LinkedInPreview content={{ ...previewContent, kind: "linkedin" }} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}