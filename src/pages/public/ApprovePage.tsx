import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoOxy from "@/assets/logo-oxy.png";

interface Submission {
  id: string;
  tenant_id: string;
  form_id: string;
  status: string;
  payload: Record<string, unknown>;
  requester_name: string | null;
  requester_email: string | null;
  created_at: string;
  task_id: string | null;
  form_title: string;
  form_description: string | null;
}

export default function ApprovePage() {
  const { token } = useParams<{ token: string }>();
  const [sub, setSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    document.title = "Aprovar solicitação — Oxy Growth OS";
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_demand_submission_by_token", {
        _token: token,
      });
      if (error) toast.error("Erro: " + error.message);
      const row = Array.isArray(data) ? data[0] : data;
      setSub((row as unknown as Submission) ?? null);
      setLoading(false);
    })();
  }, [token]);

  const decide = async (decision: "approve" | "reject") => {
    if (!token) return;
    setBusy(decision);
    const { data, error } = await supabase.functions.invoke("process-demand", {
      body: { action: "decide", token, decision, note: note || undefined },
    });
    setBusy(null);
    if (error || (data as { error?: unknown })?.error) {
      toast.error("Erro: " + (error?.message ?? "tente novamente"));
      return;
    }
    setResult(decision === "approve" ? "approved" : "rejected");
  };

  if (loading) {
    return (
      <Shell>
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </Shell>
    );
  }

  if (!sub) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Solicitação não encontrada</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O link de aprovação é inválido ou expirou.
        </p>
      </Shell>
    );
  }

  const decided = result || (sub.status !== "pending" ? sub.status : null);

  return (
    <Shell>
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Aprovação de demanda
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{sub.form_title}</h1>
          {sub.form_description && (
            <p className="mt-1 text-sm text-muted-foreground">{sub.form_description}</p>
          )}
        </div>
        <StatusBadge status={decided ?? "pending"} />
      </header>

      {(sub.requester_name || sub.requester_email) && (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Solicitante
          </p>
          <p className="mt-1 font-medium">{sub.requester_name || "—"}</p>
          {sub.requester_email && (
            <p className="text-xs text-muted-foreground">{sub.requester_email}</p>
          )}
        </div>
      )}

      <section className="mt-4 space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Conteúdo da solicitação
        </p>
        <dl className="divide-y rounded-lg border bg-card text-sm">
          {Object.entries(sub.payload).map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-3 px-3 py-2">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                {k}
              </dt>
              <dd className="col-span-2 whitespace-pre-wrap break-words">
                {typeof v === "object" ? JSON.stringify(v) : String(v)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {!decided ? (
        <section className="mt-5 space-y-3 border-t pt-5">
          <Textarea
            placeholder="Comentário para o time (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => decide("approve")}
              disabled={!!busy}
            >
              {busy === "approve" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ThumbsUp className="mr-2 h-4 w-4" />
              )}
              Aprovar e criar tarefa
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => decide("reject")}
              disabled={!!busy}
            >
              {busy === "reject" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ThumbsDown className="mr-2 h-4 w-4" />
              )}
              Rejeitar
            </Button>
          </div>
        </section>
      ) : (
        <div className="mt-5 flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
          {decided === "approved" ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          <span>
            Esta solicitação já foi <strong>{decided === "approved" ? "aprovada" : "rejeitada"}</strong>.
          </span>
        </div>
      )}
    </Shell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendente", cls: "bg-[hsl(var(--prio-medium)/0.2)] text-[hsl(var(--prio-medium))]" },
    approved: { label: "Aprovada", cls: "bg-primary/10 text-primary" },
    rejected: { label: "Rejeitada", cls: "bg-destructive/10 text-destructive" },
  };
  const m = map[status] ?? map.pending;
  return <Badge className={`${m.cls} border-0`}>{m.label}</Badge>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center gap-2">
          <img src={logoOxy} alt="Oxy" className="h-8 w-8" />
          <span className="text-sm font-bold tracking-tight">Oxy Growth OS</span>
        </header>
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}