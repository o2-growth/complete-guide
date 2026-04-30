import { useMemo, useState } from "react";
import {
  History,
  Plus,
  Pencil,
  ArrowRightLeft,
  UserPlus,
  MessageSquare,
  Trash2,
  Paperclip,
  Timer,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuditLog, useAuditActors, type ActivityKind } from "@/hooks/useAuditLog";
import { useProjects } from "@/hooks/useProjects";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const KIND_META: Record<ActivityKind, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  created: { label: "Criou", icon: Plus, color: "text-emerald-500" },
  updated: { label: "Editou", icon: Pencil, color: "text-blue-500" },
  status_changed: { label: "Mudou status", icon: ArrowRightLeft, color: "text-violet-500" },
  assigned: { label: "Atribuiu", icon: UserPlus, color: "text-amber-500" },
  commented: { label: "Comentou", icon: MessageSquare, color: "text-sky-500" },
  deleted: { label: "Removeu", icon: Trash2, color: "text-destructive" },
  attached: { label: "Anexou", icon: Paperclip, color: "text-slate-500" },
  time_logged: { label: "Registrou tempo", icon: Timer, color: "text-orange-500" },
};

function actorName(a: { display_name?: string | null; full_name?: string | null } | null | undefined) {
  if (!a) return "Sistema";
  return a.display_name || a.full_name || "Usuário";
}

function payloadSummary(kind: ActivityKind, payload: Record<string, unknown>): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as any;
  if (kind === "status_changed") {
    const from = p.from_status_name || p.from || null;
    const to = p.to_status_name || p.to || null;
    if (from && to) return `${from} → ${to}`;
    if (to) return `→ ${to}`;
  }
  if (kind === "assigned") {
    return p.assignee_name || p.to_name || null;
  }
  if (kind === "updated") {
    const fields = p.fields || p.changed;
    if (Array.isArray(fields) && fields.length) return fields.join(", ");
  }
  if (kind === "commented" && typeof p.preview === "string") {
    return p.preview.slice(0, 80);
  }
  if (kind === "time_logged" && p.minutes) {
    return `${p.minutes} min`;
  }
  return null;
}

export default function AuditLogPage() {
  const [kind, setKind] = useState<ActivityKind | "all">("all");
  const [actorId, setActorId] = useState<string>("all");
  const [projectId, setProjectId] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: entries, isLoading } = useAuditLog({ kind, actorId, projectId, search });
  const { data: actors } = useAuditActors();
  const { data: projects } = useProjects();

  const grouped = useMemo(() => {
    if (!entries) return [];
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      const day = format(new Date(e.created_at), "yyyy-MM-dd");
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [entries]);

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <header className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <History className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
          <p className="text-sm text-muted-foreground">
            Histórico navegável de toda atividade no workspace.
          </p>
        </div>
      </header>

      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tarefa, projeto ou pessoa…"
            className="pl-8 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={kind} onValueChange={(v) => setKind(v as any)}>
          <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {(Object.keys(KIND_META) as ActivityKind[]).map((k) => (
              <SelectItem key={k} value={k}>{KIND_META[k].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actorId} onValueChange={setActorId}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Pessoa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as pessoas</SelectItem>
            {(actors ?? []).map((a: any) => (
              <SelectItem key={a.id} value={a.id}>{actorName(a)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Projeto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            {(projects ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : !grouped.length ? (
        <Card className="p-10 text-center">
          <History className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma atividade encontrada com os filtros atuais.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, items]) => (
            <section key={day} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 bg-background/80 backdrop-blur py-1">
                {format(new Date(day + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h2>
              <Card className="divide-y">
                {items.map((e) => {
                  const meta = KIND_META[e.kind];
                  const Icon = meta.icon;
                  const summary = payloadSummary(e.kind, e.payload);
                  return (
                    <div key={e.id} className="flex items-start gap-3 p-3 hover:bg-muted/40 transition-colors">
                      <div className={`rounded-lg bg-muted/60 p-2 ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={e.actor?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                              {actorName(e.actor).slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{actorName(e.actor)}</span>
                          <span className="text-sm text-muted-foreground">{meta.label.toLowerCase()}</span>
                          {e.task && (
                            <span className="text-sm font-medium truncate">
                              {e.task.code && (
                                <span className="text-muted-foreground mr-1">{e.task.code}</span>
                              )}
                              {e.task.title}
                            </span>
                          )}
                          {!e.task && e.project && (
                            <span className="text-sm font-medium">{e.project.name}</span>
                          )}
                        </div>
                        {(summary || e.project) && (
                          <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                            {summary && <span>{summary}</span>}
                            {e.project && e.task && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4">
                                {e.project.key || e.project.name}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <time
                        className="text-xs text-muted-foreground shrink-0 tabular-nums"
                        title={format(new Date(e.created_at), "dd/MM/yyyy HH:mm:ss")}
                      >
                        {formatDistanceToNow(new Date(e.created_at), { locale: ptBR, addSuffix: true })}
                      </time>
                    </div>
                  );
                })}
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
