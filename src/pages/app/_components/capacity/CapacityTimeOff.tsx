import { Trash2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TimeOffKind, MemberLite } from "@/hooks/useCapacity";
import { KIND_META, fmtDate } from "./constants";

interface TimeOffRow {
  id: string;
  user_id: string;
  kind: TimeOffKind;
  start_date: string;
  end_date: string;
  reason?: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
}

interface Props {
  offKind: TimeOffKind;
  startDate: string;
  endDate: string;
  reason: string;
  creating: boolean;
  members: MemberLite[];
  timeOff: TimeOffRow[];
  currentUserId: string | undefined;
  onChangeOffKind: (k: TimeOffKind) => void;
  onChangeStart: (s: string) => void;
  onChangeEnd: (s: string) => void;
  onChangeReason: (s: string) => void;
  onCreate: () => void;
  onUpdateStatus: (id: string, status: "approved" | "rejected") => void;
  onDelete: (id: string) => void;
}

export function CapacityTimeOff({
  offKind,
  startDate,
  endDate,
  reason,
  creating,
  members,
  timeOff,
  currentUserId,
  onChangeOffKind,
  onChangeStart,
  onChangeEnd,
  onChangeReason,
  onCreate,
  onUpdateStatus,
  onDelete,
}: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Solicitar ausência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={offKind} onValueChange={(v) => onChangeOffKind(v as TimeOffKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(KIND_META) as TimeOffKind[]).map((k) => (
                    <SelectItem key={k} value={k}>{KIND_META[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Início</Label>
              <Input type="date" value={startDate} onChange={(e) => onChangeStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim</Label>
              <Input type="date" value={endDate} onChange={(e) => onChangeEnd(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={onCreate} disabled={creating}>
                Solicitar
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Input id="reason" value={reason} onChange={(e) => onChangeReason(e.target.value)} placeholder="Ex: viagem programada" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ausências registradas</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {timeOff.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma ausência registrada ainda.</p>
          )}
          {timeOff.map((off) => {
            const meta = KIND_META[off.kind];
            const Icon = meta.icon;
            const member = members.find((m) => m.id === off.user_id);
            const isMine = off.user_id === currentUserId;
            const isPending = off.status === "pending";
            return (
              <div key={off.id} className="flex items-center gap-3 py-3">
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-md", meta.color)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {meta.label} · {fmtDate(off.start_date)} → {fmtDate(off.end_date)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {member?.display_name || member?.full_name || member?.email || "—"}
                    {off.reason && <span className="ml-2 italic">"{off.reason}"</span>}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    off.status === "approved" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    off.status === "rejected" && "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
                    off.status === "pending" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    off.status === "cancelled" && "border-muted text-muted-foreground",
                  )}
                >
                  {off.status}
                </Badge>
                <div className="flex items-center gap-1">
                  {isPending && (
                    <>
                      <Button size="icon" variant="ghost" aria-label="Aprovar" onClick={() => onUpdateStatus(off.id, "approved")}>
                        <Check className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Recusar" onClick={() => onUpdateStatus(off.id, "rejected")}>
                        <X className="h-4 w-4 text-rose-600" />
                      </Button>
                    </>
                  )}
                  {isMine && (
                    <Button size="icon" variant="ghost" aria-label="Remover" onClick={() => onDelete(off.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
