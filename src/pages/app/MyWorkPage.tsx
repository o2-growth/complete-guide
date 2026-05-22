import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, UserCheck, Calendar, ChevronRight } from "lucide-react";
import { MyWorkPanel } from "@/components/tasks/MyWorkPanel";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SEO from "@/components/SEO";
import type { MyWorkTab } from "@/hooks/useMyWorkTasks";

interface MyWorkPageProps {
  title: string;
  description: string;
  defaultTab?: MyWorkTab;
  /** Quando true (Hoje e atrasadas), mostra coluna Agenda lateral. */
  withAgenda?: boolean;
  /** Breadcrumb opcional: array de [label, to]. */
  breadcrumb?: Array<{ label: string; to: string }>;
}

export default function MyWorkPage({
  title,
  description,
  defaultTab = "pending",
  withAgenda = false,
  breadcrumb,
}: MyWorkPageProps) {
  useEffect(() => {
    document.title = `${title} — Oxy Growth OS`;
  }, [title]);

  return (
    <div className="flex h-full flex-col">
      <SEO title={title} />
      <div className="border-b px-6 py-4">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav
            aria-label="Caminho"
            className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
          >
            {breadcrumb.map((b, idx) => (
              <span key={b.to} className="flex items-center gap-1">
                <Link
                  to={b.to}
                  className="rounded px-1 py-0.5 hover:bg-accent hover:text-foreground"
                >
                  {b.label}
                </Link>
                {idx < breadcrumb.length - 1 && <ChevronRight className="h-3 w-3 opacity-60" />}
              </span>
            ))}
            <ChevronRight className="h-3 w-3 opacity-60" />
            <span className="px-1 font-medium text-foreground">{title}</span>
          </nav>
        )}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <CreateTaskModal
            trigger={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Nova tarefa
              </Button>
            }
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {withAgenda ? (
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <MyWorkPanel defaultTab={defaultTab} />
            </div>
            <aside>
              <AgendaCard />
            </aside>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl">
            <MyWorkPanel defaultTab={defaultTab} />
          </div>
        )}
      </div>
    </div>
  );
}

function AgendaCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">Agenda</h2>
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Calendar className="h-10 w-10 text-muted-foreground/60" />
        <p className="text-xs text-muted-foreground">
          Conecte seu calendário para ver os próximos eventos e entrar na sua próxima chamada.
        </p>
        <div className="mt-2 w-full space-y-1.5">
          <Button asChild variant="outline" size="sm" className="w-full justify-between">
            <Link to="/app/configuracoes/integracoes">
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-[#4285F4]" />
                Google Agenda
              </span>
              <span className="text-xs text-primary">Conectar</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full justify-between">
            <Link to="/app/configuracoes/integracoes">
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-[#0078D4]" />
                Microsoft Outlook
              </span>
              <span className="text-xs text-primary">Conectar</span>
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
