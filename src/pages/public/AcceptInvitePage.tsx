import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Invite { id: string; email: string; role: string; status: string; expires_at: string; tenant_id: string; tenant_name: string | null; }

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [inv, setInv] = useState<Invite | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("id,email,role,status,expires_at,tenant_id, tenants(name)")
        .eq("token", token)
        .maybeSingle();
      if (error || !data) { setErr("Convite não encontrado."); return; }
      const tenants = (data as unknown as { tenants: { name: string } | null }).tenants;
      setInv({
        id: data.id, email: data.email, role: data.role, status: data.status,
        expires_at: data.expires_at, tenant_id: data.tenant_id, tenant_name: tenants?.name ?? null,
      });
    })();
  }, [token]);

  async function accept() {
    if (!token) return;
    setWorking(true);
    type Res = { data: { ok: boolean; error?: string } | null; error: { message: string } | null };
    const rpc = supabase.rpc as unknown as (n: string, a: Record<string, unknown>) => Promise<Res>;
    const { data, error } = await rpc("accept_invitation", { _token: token });
    setWorking(false);
    if (error || !data?.ok) {
      toast.error("Não foi possível aceitar: " + (data?.error ?? error?.message ?? "erro"));
      return;
    }
    toast.success("Convite aceito!");
    navigate("/app", { replace: true });
  }

  if (err) return <Center><Msg icon={<XCircle className="h-8 w-8 text-destructive" />} title="Convite inválido" body={err} /></Center>;
  if (!inv) return <Center><Loader2 className="h-6 w-6 animate-spin text-primary" /></Center>;

  return (
    <Center>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Convite para {inv.tenant_name ?? "workspace"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">Endereço: <b>{inv.email}</b> · Papel: <b>{inv.role}</b></p>
          {authLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : user ? (
            user.email?.toLowerCase() === inv.email.toLowerCase() ? (
              <Button className="w-full" onClick={accept} disabled={working}>
                {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Aceitar convite
              </Button>
            ) : (
              <p className="rounded bg-destructive/10 p-3 text-sm text-destructive">
                Você está logado como <b>{user.email}</b>. Saia e entre com <b>{inv.email}</b>.
              </p>
            )
          ) : (
            <Button className="w-full" onClick={() => navigate(`/auth?next=/invite/${token}`)}>Entrar para aceitar</Button>
          )}
        </CardContent>
      </Card>
    </Center>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-muted p-4">{children}</div>;
}
function Msg({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}