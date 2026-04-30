import { useRef, useState } from "react";
import { Library, Upload, Search, Trash2, Loader2, FileText, Music, Video, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useCampaigns, useDeleteAsset, useMediaAssets, useUploadAsset, getAssetPublicUrl,
  type MediaAsset, type MediaKind,
} from "@/hooks/useSocialMedia";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<MediaKind, typeof ImageIcon> = {
  image: ImageIcon, video: Video, audio: Music, document: FileText, other: FileText,
};

export default function MediaLibraryPage() {
  const [search, setSearch] = useState("");
  const [campaignId, setCampaignId] = useState<string>("all");
  const { data: campaigns = [] } = useCampaigns();
  const { data: assets = [], isLoading } = useMediaAssets({
    search: search || undefined,
    campaignId: campaignId === "all" ? null : campaignId,
  });
  const upload = useUploadAsset();
  const del = useDeleteAsset();
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      try {
        await upload.mutateAsync({ file: f, campaignId: campaignId === "all" ? null : campaignId });
      } catch {/* toast no hook */}
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
          <Library className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Biblioteca de mídia</h1>
          <p className="text-sm text-muted-foreground">Imagens, vídeos e documentos prontos para reutilizar em qualquer post.</p>
        </div>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => onPick(e.target.files)} />
        <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Enviar arquivos
        </Button>
      </header>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome..." className="h-8 pl-8" />
          </div>
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger className="h-8 w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas campanhas</SelectItem>
              {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{assets.length} arquivos</span>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : assets.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-20 text-sm text-muted-foreground">
          <Library className="h-8 w-8" />
          Nenhum asset ainda — clique em "Enviar arquivos".
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {assets.map((a) => <AssetCard key={a.id} asset={a} onDelete={() => del.mutate(a)} />)}
        </div>
      )}
    </div>
  );
}

function AssetCard({ asset, onDelete }: { asset: MediaAsset; onDelete: () => void }) {
  const url = getAssetPublicUrl(asset.bucket, asset.path);
  const Icon = KIND_ICON[asset.kind] ?? FileText;
  return (
    <Card className="group relative overflow-hidden">
      <div className="aspect-square w-full bg-muted/40">
        {asset.kind === "image" ? (
          <img src={url} alt={asset.name} className="h-full w-full object-cover" loading="lazy" />
        ) : asset.kind === "video" ? (
          <video src={url} className="h-full w-full object-cover" muted />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Icon className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="space-y-1 p-2">
        <p className="truncate text-xs font-medium" title={asset.name}>{asset.name}</p>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <Badge variant="secondary" className="px-1 py-0 text-[9px] capitalize">{asset.kind}</Badge>
          <a href={url} target="_blank" rel="noreferrer" className="hover:underline">abrir</a>
        </div>
      </div>
      <Button
        variant="destructive" size="icon"
        className={cn("absolute right-1 top-1 h-6 w-6 opacity-0 transition group-hover:opacity-100")}
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </Card>
  );
}