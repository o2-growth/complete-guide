import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TaskList } from "@/components/tasks/TaskList";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { Badge } from "@/components/ui/badge";
import DailyFocusCard from "@/components/ai/DailyFocusCard";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";

const AppHome = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const { allDone: onboardingDone } = useOnboardingChecklist();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name ?? ""));
  }, [user]);

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
            <Inbox className="mr-1.5 h-3 w-3" /> Inbox pessoal
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {displayName ? `Olá, ${displayName}` : "Sua Inbox"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture tudo aqui — datas, prioridades e tags são detectadas automaticamente.
          </p>
        </div>

        <QuickAdd />

        {onboardingDone && <DailyFocusCard />}

        <TaskList
          list="inbox"
          emptyTitle="Inbox vazia 🎯"
          emptyDescription="Use o campo acima para criar sua primeira tarefa."
        />
      </div>
    </div>
  );
};

export default AppHome;