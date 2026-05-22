import { useEffect, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Member { user_id: string; role: string; full_name: string | null; email: string | null; }

export default function SettingsPage() {
  const { tenantId, tenantName, role } = useWorkspace();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const { data } = await supabase
        .from("tenant_members")
        .select("user_id, role, profiles:user_id(full_name, email)")
        .eq("tenant_id", tenantId);
      setMembers(
        (data ?? []).map((m) => {
          const p = (m as unknown as { profiles: { full_name: string | null; email: string | null } | null }).profiles;
          return { user_id: m.user_id, role: m.role, full_name: p?.full_name ?? null, email: p?.email ?? null };
        }),
      );
      setLoading(false);
    })();
  }, [tenantId]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId || !inviteEmail) return;
    const { error } = await supabase.from("invitations").insert({ tenant_id: tenantId, email: inviteEmail, role: "specialist" });
    if (error) toast.error(error.message);
    else { toast.success("Convite criado."); setInviteEmail(""); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Workspace: {tenantName ?? "—"} · seu papel: {role ?? "—"}</p>
      </div>
      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Conta</h2>
        <p className="text-sm">{user?.email}</p>
      </Card>
      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Membros</h2>
        {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
          <ul className="divide-y">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between py-2 text-sm">
                <span>{m.full_name || m.email || m.user_id}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs uppercase">{m.role}</span>
              </li>
            ))}
          </ul>
        )}
        {(role === "admin" || role === "manager") && (
          <form onSubmit={invite} className="mt-4 flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs">Convidar por email</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="pessoa@empresa.com" />
            </div>
            <Button type="submit">Convidar</Button>
          </form>
        )}
      </Card>
    </div>
  );
}