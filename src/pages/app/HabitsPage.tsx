import { useMemo, useState, type ComponentType } from "react";
import { ActivityCalendar, type Activity } from "react-activity-calendar";
import * as LucideIcons from "lucide-react";
import {
  Repeat,
  Plus,
  Check,
  Loader2,
  Flame,
  Trophy,
  Trash2,
  Sparkles,
} from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import {
  HABITS_CATALOG,
  HABIT_CATEGORIES,
  HABIT_FREQUENCY_LABEL,
  type HabitCategory,
  type HabitFrequency,
  type HabitPreset,
  findPreset,
} from "@/lib/habits-catalog";
import {
  computeStreaks,
  useCheckinHabit,
  useCreateHabit,
  useCreateHabitFromPreset,
  useDeleteHabit,
  useHabitCheckins,
  useHabits,
  type HabitRow,
} from "@/hooks/useHabits";

type LucideIconType = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
const Icons = LucideIcons as unknown as Record<string, LucideIconType>;

function getIcon(name: string | undefined): LucideIconType {
  if (name && Icons[name]) return Icons[name];
  return Icons.Repeat ?? Repeat;
}

/**
 * Mapeia o name do hábito de volta pra um preset (caso tenha sido criado via
 * catálogo) — usado pra recuperar ícone & categoria.
 */
function inferPresetFromHabit(habit: HabitRow): HabitPreset | undefined {
  return HABITS_CATALOG.find((p) => p.name === habit.name);
}

