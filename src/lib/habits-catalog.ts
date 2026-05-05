export type HabitCategory =
  | "saude"
  | "foco"
  | "aprendizado"
  | "relacionamento"
  | "trabalho"
  | "mindfulness";

export type HabitFrequency = "daily" | "weekly_3" | "weekly_5" | "weekdays";

export interface HabitPreset {
  id: string;
  name: string;
  icon: string; // nome do ícone lucide-react
  category: HabitCategory;
  suggestedFrequency: HabitFrequency;
  description?: string;
}

export const HABIT_CATEGORIES: { id: HabitCategory; label: string }[] = [
  { id: "saude", label: "Saúde" },
  { id: "foco", label: "Foco" },
  { id: "aprendizado", label: "Aprendizado" },
  { id: "relacionamento", label: "Relacionamento" },
  { id: "trabalho", label: "Trabalho" },
  { id: "mindfulness", label: "Mindfulness" },
];

export const HABIT_FREQUENCY_LABEL: Record<HabitFrequency, string> = {
  daily: "Todo dia",
  weekly_3: "3x por semana",
  weekly_5: "5x por semana",
  weekdays: "Dias úteis",
};

/**
 * Catálogo de hábitos pré-definidos em pt-BR. 60+ entradas, mínimo 10 por
 * categoria. Os ícones usam nomes do lucide-react.
 */
