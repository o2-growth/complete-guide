import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { ACTION_KINDS, type AutomationAction } from "@/hooks/useAutomations";
import { useTaskStatuses } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTenantMembers } from "@/hooks/useTenantMembers";

interface Props {
  value: AutomationAction[];
  onChange: (next: AutomationAction[]) => void;
}

const PRIORITIES = [
  { value: "urgent", label: "P0 — Urgente" },
  { value: "high", label: "P1 — Alta" },
  { value: "medium", label: "P2 — Média" },
  { value: "low", label: "P3 — Baixa" },
];

function ActionParams({
  action,
  onChange,
}: {
  action: AutomationAction;
  onChange: (next: AutomationAction) => void;
}) {
  const setParam = (k: string, v: unknown) =>
    onChange({ ...action, params: { ...action.params, [k]: v } });

  const { data: statuses = [] } = useTaskStatuses();
  const { data: projects = [] } = useProjects();
  const { data: members = [] } = useTenantMembers();

  switch (action.kind) {
    case "create_task":
      return (
        <div className="grid grid-cols-2 gap-2 pl-4">
          <Input
            className="col-span-2 h-8 text-xs"
            placeholder="Título da tarefa (suporta {{task.title}})"
            value={(action.params.title as string) ?? ""}
            onChange={(e) => setParam("title", e.target.value)}
          />
          <Textarea
            className="col-span-2 min-h-[60px] text-xs"
            placeholder="Descrição (opcional)"
            value={(action.params.description as string) ?? ""}
            onChange={(e) => setParam("description", e.target.value)}
          />
          <Select
            value={(action.params.project_id as string) ?? ""}
            onValueChange={(v) => setParam("project_id", v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={(action.params.priority as string) ?? "medium"}
            onValueChange={(v) => setParam("priority", v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={(action.params.assignee_id as string) ?? ""}
            onValueChange={(v) => setParam("assignee_id", v)}
          >
            <SelectTrigger className="h-8 text-xs col-span-2">
              <SelectValue placeholder="Responsável (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name ?? m.email ?? m.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "set_status":
      return (
        <div className="pl-4">
          <Select
            value={(action.params.status_id as string) ?? ""}
            onValueChange={(v) => setParam("status_id", v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Novo status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "assign_to":
      return (
        <div className="grid grid-cols-2 gap-2 pl-4">
          <Select
            value={(action.params.strategy as string) ?? "user"}
            onValueChange={(v) => setParam("strategy", v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Usuário específico</SelectItem>
              <SelectItem value="round_robin">Round-robin no squad</SelectItem>
              <SelectItem value="squad_lead">Líder do squad</SelectItem>
            </SelectContent>
          </Select>
          {((action.params.strategy as string) ?? "user") === "user" && (
            <Select
              value={(action.params.user_id as string) ?? ""}
              onValueChange={(v) => setParam("user_id", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Usuário" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name ?? m.email ?? m.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      );

    case "notify":
      return (
        <div className="grid gap-2 pl-4">
          <Input
            className="h-8 text-xs"
            placeholder="Título da notificação"
            value={(action.params.title as string) ?? ""}
            onChange={(e) => setParam("title", e.target.value)}
          />
          <Textarea
            className="min-h-[60px] text-xs"
            placeholder="Corpo (suporta {{task.title}}, {{task.priority}})"
            value={(action.params.body as string) ?? ""}
            onChange={(e) => setParam("body", e.target.value)}
          />
        </div>
      );

    case "chat_notify":
      return (
        <div className="grid grid-cols-2 gap-2 pl-4">
          <Select
            value={(action.params.provider as string) ?? "slack"}
            onValueChange={(v) => setParam("provider", v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slack">Slack</SelectItem>
              <SelectItem value="teams">Microsoft Teams</SelectItem>
              <SelectItem value="discord">Discord</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="h-8 text-xs"
            placeholder="#canal ou squad"
            value={(action.params.channel as string) ?? ""}
            onChange={(e) => setParam("channel", e.target.value)}
          />
          <Input
            className="col-span-2 h-8 text-xs"
            placeholder="Título da mensagem"
            value={(action.params.title as string) ?? ""}
            onChange={(e) => setParam("title", e.target.value)}
          />
        </div>
      );

    case "webhook":
      return (
        <div className="grid gap-2 pl-4">
          <Input
            className="h-8 text-xs"
            placeholder="URL https://..."
            value={(action.params.url as string) ?? ""}
            onChange={(e) => setParam("url", e.target.value)}
          />
          <Textarea
            className="min-h-[80px] text-xs font-mono"
            placeholder='Payload custom JSON (opcional, ex: {"x":1})'
            value={
              typeof action.params.payload === "string"
                ? (action.params.payload as string)
                : JSON.stringify(action.params.payload ?? {}, null, 2)
            }
            onChange={(e) => {
              try {
                setParam("payload", JSON.parse(e.target.value || "{}"));
              } catch {
                setParam("payload", e.target.value);
              }
            }}
          />
        </div>
      );

    case "add_tag":
    case "remove_tag":
      return (
        <div className="pl-4">
          <Input
            className="h-8 text-xs"
            placeholder="Nome ou ID da tag"
            value={(action.params.tag as string) ?? ""}
            onChange={(e) => setParam("tag", e.target.value)}
          />
        </div>
      );

    case "update_field":
      return (
        <div className="grid grid-cols-2 gap-2 pl-4">
          <Input
            className="h-8 text-xs"
            placeholder="Campo (ex: priority)"
            value={(action.params.field as string) ?? ""}
            onChange={(e) => setParam("field", e.target.value)}
          />
          <Input
            className="h-8 text-xs"
            placeholder="Novo valor"
            value={(action.params.value as string) ?? ""}
            onChange={(e) => setParam("value", e.target.value)}
          />
        </div>
      );

    default:
      return null;
  }
}

export function AutomationActionsBuilder({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Sem ações ainda — clique em "Adicionar ação" abaixo.
        </p>
      )}
      {value.map((action, i) => (
        <div
          key={i}
          className="rounded-md border border-border bg-card/40 p-3 space-y-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">
              #{i + 1}
            </span>
            <Select
              value={action.kind}
              onValueChange={(v) => {
                const next = [...value];
                next[i] = { kind: v, params: {} };
                onChange(next);
              }}
            >
              <SelectTrigger className="h-8 w-[260px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label="Remover ação"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ActionParams
            action={action}
            onChange={(next) => {
              const arr = [...value];
              arr[i] = next;
              onChange(arr);
            }}
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, { kind: "notify", params: {} }])}
      >
        <Plus className="mr-1 h-3 w-3" /> Adicionar ação
      </Button>
    </div>
  );
}
