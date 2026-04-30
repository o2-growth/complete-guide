import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AssignmentRule,
  MemberLite,
  useAssignmentMatrix,
  useDeleteAssignmentRule,
  useProjects,
  useUpsertAssignmentRule,
} from "@/hooks/useWorkload";
import { useTaskStatuses } from "@/hooks/useTasks";
import { useTaskTypes } from "@/hooks/useTaskTypes";

interface Props {
  members: MemberLite[];
}

const ANY = "__any__";

function memberLabel(m?: MemberLite) {
  if (!m) return "—";
  return m.display_name || m.full_name || m.email || m.user_id.slice(0, 8);
}

/**
 * UI da matriz de auto-assign. Cada regra: (project? + type? + status?) → assignee
 * com priority (maior vence). Trigger no banco usa essas regras quando
 * uma tarefa muda de status.
 */
export function AssignmentMatrixPanel({ members }: Props) {
  const { data: rules, isLoading } = useAssignmentMatrix();
  const { data: statuses } = useTaskStatuses();
  const { data: types } = useTaskTypes();
  const { data: projects } = useProjects();
  const upsert = useUpsertAssignmentRule();
  const del = useDeleteAssignmentRule();

  const [draft, setDraft] = useState<{
    project_id: string;
    type_id: string;
    status_id: string;
    assignee_id: string;
    priority: number;
  }>({
    project_id: ANY,
    type_id: ANY,
    status_id: ANY,
    assignee_id: "",
    priority: 0,
  });

  const addRule = () => {
    if (!draft.assignee_id) return;
    upsert.mutate({
      project_id: draft.project_id === ANY ? null : draft.project_id,
      type_id: draft.type_id === ANY ? null : draft.type_id,
      status_id: draft.status_id === ANY ? null : draft.status_id,
      assignee_id: draft.assignee_id,
      priority: draft.priority,
    });
    setDraft({
      project_id: ANY,
      type_id: ANY,
      status_id: ANY,
      assignee_id: "",
      priority: 0,
    });
  };

  return (
    <section className="rounded-xl border bg-card">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Matriz de auto-assign</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Defina quem recebe automaticamente uma tarefa quando ela entra em
          determinado status, projeto ou tipo. Maior prioridade vence em caso de
          empate.
        </p>
      </header>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Projeto</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Responsável</th>
              <th className="px-3 py-2 w-20">Prioridade</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                </td>
              </tr>
            )}
            {!isLoading && (rules ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Nenhuma regra ainda. Adicione uma abaixo.
                </td>
              </tr>
            )}
            {(rules ?? []).map((r: AssignmentRule) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  {projects?.find((p) => p.id === r.project_id)?.name ?? (
                    <span className="text-muted-foreground">qualquer</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {types?.find((t) => t.id === r.type_id)?.name ?? (
                    <span className="text-muted-foreground">qualquer</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {statuses?.find((s) => s.id === r.status_id)?.name ?? (
                    <span className="text-muted-foreground">qualquer</span>
                  )}
                </td>
                <td className="px-3 py-2 font-medium">
                  {memberLabel(members.find((m) => m.user_id === r.assignee_id))}
                </td>
                <td className="px-3 py-2 tabular-nums">{r.priority}</td>
                <td className="px-3 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => del.mutate(r.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}

            {/* Linha de criação */}
            <tr className="bg-muted/20">
              <td className="px-3 py-2">
                <Select
                  value={draft.project_id}
                  onValueChange={(v) => setDraft({ ...draft, project_id: v })}
                >
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Qualquer</SelectItem>
                    {(projects ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-3 py-2">
                <Select
                  value={draft.type_id}
                  onValueChange={(v) => setDraft({ ...draft, type_id: v })}
                >
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Qualquer</SelectItem>
                    {(types ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-3 py-2">
                <Select
                  value={draft.status_id}
                  onValueChange={(v) => setDraft({ ...draft, status_id: v })}
                >
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Qualquer</SelectItem>
                    {(statuses ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-3 py-2">
                <Select
                  value={draft.assignee_id}
                  onValueChange={(v) => setDraft({ ...draft, assignee_id: v })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Selecione…" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {memberLabel(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  className="h-8"
                  value={draft.priority}
                  onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) || 0 })}
                />
              </td>
              <td className="px-3 py-2 text-right">
                <Button
                  size="icon"
                  className="h-8 w-8"
                  onClick={addRule}
                  disabled={!draft.assignee_id || upsert.isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}