import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logoOxy from "@/assets/logo-oxy.png";

const AppHome = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ display_name: string | null; role_title: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, role_title")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src={logoOxy} alt="Oxy Growth OS" className="h-9 w-9" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">Oxy Growth OS</span>
              <span className="text-[11px] text-muted-foreground">por O2 Inc.</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container py-12">
        <div className="mx-auto max-w-3xl">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">
            <Sparkles className="mr-1.5 h-3 w-3" /> Passo 3 concluído
          </Badge>
          <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
            Olá, {profile?.display_name ?? "operador"} 👋
          </h1>
          <p className="mb-8 text-muted-foreground">
            {profile?.role_title ? `${profile.role_title} · ` : ""}Você está autenticado no Oxy Growth OS.
          </p>

          <Card className="p-6 md:p-8">
            <h2 className="mb-2 text-lg font-semibold">Próximas etapas</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Passo 4 — Layout shell (Sidebar + Topbar + Command Palette)</li>
              <li>• Passo 5 — Inbox + Smart Lists + Quick Add NLP</li>
              <li>• Passo 6 — Detalhe de tarefa (TipTap, anexos, comentários)</li>
              <li>• Passo 7 — Kanban com drag-drop e auto-assign</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AppHome;