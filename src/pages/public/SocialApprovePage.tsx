import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import logoOxy from "@/assets/logo-oxy.png";

interface ApprovalData {
  id: string;
  task_id: string;
  status: "pending" | "approved" | "rejected" | "expired";
  message: string | null;
  client_name: string | null;
  expires_at: string | null;
  decided_at: string | null;
  decision_comment: string | null;
  task_title: string;
  task_caption: string | null;
  task_channel: string | null;
  task_scheduled_at: string | null;
  task_publish_state: string | null;
  asset_paths: string[];
  asset_buckets: string[];
  asset_kinds: string[];
}

export default function SocialApprovePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ApprovalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const { data: rows, error } = await supabase.rpc("get_social_approval_by_token", { _token: token });
    setLoading(false);
    if (error || !rows || (Array.isArray(rows) && rows.length === 0)) {
      setNotFound(true);
      return;
    }
    const row = Array.isArray(rows) ? rows[0] : rows;
    setData(row as ApprovalData);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const decide = async (decision: "approved" | "rejected") => {
    if (!token || !name.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("decide_social_approval", {
      _token: token,
      _decision: decision,
      _name: name.trim(),
      _comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(decision === "approved" ? "Post aprovado!" : "Post rejeitado");
    await load();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-xl font-bold">Link inválido ou expirado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Solicite um novo link à equipe.</p>
        </Card>
      </div>
    );
  }

  const decided = data.status !== "pending";

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <img src={logoOxy} alt="Oxy" className="h-9 w-9" />
          <div>
            <h1 className="font-bold tracking-tight">Aprovação de mídia</h1>
            <p className="text-xs text-muted-foreground">Oxy Growth OS · O2 Inc.</p>
          </div>
        </div>

        <Card className="overflow-hidden p-5 shadow-elevated">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {data.task_channel && <Badge variant="secondary" className="capitalize">{data.task_channel}</Badge>}
            {data.task_publish_state && <Badge variant="outline" className="capitalize">{data.task_publish_state}</Badge>}
          </div>
          <h2 className="text-lg font-bold leading-tight">{data.task_title}</h2>
          {data.message && <p className="mt-2 rounded bg-muted/40 p-2 text-xs italic">"{data.message}"</p>}

          {data.asset_paths && data.asset_paths.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {data.asset_paths.map((path, i) => {
                const bucket = data.asset_buckets[i];
                const kind = data.asset_kinds[i];
                const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
                return kind === "video" ? (
                  <video key={i} src={url} controls className="aspect-square w-full rounded object-cover" />
                ) : kind === "image" ? (
                  <img key={i} src={url} alt={`asset ${i}`} className="aspect-square w-full rounded object-cover" />
                ) : (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="flex aspect-square items-center justify-center rounded bg-muted text-xs text-muted-foreground hover:bg-muted/80">
                    Abrir arquivo
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded border border-dashed p-4 text-xs text-muted-foreground">
              <ImageIcon className="h-4 w-4" /> Nenhum arquivo de mídia anexado.
            </div>
          )}

          {data.task_caption && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Legenda</p>
              <p className="whitespace-pre-wrap rounded bg-muted/40 p-3 text-sm">{data.task_caption}</p>
            </div>
          )}
        </Card>

        {decided ? (
          <Card className="p-5 text-center">
            {data.status === "approved" ? (
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            ) : (
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
            )}
            <p className="mt-2 font-semibold capitalize">{data.status === "approved" ? "Aprovado" : data.status === "rejected" ? "Rejeitado" : data.status}</p>
            {data.decision_comment && <p className="mt-1 text-sm text-muted-foreground">"{data.decision_comment}"</p>}
          </Card>
        ) : (
          <Card className="space-y-3 p-5">
            <div>
              <label className="text-xs font-semibold">Seu nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como devemos te identificar?" />
            </div>
            <div>
              <label className="text-xs font-semibold">Comentário (opcional)</label>
              <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ajustes, observações..." />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => decide("rejected")} disabled={submitting}>
                <XCircle className="mr-2 h-4 w-4" /> Rejeitar
              </Button>
              <Button className="flex-1" onClick={() => decide("approved")} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Aprovar
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}