export const HABITS_CATALOG: HabitPreset[] = [
  // === Saúde (12) ===
  { id: "water", name: "Beber 2L de água", icon: "GlassWater", category: "saude", suggestedFrequency: "daily", description: "Hidrate-se ao longo do dia." },
  { id: "exercise", name: "Exercício físico (30min)", icon: "Dumbbell", category: "saude", suggestedFrequency: "weekly_5" },
  { id: "walk", name: "Caminhar 10 mil passos", icon: "Footprints", category: "saude", suggestedFrequency: "daily" },
  { id: "stretch", name: "Alongamento (10min)", icon: "Activity", category: "saude", suggestedFrequency: "daily" },
  { id: "sleep", name: "Dormir 7h+", icon: "Moon", category: "saude", suggestedFrequency: "daily" },
  { id: "wake-early", name: "Acordar antes das 7h", icon: "Sunrise", category: "saude", suggestedFrequency: "weekdays" },
  { id: "no-sugar", name: "Evitar açúcar refinado", icon: "Candy", category: "saude", suggestedFrequency: "daily" },
  { id: "fruits", name: "Comer 3 porções de fruta", icon: "Apple", category: "saude", suggestedFrequency: "daily" },
  { id: "vitamins", name: "Tomar vitaminas/suplementos", icon: "Pill", category: "saude", suggestedFrequency: "daily" },
  { id: "no-alcohol", name: "Sem álcool", icon: "Wine", category: "saude", suggestedFrequency: "weekdays" },
  { id: "yoga", name: "Yoga", icon: "Flower2", category: "saude", suggestedFrequency: "weekly_3" },
  { id: "outdoor", name: "Tomar sol (15min)", icon: "Sun", category: "saude", suggestedFrequency: "daily" },

  // === Foco (10) ===
  { id: "deep-work", name: "Bloco de deep work (90min)", icon: "Target", category: "foco", suggestedFrequency: "weekdays" },
  { id: "pomodoro", name: "Fazer 4 pomodoros", icon: "Timer", category: "foco", suggestedFrequency: "weekdays" },
  { id: "no-phone-morning", name: "Sem celular na primeira hora", icon: "PhoneOff", category: "foco", suggestedFrequency: "daily" },
  { id: "single-task", name: "Foco em uma tarefa por vez", icon: "Crosshair", category: "foco", suggestedFrequency: "weekdays" },
  { id: "plan-day", name: "Planejar o dia de manhã", icon: "ClipboardList", category: "foco", suggestedFrequency: "weekdays" },
  { id: "review-day", name: "Revisar o dia à noite", icon: "ListChecks", category: "foco", suggestedFrequency: "weekdays" },
  { id: "no-social", name: "Sem redes sociais antes do meio-dia", icon: "Smartphone", category: "foco", suggestedFrequency: "weekdays" },
  { id: "inbox-zero", name: "Inbox zero", icon: "Mail", category: "foco", suggestedFrequency: "daily" },
  { id: "weekly-review", name: "Review semanal", icon: "CalendarCheck", category: "foco", suggestedFrequency: "weekly_3" },
  { id: "time-block", name: "Time-blocking da agenda", icon: "CalendarRange", category: "foco", suggestedFrequency: "weekdays" },

  // === Aprendizado (10) ===
  { id: "read", name: "Ler 20 páginas", icon: "BookOpen", category: "aprendizado", suggestedFrequency: "daily" },
  { id: "podcast", name: "Ouvir 1 episódio de podcast", icon: "Headphones", category: "aprendizado", suggestedFrequency: "weekly_3" },
  { id: "course", name: "Estudar 30min de curso online", icon: "GraduationCap", category: "aprendizado", suggestedFrequency: "weekdays" },
  { id: "language", name: "Praticar idioma novo", icon: "Languages", category: "aprendizado", suggestedFrequency: "daily" },
  { id: "code", name: "Codar projeto pessoal (1h)", icon: "Code2", category: "aprendizado", suggestedFrequency: "weekly_3" },
  { id: "newsletter", name: "Ler newsletter da indústria", icon: "Newspaper", category: "aprendizado", suggestedFrequency: "weekly_5" },
  { id: "youtube-edu", name: "1 vídeo educacional no YouTube", icon: "Youtube", category: "aprendizado", suggestedFrequency: "weekly_3" },
  { id: "flashcards", name: "Revisar flashcards", icon: "Layers", category: "aprendizado", suggestedFrequency: "daily" },
  { id: "writing", name: "Escrever 500 palavras", icon: "PenLine", category: "aprendizado", suggestedFrequency: "weekdays" },
  { id: "tutorial", name: "Fazer um tutorial novo", icon: "Lightbulb", category: "aprendizado", suggestedFrequency: "weekly_3" },

  // === Relacionamento (10) ===
  { id: "family-call", name: "Ligar pra família", icon: "PhoneCall", category: "relacionamento", suggestedFrequency: "weekly_3" },
  { id: "friend-msg", name: "Mandar mensagem pra um amigo", icon: "MessageCircle", category: "relacionamento", suggestedFrequency: "daily" },
  { id: "date-night", name: "Date night com parceiro(a)", icon: "Heart", category: "relacionamento", suggestedFrequency: "weekly_3" },
  { id: "compliment", name: "Elogiar alguém de verdade", icon: "Star", category: "relacionamento", suggestedFrequency: "daily" },
  { id: "no-screen-dinner", name: "Jantar sem telas", icon: "Utensils", category: "relacionamento", suggestedFrequency: "daily" },
  { id: "thank-you", name: "Agradecer alguém especificamente", icon: "Gift", category: "relacionamento", suggestedFrequency: "daily" },
  { id: "networking", name: "Conversar com 1 pessoa nova", icon: "Users", category: "relacionamento", suggestedFrequency: "weekly_3" },
  { id: "active-listen", name: "Praticar escuta ativa", icon: "Ear", category: "relacionamento", suggestedFrequency: "daily" },
  { id: "kids-time", name: "Tempo de qualidade com filhos", icon: "Baby", category: "relacionamento", suggestedFrequency: "daily" },
  { id: "mentor", name: "Mentorar alguém (15min)", icon: "Handshake", category: "relacionamento", suggestedFrequency: "weekly_3" },

  // === Trabalho (10) ===
  { id: "tasks-done", name: "Concluir 5 tarefas", icon: "CheckCircle2", category: "trabalho", suggestedFrequency: "weekdays" },
  { id: "no-meeting-block", name: "Bloco sem reunião", icon: "CalendarOff", category: "trabalho", suggestedFrequency: "weekdays" },
  { id: "stand-up", name: "Stand-up diário", icon: "MessagesSquare", category: "trabalho", suggestedFrequency: "weekdays" },
  { id: "weekly-report", name: "Report semanal", icon: "FileText", category: "trabalho", suggestedFrequency: "weekly_3" },
  { id: "team-1on1", name: "1:1 com alguém do time", icon: "UserPlus", category: "trabalho", suggestedFrequency: "weekly_3" },
  { id: "ship-something", name: "Entregar algo (mesmo pequeno)", icon: "Rocket", category: "trabalho", suggestedFrequency: "weekdays" },
  { id: "client-update", name: "Update pra cliente", icon: "Mailbox", category: "trabalho", suggestedFrequency: "weekly_5" },
  { id: "metrics-review", name: "Revisar métricas-chave", icon: "BarChart3", category: "trabalho", suggestedFrequency: "weekdays" },
  { id: "no-work-after-19", name: "Parar de trabalhar até 19h", icon: "Clock", category: "trabalho", suggestedFrequency: "weekdays" },
  { id: "automate", name: "Automatizar 1 processo manual", icon: "Workflow", category: "trabalho", suggestedFrequency: "weekly_3" },

  // === Mindfulness (10) ===
  { id: "meditation", name: "Meditar (10min)", icon: "Sparkles", category: "mindfulness", suggestedFrequency: "daily" },
  { id: "breathing", name: "Respiração consciente (5min)", icon: "Wind", category: "mindfulness", suggestedFrequency: "daily" },
  { id: "journal", name: "Escrever no diário", icon: "Notebook", category: "mindfulness", suggestedFrequency: "daily" },
  { id: "gratitude", name: "Listar 3 gratidões", icon: "HandHeart", category: "mindfulness", suggestedFrequency: "daily" },
  { id: "screen-free", name: "1h sem telas", icon: "Tv2", category: "mindfulness", suggestedFrequency: "daily" },
  { id: "nature", name: "Tempo na natureza", icon: "TreePine", category: "mindfulness", suggestedFrequency: "weekly_3" },
  { id: "digital-detox", name: "Detox digital (manhã)", icon: "BatteryLow", category: "mindfulness", suggestedFrequency: "weekly_3" },
  { id: "music", name: "Ouvir música com atenção plena", icon: "Music2", category: "mindfulness", suggestedFrequency: "daily" },
  { id: "evening-reflection", name: "Reflexão noturna", icon: "Stars", category: "mindfulness", suggestedFrequency: "daily" },
  { id: "tea", name: "Ritual do chá ou café", icon: "Coffee", category: "mindfulness", suggestedFrequency: "daily" },
];

export function getPresetsByCategory(category: HabitCategory): HabitPreset[] {
  return HABITS_CATALOG.filter((h) => h.category === category);
}

export function findPreset(id: string): HabitPreset | undefined {
  return HABITS_CATALOG.find((h) => h.id === id);
}
