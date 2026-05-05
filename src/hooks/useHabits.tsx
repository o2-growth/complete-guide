import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { queryProfile } from "@/lib/query-config";
import { findPreset, type HabitFrequency } from "@/lib/habits-catalog";
import { toast } from "sonner";

export interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  cadence: string | null;
  target_per_period: number | null;
  color: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitCheckin {
  id: string;
  habit_id: string;
  user_id: string;
  checkin_date: string; // YYYY-MM-DD
  note: string | null;
  created_at: string;
}

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // YYYY-MM-DD em horário local — alinha com `current_date` do Postgres.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useHabits() {
  const { user } = useAuth();
  return useQuery({
    ...queryProfile("structural"),
    queryKey: ["habits", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<HabitRow[]> => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user!.id)
        .eq("archived", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HabitRow[];
    },
  });
}

export function useHabitCheckins(habitId: string | null, days = 90) {
  const { user } = useAuth();
  return useQuery({
    ...queryProfile("structural"),
    queryKey: ["habit-checkins", habitId, user?.id, days],
    enabled: !!user && !!habitId,
    queryFn: async (): Promise<HabitCheckin[]> => {
      const since = daysAgoISO(days);
      const { data, error } = await supabase
        .from("habit_checkins")
        .select("*")
        .eq("habit_id", habitId!)
        .eq("user_id", user!.id)
        .gte("checkin_date", since)
        .order("checkin_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HabitCheckin[];
    },
  });
}

export function useCheckinHabit() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (habitId: string) => {
      if (!user) throw new Error("Sem sessão.");
      const date = todayISO();
      // UPSERT idempotente — UNIQUE (habit_id, checkin_date) garante 1/dia.
      const { error } = await supabase
        .from("habit_checkins")
        .upsert(
          { habit_id: habitId, user_id: user.id, checkin_date: date },
          { onConflict: "habit_id,checkin_date" },
        );
      if (error) throw error;
      return { habitId, date };
    },
    onSuccess: ({ habitId }) => {
      qc.invalidateQueries({ queryKey: ["habit-checkins", habitId] });
      toast.success("Hábito marcado como feito hoje");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUncheckinHabit() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (habitId: string) => {
      if (!user) throw new Error("Sem sessão.");
      const date = todayISO();
      const { error } = await supabase
        .from("habit_checkins")
        .delete()
        .eq("habit_id", habitId)
        .eq("user_id", user.id)
        .eq("checkin_date", date);
      if (error) throw error;
      return habitId;
    },
    onSuccess: (habitId) => {
      qc.invalidateQueries({ queryKey: ["habit-checkins", habitId] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

interface CreateHabitInput {
  name: string;
  cadence?: HabitFrequency;
  target_per_period?: number;
  color?: string | null;
}

export function useCreateHabit() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CreateHabitInput) => {
      if (!user) throw new Error("Sem sessão.");
      const { data, error } = await supabase
        .from("habits")
        .insert({
          user_id: user.id,
          name: input.name,
          cadence: input.cadence ?? "daily",
          target_per_period: input.target_per_period ?? 1,
          color: input.color ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as HabitRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Hábito criado");
    },
    onError: (e: Error) => toast.error("Erro ao criar hábito: " + e.message),
  });
}

export function useCreateHabitFromPreset() {
  const create = useCreateHabit();
  return {
    ...create,
    mutate: (presetId: string) => {
      const preset = findPreset(presetId);
      if (!preset) {
        toast.error("Hábito não encontrado no catálogo");
        return;
      }
      create.mutate({
        name: preset.name,
        cadence: preset.suggestedFrequency,
        target_per_period: 1,
      });
    },
    mutateAsync: async (presetId: string) => {
      const preset = findPreset(presetId);
      if (!preset) throw new Error("Hábito não encontrado no catálogo");
      return create.mutateAsync({
        name: preset.name,
        cadence: preset.suggestedFrequency,
        target_per_period: 1,
      });
    },
  };
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from("habits")
        .update({ archived: true })
        .eq("id", habitId);
      if (error) throw error;
      return habitId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Hábito arquivado");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

/**
 * Calcula streak atual (dias consecutivos terminando hoje ou ontem) e o
 * recorde histórico no array de checkins recebido.
 */
export function computeStreaks(checkins: HabitCheckin[]): {
  current: number;
  best: number;
  doneToday: boolean;
} {
  if (!checkins.length) return { current: 0, best: 0, doneToday: false };

  const set = new Set(checkins.map((c) => c.checkin_date));
  const today = todayISO();
  const yesterday = daysAgoISO(1);
  const doneToday = set.has(today);

  // Recorde: varre as datas ordenadas e conta sequências.
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const dateStr of sorted) {
    const d = new Date(dateStr + "T00:00:00");
    if (prev) {
      const diff = Math.round((d.getTime() - prev.getTime()) / 86400000);
      if (diff === 1) run += 1;
      else run = 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prev = d;
  }

  // Streak atual: começa de hoje (se feito) ou ontem (mantém o streak), e vai
  // pra trás enquanto houver dias contínuos.
  let current = 0;
  const cursor = doneToday ? new Date(today + "T00:00:00") : new Date(yesterday + "T00:00:00");
  if (!doneToday && !set.has(yesterday)) {
    current = 0;
  } else {
    while (true) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const dd = String(cursor.getDate()).padStart(2, "0");
      const k = `${y}-${m}-${dd}`;
      if (set.has(k)) {
        current += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return { current, best, doneToday };
}
