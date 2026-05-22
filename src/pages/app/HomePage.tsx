import { Link } from "react-router-dom";
import { useMyTasks } from "@/hooks/useTasks";
import { useSpaceTree } from "@/hooks/useSpaceTree";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { ListChecks, Inbox } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { data: tasks = [] } = useMyTasks();
  const { data: tree = [] } = useSpaceTree();

  const today = tasks.filter((t) => t.due_at && isToday(new Date(t.due_at)));
  const overdue = tasks.filter((t) => t.due_at && isPast(new Date(t.due_at)) && !isToday(new Date(t.due_at)));
  const someday = tasks.filter((t) => !t.due_at);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Olá, {user?.email?.split("@")[0]}</h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Para hoje" value={today.length} accent="text-primary" />
        <Stat label="Atrasadas" value={overdue.length} accent="text-destructive" />
        <Stat label="Sem data" value={someday.length} accent="text-muted-foreground" />
      </div>
      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Inbox className="h-4 w-4" /> Tarefas atrasadas e de hoje</h2>
        {today.length + overdue.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Você está em dia 🎉</p>
        ) : (
          <ul className="divide-y">
            {[...overdue, ...today].slice(0, 12).map((t) => (
              <li key={t.id} className="py-2 text-sm">
                <Link to={`/app/list/${t.list_id}`} className="hover:text-primary">{t.title}</Link>
                {t.due_at && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {format(new Date(t.due_at), "dd MMM", { locale: ptBR })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ListChecks className="h-4 w-4" /> Espaços</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {tree.map((s) => (
            <div key={s.id} className="rounded-md border p-3">
              <div className="font-semibold">{s.name}</div>
              <div className="mt-1 space-y-1 text-xs">
                {[...s.lists, ...s.folders.flatMap((f) => f.lists)].slice(0, 6).map((l) => (
                  <Link key={l.id} to={`/app/list/${l.id}`} className="block truncate text-muted-foreground hover:text-primary">· {l.name}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-4xl font-bold ${accent}`}>{value}</div>
    </Card>
  );
}