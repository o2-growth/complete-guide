import { Link as LinkIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Submission {
  id: string;
  status: string | null;
  requester_name: string | null;
  requester_email: string | null;
  payload: unknown;
  created_at: string;
  task_id: string | null;
  form_id: string | null;
  approval_token: string | null;
}

interface DemandFormLite {
  id: string;
  title: string;
}

function SubStatusDot({ status }: { status: string }) {
  const cls =
    status === "approved"
      ? "bg-primary"
      : status === "rejected"
        ? "bg-destructive"
        : "bg-[hsl(var(--prio-medium))]";
  return <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${cls}`} />;
}

interface Props {
  loading: boolean;
  submissions: Submission[];
  forms: DemandFormLite[];
  onCopyLink: (path: string) => void;
}

export function DemandSubmissionsList({ loading, submissions, forms, onCopyLink }: Props) {
  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }
  if (submissions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        Nenhuma submissão ainda.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {submissions.map((s) => {
        const form = forms.find((f) => f.id === s.form_id);
        const title =
          (s.payload as Record<string, unknown> | null)?.title?.toString() ??
          form?.title ?? "Demanda";
        return (
          <div
            key={s.id}
            className="flex items-start gap-3 rounded-lg border bg-card p-3"
          >
            <SubStatusDot status={s.status ?? "pending"} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">
                {s.requester_name || s.requester_email || "anônimo"} ·{" "}
                {formatDistanceToNow(new Date(s.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] capitalize">
              {s.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopyLink(`/aprovar/${s.approval_token}`)}
            >
              <LinkIcon className="mr-1.5 h-3.5 w-3.5" /> Aprovação
            </Button>
          </div>
        );
      })}
    </div>
  );
}
