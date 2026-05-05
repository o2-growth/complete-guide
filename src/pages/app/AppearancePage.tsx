import { useRef, useState } from "react";
import { Palette, Upload, RotateCcw, Eye, Type, Contrast, Image as ImageIcon, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBranding, BrandingSettings } from "@/hooks/useBranding";
import { usePreferences } from "@/hooks/usePreferences";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";

const PRESET_PRIMARY: Array<{ label: string; hex: string }> = [
  { label: "Oxy Sky", hex: "#0EA5E9" },
  { label: "Indigo", hex: "#6366F1" },
  { label: "Violet", hex: "#8B5CF6" },
  { label: "Rose", hex: "#F43F5E" },
  { label: "Emerald", hex: "#10B981" },
  { label: "Amber", hex: "#F59E0B" },
  { label: "Slate", hex: "#475569" },
  { label: "Crimson", hex: "#DC2626" },
];

const PRESET_ACCENT: Array<{ label: string; hex: string }> = [
  { label: "Gold", hex: "#FCD34D" },
  { label: "Mint", hex: "#34D399" },
  { label: "Coral", hex: "#FB7185" },
  { label: "Sky", hex: "#7DD3FC" },
];

const FONT_SIZES: Array<{ value: BrandingSettings["fontSize"]; label: string; sample: string }> = [
  { value: "small", label: "Pequeno", sample: "14px" },
  { value: "normal", label: "Normal", sample: "16px" },
  { value: "large", label: "Grande", sample: "18px" },
];

export default function AppearancePage() {
  const branding = useBranding();
  const prefs = usePreferences();
  const { tenantId } = useWorkspace();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(branding.workspaceName);

  const handleLogoUpload = async (file: File) => {
    if (!tenantId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `branding/${tenantId}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("media-assets")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("media-assets").getPublicUrl(path);
      await branding.update({ logoUrl: data.publicUrl });
      toast.success("Logo atualizado");
    } catch {
      toast.error("Falha no upload do logo");
    } finally {
      setUploading(false);
    }
  };

  const saveName = async () => {
    await branding.update({ workspaceName: name });
    toast.success("Nome do workspace atualizado");
  };

  const handleReset = async () => {
    await branding.reset();
    toast.success("Aparência restaurada ao padrão");
  };

  return (
    <div className="container max-w-4xl py-8">
      <SEO title="Aparência · Oxy Growth OS" description="Personalize cores, logo, tipografia e tema do workspace." />

      <div className="mb-8">
        <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
          <Palette className="mr-1.5 h-3 w-3" /> Aparência
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Personalizar workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cores, logo e acessibilidade visual aplicados a todos do time.
        </p>
      </div>

      {/* Preview ao vivo */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-brand p-6 text-primary-foreground">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg bg-background/10 object-contain p-1" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/10">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="text-xs opacity-80">Preview</p>
              <p className="text-lg font-bold tracking-tight">{branding.workspaceName}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="secondary">Ação</Button>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">Destaque</Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {/* Nome do workspace */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nome do workspace</CardTitle>
            <CardDescription>Aparece na sidebar e em PDFs gerados.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              aria-label="Nome do workspace"
            />
            <Button onClick={saveName} disabled={name === branding.workspaceName || !name.trim()}>
              Salvar
            </Button>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4 text-primary" /> Logo do workspace
            </CardTitle>
            <CardDescription>PNG ou SVG quadrado, fundo transparente recomendado.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border bg-muted/30 overflow-hidden">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo atual" className="h-full w-full object-contain p-2" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleLogoUpload(f);
                }}
              />
              <Button onClick={() => fileRef.current?.click()} disabled={uploading} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Enviando…" : "Escolher arquivo"}
              </Button>
              {branding.logoUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => branding.update({ logoUrl: null })}
                  className="ml-2 text-muted-foreground"
                >
                  Remover
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cor primária */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-primary" /> Cor primária
            </CardTitle>
            <CardDescription>Aplica em botões, links e destaques de toda a interface.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {PRESET_PRIMARY.map((p) => (
                <button
                  key={p.hex}
                  onClick={() => branding.update({ primaryColor: p.hex })}
                  className={cn(
                    "group relative aspect-square rounded-lg border-2 transition-all hover:scale-105",
                    branding.primaryColor.toLowerCase() === p.hex.toLowerCase()
                      ? "border-foreground ring-2 ring-foreground/20"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: p.hex }}
                  aria-label={p.label}
                  title={p.label}
                >
                  {branding.primaryColor.toLowerCase() === p.hex.toLowerCase() && (
                    <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Label htmlFor="primary-hex" className="text-xs">Hex custom</Label>
              <Input
                id="primary-hex"
                type="color"
                value={branding.primaryColor}
                onChange={(e) => branding.update({ primaryColor: e.target.value })}
                className="h-9 w-16 cursor-pointer p-1"
              />
              <Input
                value={branding.primaryColor}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(v)) branding.update({ primaryColor: v });
                }}
                className="w-32 font-mono text-sm uppercase"
                maxLength={7}
                aria-label="Cor primária em hexadecimal"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cor de destaque */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cor de destaque</CardTitle>
            <CardDescription>Usada em badges e elementos secundários.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_ACCENT.map((p) => (
                <button
                  key={p.hex}
                  onClick={() => branding.update({ accentColor: p.hex })}
                  className={cn(
                    "relative aspect-square rounded-lg border-2 transition-all hover:scale-105",
                    branding.accentColor.toLowerCase() === p.hex.toLowerCase()
                      ? "border-foreground ring-2 ring-foreground/20"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: p.hex }}
                  aria-label={p.label}
                >
                  {branding.accentColor.toLowerCase() === p.hex.toLowerCase() && (
                    <Check className="absolute inset-0 m-auto h-5 w-5 text-foreground/80" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tipografia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Type className="h-4 w-4 text-primary" /> Tamanho do texto
            </CardTitle>
            <CardDescription>Ajuste global aplicado a toda a interface.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => branding.update({ fontSize: f.value })}
                  className={cn(
                    "rounded-lg border-2 p-4 text-center transition-all hover:bg-muted/30",
                    branding.fontSize === f.value ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  <p className="font-semibold">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.sample}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formato de data de vencimento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datas de vencimento</CardTitle>
            <CardDescription>
              Mostra prazos como data absoluta ("23 de mai") ou contagem regressiva ("em 3 dias").
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mostrar como contagem regressiva</p>
                <p className="text-xs text-muted-foreground">
                  Atualiza automaticamente a cada minuto.
                </p>
              </div>
              <Switch
                checked={prefs.due_at_format === "countdown"}
                onCheckedChange={(v) =>
                  prefs.update({ due_at_format: v ? "countdown" : "absolute" })
                }
                aria-label="Mostrar prazos como contagem regressiva"
              />
            </div>
          </CardContent>
        </Card>

        {/* Acessibilidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Contrast className="h-4 w-4 text-primary" /> Acessibilidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Alto contraste</p>
                <p className="text-xs text-muted-foreground">Realça bordas e separações para melhor leitura.</p>
              </div>
              <Switch
                checked={branding.highContrast}
                onCheckedChange={(v) => branding.update({ highContrast: v })}
                aria-label="Alto contraste"
              />
            </div>
          </CardContent>
        </Card>

        {/* Reset */}
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium">Restaurar padrão</p>
              <p className="text-xs text-muted-foreground">Volta à identidade Oxy original.</p>
            </div>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Restaurar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}