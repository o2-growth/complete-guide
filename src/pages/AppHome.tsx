import { useEffect, useState } from "react";
import { Inbox, Sparkles, Command as CommandIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AppHome = () => {
  const { user } = useAuth();
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

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">
          <Sparkles className="mr-1.5 h-3 w-3" /> Layout shell ativo
        </Badge>
        <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
          Olá, {profile?.display_name ?? "operador"} 👋
        </h1>
        <p className="mb-8 text-muted-foreground">
          {profile?.role_title ? `${profile.role_title} · ` : ""}
          Use{" "}
          <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
            <CommandIcon className="h-3 w-3" />K
          </kbd>{" "}
          para abrir o command palette.
        </p>

        <Card className="p-8 md:p-10 text-center border-dashed">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Inbox className="h-7 w-7" />
          </div>
          <h2 className="mb-1 text-xl font-semibold">Sua Inbox</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Aqui vão aparecer todas as tarefas atribuídas a você. Vamos popular no Passo 5 com Smart
            Lists e o Quick Add NLP em pt-BR.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default AppHome;