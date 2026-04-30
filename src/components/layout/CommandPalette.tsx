import { useNavigate } from "react-router-dom";
import { useState } from "react";
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
  CheckSquare,
  FolderOpen,
  Megaphone,
  Bot,
  Crown,
  Bell,
  Keyboard,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const { results, loading } = useGlobalSearch(query);

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
    { label: "Copilot IA", icon: Bot, path: "/app/copilot", shortcut: "G O" },
    { label: "Executive", icon: Crown, path: "/app/exec", shortcut: "G E" },
    { label: "Notificações", icon: Bell, path: "/app/notificacoes", shortcut: "G N" },
    { label: "Atalhos do teclado", icon: Keyboard, path: "/app/atalhos", shortcut: "?" },
    { label: "Configurações", icon: Settings, path: "/app/configuracoes" },
  ];

  return (
    <CommandDialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQuery(""); }}>
      <CommandInput placeholder="Buscar tarefas, projetos, posts ou navegar…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{loading ? "Buscando…" : "Nada encontrado."}</CommandEmpty>

        {results.length > 0 && (
          <>
            <CommandGroup heading={`Resultados (${results.length})`}>
              {results.map(r => {
                const Icon = r.kind === "task" ? CheckSquare : r.kind === "project" ? FolderOpen : Megaphone;
                return (
                  <CommandItem key={`${r.kind}-${r.id}`} onSelect={() => go(r.href)} value={`${r.title} ${r.kind} ${r.id}`}>
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{r.title}</span>
                    {r.subtitle && <span className="text-[10px] text-muted-foreground">{r.subtitle}</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

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