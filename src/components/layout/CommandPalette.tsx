import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Inbox,
  ListTodo,
  CalendarDays,
  KanbanSquare,
  FolderKanban,
  Users,
  ClipboardList,
  BarChart3,
  Sparkles,
  Settings,
  Plus,
  Moon,
  Sun,
  CalendarClock,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const navItems = [
    { label: "Inbox", icon: Inbox, path: "/app", shortcut: "G I" },
    { label: "Hoje", icon: Sun, path: "/app/hoje", shortcut: "G H" },
    { label: "Próximos 7 dias", icon: CalendarClock, path: "/app/proximos" },
    { label: "Atrasadas", icon: AlertTriangle, path: "/app/atrasadas" },
    { label: "Atribuídas a mim", icon: UserCheck, path: "/app/atribuidas" },
    { label: "Calendário", icon: CalendarDays, path: "/app/calendario", shortcut: "G C" },
    { label: "Kanban", icon: KanbanSquare, path: "/app/kanban", shortcut: "G K" },
    { label: "Projetos", icon: FolderKanban, path: "/app/projetos" },
    { label: "Squads", icon: Users, path: "/app/squads" },
    { label: "Demandas", icon: ClipboardList, path: "/app/demandas" },
    { label: "Workload", icon: BarChart3, path: "/app/workload" },
    { label: "Gênio Growth", icon: Sparkles, path: "/app/genio" },
    { label: "Configurações", icon: Settings, path: "/app/configuracoes" },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Digite um comando, tarefa ou navegue…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>

        <CommandGroup heading="Ações rápidas">
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              toast.info("Quick Add chega no Passo 5 — vai abrir aqui mesmo.");
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova tarefa
            <CommandShortcut>Q</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              toggleTheme();
              onOpenChange(false);
            }}
          >
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Alternar tema ({theme === "dark" ? "claro" : "escuro"})
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ir para">
          {navItems.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => go(item.path)}
              value={`${item.label} ${item.path}`}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
              {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}