function HabitHeatmap({ habitId }: { habitId: string }) {
  const { data: checkins = [], isLoading } = useHabitCheckins(habitId, 90);

  const activity: Activity[] = useMemo(() => {
    // Constroi 90 dias terminando hoje.
    const arr: Activity[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const set = new Set(checkins.map((c) => c.checkin_date));
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${dd}`;
      const done = set.has(key);
      arr.push({ date: key, count: done ? 1 : 0, level: done ? 4 : 0 });
    }
    return arr;
  }, [checkins]);

  if (isLoading) {
    return (
      <div className="flex h-[100px] items-center justify-center text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-label="Carregando heatmap" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" aria-label="Heatmap dos últimos 90 dias">
      <ActivityCalendar
        data={activity}
        blockSize={11}
        blockMargin={3}
        blockRadius={2}
        fontSize={11}
        hideTotalCount
        hideColorLegend
        labels={{
          months: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
          weekdays: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
          totalCount: "{{count}} dias em {{year}}",
        }}
        theme={{
          light: ["hsl(214, 32%, 91%)", "hsl(199, 89%, 80%)", "hsl(199, 89%, 65%)", "hsl(199, 89%, 55%)", "hsl(199, 89%, 48%)"],
          dark: ["hsl(217, 33%, 18%)", "hsl(199, 60%, 30%)", "hsl(199, 75%, 45%)", "hsl(199, 89%, 55%)", "hsl(199, 89%, 65%)"],
        }}
      />
    </div>
  );
}

function HabitCard({ habit }: { habit: HabitRow }) {
  const { data: checkins = [] } = useHabitCheckins(habit.id, 90);
  const checkin = useCheckinHabit();
  const remove = useDeleteHabit();
  const stats = useMemo(() => computeStreaks(checkins), [checkins]);
  const preset = inferPresetFromHabit(habit);
  const Icon = getIcon(preset?.icon);

  const cadenceLabel =
    (habit.cadence && HABIT_FREQUENCY_LABEL[habit.cadence as HabitFrequency]) ??
    habit.cadence ??
    "Diário";

  return (
    <Card className="flex flex-col gap-3 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold leading-tight">{habit.name}</h3>
          <p className="text-xs text-muted-foreground">{cadenceLabel}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label={`Excluir hábito ${habit.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Arquivar hábito?</AlertDialogTitle>
              <AlertDialogDescription>
                O hábito "{habit.name}" será arquivado. Os checkins continuam no histórico.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => remove.mutate(habit.id)}>
                Arquivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Button
        type="button"
        size="lg"
        disabled={stats.doneToday || checkin.isPending}
        onClick={() => checkin.mutate(habit.id)}
        className={cn(
          "w-full text-base font-semibold",
          stats.doneToday && "pointer-events-none bg-success text-success-foreground hover:bg-success",
        )}
        aria-label={stats.doneToday ? "Já feito hoje" : "Marcar feito hoje"}
      >
        {checkin.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : stats.doneToday ? (
          <Check className="mr-2 h-5 w-5" />
        ) : (
          <Sparkles className="mr-2 h-5 w-5" />
        )}
        {stats.doneToday ? "Feito hoje" : "Marcar feito hoje"}
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Flame className="h-3 w-3" aria-hidden="true" /> Streak atual
          </div>
          <div className="mt-0.5 text-xl font-bold">
            {stats.current}
            <span className="ml-1 text-xs font-normal text-muted-foreground">dias</span>
          </div>
        </div>
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Trophy className="h-3 w-3" aria-hidden="true" /> Recorde
          </div>
          <div className="mt-0.5 text-xl font-bold">
            {stats.best}
            <span className="ml-1 text-xs font-normal text-muted-foreground">dias</span>
          </div>
        </div>
      </div>

      <HabitHeatmap habitId={habit.id} />
    </Card>
  );
}

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateHabitDialog({ open, onOpenChange }: CreateDialogProps) {
  const [tab, setTab] = useState<"catalogo" | "custom">("catalogo");
  const [category, setCategory] = useState<HabitCategory | "todos">("todos");
  const [customName, setCustomName] = useState("");
  const [customCadence, setCustomCadence] = useState<HabitFrequency>("daily");

  const fromPreset = useCreateHabitFromPreset();
  const create = useCreateHabit();

  const filtered = useMemo(() => {
    if (category === "todos") return HABITS_CATALOG;
    return HABITS_CATALOG.filter((p) => p.category === category);
  }, [category]);

  const handleCreatePreset = async (presetId: string) => {
    await fromPreset.mutateAsync(presetId);
    onOpenChange(false);
  };

  const handleCreateCustom = async () => {
    const name = customName.trim();
    if (!name) return;
    await create.mutateAsync({ name, cadence: customCadence });
    setCustomName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Criar hábito</DialogTitle>
          <DialogDescription>
            Comece por um do catálogo ou crie um personalizado.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex h-full flex-col">
          <TabsList className="mx-6 mt-2 grid w-fit grid-cols-2">
            <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
            <TabsTrigger value="custom">Personalizado</TabsTrigger>
          </TabsList>

          <TabsContent value="catalogo" className="flex-1 overflow-hidden px-6 pb-6">
            <div className="my-3 flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={category === "todos" ? "default" : "outline"}
                onClick={() => setCategory("todos")}
              >
                Todos
              </Button>
              {HABIT_CATEGORIES.map((c) => (
                <Button
                  key={c.id}
                  type="button"
                  size="sm"
                  variant={category === c.id ? "default" : "outline"}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
            <div className="-mx-2 max-h-[55vh] overflow-y-auto px-2">
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filtered.map((preset) => {
                  const Icon = getIcon(preset.icon);
                  return (
                    <li key={preset.id}>
                      <button
                        type="button"
                        onClick={() => handleCreatePreset(preset.id)}
                        disabled={fromPreset.isPending}
                        className="group flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-all hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                        aria-label={`Adicionar hábito ${preset.name}`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{preset.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {HABIT_FREQUENCY_LABEL[preset.suggestedFrequency]}
                          </p>
                        </div>
                        <Plus className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="px-6 pb-6">
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="habit-name">Nome do hábito</Label>
                <Input
                  id="habit-name"
                  placeholder="Ex: Tocar violão por 15min"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="habit-cadence">Frequência</Label>
                <Select value={customCadence} onValueChange={(v) => setCustomCadence(v as HabitFrequency)}>
                  <SelectTrigger id="habit-cadence">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(HABIT_FREQUENCY_LABEL).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateCustom}
                disabled={!customName.trim() || create.isPending}
              >
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar hábito
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function HabitsPage() {
  const { data: habits = [], isLoading, error } = useHabits();
  const [open, setOpen] = useState(false);

  return (
    <main className="container mx-auto flex max-w-6xl flex-col gap-4 px-3 py-4 md:px-4 md:py-6">
      <SEO
        title="Hábitos — Oxy Growth OS"
        description="Acompanhe seus hábitos diários, streaks e recordes."
      />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-brand">
            <Repeat className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Hábitos</h1>
            <p className="text-sm text-muted-foreground">
              Construa rotinas duradouras. Marque o que fez hoje.
            </p>
          </div>
        </div>
        <Button type="button" onClick={() => setOpen(true)} className="shrink-0">
          <Plus className="mr-1.5 h-4 w-4" /> Criar hábito
        </Button>
      </header>

      <CreateHabitDialog open={open} onOpenChange={setOpen} />

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-label="Carregando" />
        </div>
      )}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar hábitos: {error.message}
        </Card>
      )}

      {!isLoading && !error && habits.length === 0 && (
        <EmptyState
          icon={Repeat}
          title="Nenhum hábito ainda"
          description="Escolha algo do catálogo ou crie um do zero pra começar."
          action={{ label: "Criar hábito", onClick: () => setOpen(true), icon: Plus }}
        />
      )}

      {habits.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          {habits.map((h) => (
            <li key={h.id}>
              <HabitCard habit={h} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[11px] text-muted-foreground/70">
        <Badge variant="outline" className="mr-1.5 text-[10px]">{HABITS_CATALOG.length}</Badge>
        hábitos disponíveis no catálogo, agrupados em {HABIT_CATEGORIES.length} categorias.
      </p>
    </main>
  );
}
