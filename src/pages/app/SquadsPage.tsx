import { useMemo, useState } from "react";
import { Users, Plus, Trash2, Bot, Megaphone, Rocket, Sparkles, CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/skeletons/ListSkeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  useSquads,
  useCreateSquad,
  useAddSquadMember,
  useRemoveSquadMember,
  useTenantMembers,
  SquadKind,
  SquadRole,
  SquadWithStats,
} from "@/hooks/useSquads";
import { cn } from "@/lib/utils";

const KIND_META: Record<SquadKind, { label: string; icon: typeof Bot; color: string }> = {
  ia: { label: "IA & Automação", icon: Bot, color: "from-violet-500 to-fuchsia-500" },
  marketing: { label: "Marketing", icon: Megaphone, color: "from-orange-500 to-rose-500" },
  expansao: { label: "Expansão", icon: Rocket, color: "from-emerald-500 to-teal-500" },
  custom: { label: "Squad", icon: Sparkles, color: "from-sky-500 to-blue-500" },
};

function initials(name?: string | null) {
  return (name || "?").split(/[\s.@]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}

function CreateSquadDialog() {
  const create = useCreateSquad();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<SquadKind>("custom");
  const [description, setDescription] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Novo squad</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Criar squad</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Squad Performance" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as SquadKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_META) as SquadKind[]).map((k) => (
                  <SelectItem key={k} value={k}>{KIND_META[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!name || create.isPending}
            onClick={async () => {
              await create.mutateAsync({ name, kind, description });
              setOpen(false);
              setName("");
              setDescription("");
            }}
          >
            {create.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({ squad }: { squad: SquadWithStats }) {
  const { data: tenantMembers } = useTenantMembers();
  const add = useAddSquadMember();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<SquadRole>("specialist");
  const [capacity, setCapacity] = useState(40);

  const available = useMemo(() => {
    const inSquad = new Set(squad.members.map((m) => m.user_id));
    return (tenantMembers ?? []).filter((m) => !inSquad.has(m.id));
  }, [tenantMembers, squad.members]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar membro</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Pessoa</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {available.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.display_name || m.full_name || m.email}</SelectItem>
                ))}
                {available.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">Sem membros disponíveis</div>}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Papel</Label>
              <Select value={role} onValueChange={(v) => setRole(v as SquadRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="specialist">Specialist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Capacidade (h/sem)</Label>
              <Input type="number" min={0} max={168} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!userId || add.isPending}
            onClick={async () => {
              await add.mutateAsync({ squad_id: squad.id, user_id: userId, role, capacity });
              setOpen(false);
              setUserId("");
            }}
          >
            {add.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SquadCard({ squad, index }: { squad: SquadWithStats; index?: number }) {
  const meta = KIND_META[squad.kind] ?? KIND_META.custom;
  const Icon = meta.icon;
  const remove = useRemoveSquadMember();
  const utilization = squad.totalCapacity > 0
    ? Math.min(100, Math.round((squad.openTasks / Math.max(squad.members.length, 1)) * 10))
    : 0;
  const staggerDelay =
    typeof index === "number" && index < 5 ? `${index * 40}ms` : undefined;

  return (
    <Card
      className="overflow-hidden animate-fade-in"
      style={staggerDelay ? { animationDelay: staggerDelay } : undefined}
    >
      <div className={cn("h-1.5 w-full bg-gradient-to-r", meta.color)} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white", meta.color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{squad.name}</CardTitle>
              <p className="text-[11px] text-muted-foreground">{meta.label}</p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">{squad.members.length} {squad.members.length === 1 ? "membro" : "membros"}</Badge>
        </div>
        {squad.description && <p className="mt-2 text-xs text-muted-foreground">{squad.description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-md border bg-muted/20 px-2 py-1.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Capacity</p>
            <p className="text-sm font-semibold">{squad.totalCapacity}h</p>
          </div>
          <div className="rounded-md border bg-muted/20 px-2 py-1.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground"><Clock className="mx-auto h-3 w-3" /></p>
            <p className="text-sm font-semibold">{squad.openTasks}</p>
          </div>
          <div className="rounded-md border bg-muted/20 px-2 py-1.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-emerald-600"><CheckCircle2 className="mx-auto h-3 w-3" /></p>
            <p className="text-sm font-semibold">{squad.doneLast30}</p>
          </div>
          <div className="rounded-md border bg-muted/20 px-2 py-1.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-rose-600"><AlertTriangle className="mx-auto h-3 w-3" /></p>
            <p className="text-sm font-semibold">{squad.overdue}</p>
          </div>
        </div>

        {/* Members */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Membros</h4>
            <AddMemberDialog squad={squad} />
          </div>
          {squad.members.length === 0 ? (
            <p className="rounded-md border border-dashed py-4 text-center text-xs text-muted-foreground">Nenhum membro ainda</p>
          ) : (
            <div className="space-y-1">
              {squad.members.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-muted/40">
                  <Avatar className="h-7 w-7">
                    {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} alt="" />}
                    <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                      {initials(m.profile?.display_name || m.profile?.full_name || m.profile?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {m.profile?.display_name || m.profile?.full_name || m.profile?.email || "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {m.role_in_squad} · {m.capacity_hours_week ?? 0}h/sem
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" aria-label="Remover" onClick={() => remove.mutate(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
          <span>Carga estimada</span>
          <span className={cn("font-medium", utilization > 80 ? "text-rose-600" : utilization > 50 ? "text-amber-600" : "text-emerald-600")}>
            {utilization}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SquadsPage() {
  const { data, isLoading } = useSquads();

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <CardGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
            <Users className="mr-1.5 h-3 w-3" /> Squads · Fase 2 · Passo 19
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Squads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Times multidisciplinares com capacity, papéis e performance — IA & Automação, Marketing, Expansão.
          </p>
        </div>
        <CreateSquadDialog />
      </header>

      {(data ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum squad criado ainda. Comece pelo botão "Novo squad".
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data!.map((s, i) => <SquadCard key={s.id} squad={s} index={i} />)}
        </div>
      )}
    </div>
  );
}