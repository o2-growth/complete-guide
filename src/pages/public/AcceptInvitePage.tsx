import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAcceptInvitation } from "@/hooks/useWorkspaces";
import { toast } from "sonner";

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const accept = useAcceptInvitation();
  const [invite, setInvite] = useState<{ tenant_name: string; email: string; role: string; status: string; expires_at: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    supabase.rpc("get_invitation_by_token", { _token: token }).then(({ data, error }) => {
      if (error) { setErr(error.message); return; }
      const row = (data as Array<{ tenant_name: string; email: string; role: string; status: string; expires_at: string }>)?.[0];
      if (!row) setErr("Convite não encontrado"); else setInvite(row);
    });
  }, [token]);

  const onAccept = async () => {
    if (!token) return;
    if (!user) {
      navigate(`/auth?next=/aceitar-convite/${token}`);
      return;
    }
    try {
      await accept.mutateAsync(token);
      toast.success("Convite aceito! Redirecionando…");
      setTimeout(() => navigate("/app"), 800);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-accent/5">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Convite para workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {err ? (
            <div className="text-sm text-destructive flex items-center gap-2"><XCircle className="h-4 w-4" /> {err}</div>
          ) : !invite ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>
          ) : (
            <>
              <p className="text-sm">Você foi convidado para o workspace <strong>{invite.tenant_name}</strong> como <strong>{invite.role}</strong>.</p>
              <p className="text-xs text-muted-foreground">Convite enviado para {invite.email} · expira em {new Date(invite.expires_at).toLocaleDateString("pt-BR")}.</p>
              {invite.status !== "pending" ? (
                <p className="text-sm text-muted-foreground">Status: {invite.status}</p>
              ) : (
                <Button className="w-full" onClick={onAccept} disabled={loading || accept.isPending}>
                  {accept.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {user ? "Aceitar convite" : "Entrar e aceitar"}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
