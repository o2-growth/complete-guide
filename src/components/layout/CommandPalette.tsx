import { useEffect, useMemo, useState } from "react";
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
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Brain,
  Briefcase,
  Calendar as CalendarIcon,
  CalendarClock,
  CalendarDays,
  CheckCheck,
  CheckSquare,
  ClipboardList,
  Clock,
  Cog,
  Crown,
  Database,
  FileText,
  FolderKanban,
  FolderOpen,
  Globe,
  HelpCircle,
  History,
  Inbox,
  Inbox as InboxIcon,
  KanbanSquare,
  Keyboard,
  Languages,
  LifeBuoy,
  LayoutDashboard,
  LineChart,
  ListTodo,
  Megaphone,
  Moon,
  Network,
  Palette,
  Plus,
  Rocket,
  Search,
  Settings,
  Shapes,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useRecentCommands, type RecentCommand } from "@/hooks/useRecentCommands";
import { useRecentTasks } from "@/hooks/useRecentTasks";
import { useProjects } from "@/hooks/useProjects";
import { useWikiSearch, useWikiPages } from "@/hooks/useWiki";
import { useStartPomodoro } from "@/hooks/useTimer";
import { useMarkRead } from "@/hooks/useNotifications";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  shortcut?: string;
  keywords?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Caixa de entrada", icon: Inbox, path: "/app", shortcut: "G I", keywords: "inbox entrada" },
  { label: "Hoje", icon: Sun, path: "/app/hoje", shortcut: "G H" },
  { label: "Próximos 7 dias", icon: CalendarClock, path: "/app/proximos" },
  { label: "Atrasadas", icon: AlertTriangle, path: "/app/atrasadas" },
  { label: "Atribuídas a mim", icon: UserCheck, path: "/app/atribuidas" },
  { label: "Calendário", icon: CalendarDays, path: "/app/calendario", shortcut: "G C" },
  { label: "Kanban", icon: KanbanSquare, path: "/app/kanban", shortcut: "G K" },
  { label: "Foco", icon: Target, path: "/app/foco" },
  { label: "Eisenhower", icon: LayoutDashboard, path: "/app/eisenhower" },
  { label: "Hábitos", icon: Zap, path: "/app/habitos" },
  { label: "Plano do dia", icon: ListTodo, path: "/app/plano-do-dia" },
  { label: "Timeline", icon: TrendingUp, path: "/app/timeline" },
  { label: "Tickets", icon: LifeBuoy, path: "/app/atendimento" },
  { label: "Projetos", icon: FolderKanban, path: "/app/projetos", shortcut: "G P" },
  { label: "Aprovações", icon: CheckCheck, path: "/app/aprovacoes" },
  { label: "SLAs", icon: Clock, path: "/app/slas" },
  { label: "Modelos prontos", icon: FileText, path: "/app/templates", keywords: "templates" },
  { label: "Modelos", icon: Shapes, path: "/app/modelos" },
  { label: "Registro de auditoria", icon: History, path: "/app/audit", keywords: "audit log" },
  { label: "Quadros brancos", icon: Network, path: "/app/whiteboards", keywords: "whiteboard" },
  { label: "Squads", icon: Users, path: "/app/squads" },
  { label: "Demandas", icon: ClipboardList, path: "/app/demandas" },
  { label: "Carga de trabalho", icon: BarChart3, path: "/app/workload", keywords: "workload" },
  { label: "Apontamento de horas", icon: Clock, path: "/app/timesheet", keywords: "timesheet" },
  { label: "Mídias", icon: Megaphone, path: "/app/midias" },
  { label: "Calendário editorial", icon: CalendarIcon, path: "/app/social", keywords: "social" },
  { label: "Campanhas", icon: Megaphone, path: "/app/campanhas" },
  { label: "Biblioteca", icon: FolderOpen, path: "/app/biblioteca" },
  { label: "Trechos", icon: FileText, path: "/app/snippets", keywords: "snippets" },
  { label: "Pipeline", icon: Workflow, path: "/app/social/pipeline" },
  { label: "Métricas sociais", icon: LineChart, path: "/app/social/analytics", keywords: "analytics social" },
  { label: "Studio", icon: Palette, path: "/app/social/studio" },
  { label: "Inteligência IA", icon: Brain, path: "/app/social/intel" },
  { label: "Caixa do social", icon: InboxIcon, path: "/app/social/inbox", keywords: "inbox social" },
  { label: "Cadência", icon: Workflow, path: "/app/social/cadencia" },
  { label: "Criadores", icon: Users, path: "/app/social/creators", keywords: "creators" },
  { label: "Link na bio", icon: Globe, path: "/app/social/bio", keywords: "bio" },
  { label: "Boosts e ROAS", icon: Rocket, path: "/app/social/boosts" },
  { label: "Personas", icon: Users, path: "/app/personas" },
  { label: "Gênio", icon: Sparkles, path: "/app/genio", keywords: "gênio growth ia" },
  { label: "Painel", icon: LayoutDashboard, path: "/app/dashboard", keywords: "dashboard" },
  { label: "Relatórios", icon: FileText, path: "/app/reports", keywords: "reports" },
  { label: "Anomalias", icon: AlertTriangle, path: "/app/anomalias" },
  { label: "Previsões", icon: TrendingUp, path: "/app/forecast", keywords: "forecast" },
  { label: "OKRs", icon: Target, path: "/app/okrs" },
  { label: "Visão executiva", icon: Crown, path: "/app/exec", shortcut: "G E", keywords: "executive" },
  { label: "Copiloto IA", icon: Bot, path: "/app/copilot", shortcut: "G O", keywords: "copilot" },
  { label: "Comparativos", icon: BarChart3, path: "/app/benchmarks", keywords: "benchmarks" },
  { label: "Simulações", icon: Brain, path: "/app/simulacoes" },
  { label: "IA proativa", icon: Sparkles, path: "/app/ia-proativa" },
  { label: "Notificações", icon: Bell, path: "/app/notificacoes", shortcut: "G N" },
  { label: "Automações", icon: Workflow, path: "/app/automacoes" },
  { label: "Regras de automação", icon: Workflow, path: "/app/automacoes/regras" },
  { label: "Hub do desenvolvedor", icon: Cog, path: "/app/developer", keywords: "developer" },
  { label: "Marketplace", icon: Star, path: "/app/marketplace" },
  { label: "Comece aqui", icon: Rocket, path: "/app/comecar" },
  { label: "Conquistas", icon: Star, path: "/app/conquistas" },
  { label: "Enterprise", icon: Briefcase, path: "/app/enterprise" },
  { label: "Segurança", icon: Shield, path: "/app/seguranca" },
  { label: "Habilidades", icon: Brain, path: "/app/skills", keywords: "skills" },
  { label: "Capacidade", icon: BarChart3, path: "/app/capacity", keywords: "capacity" },
  { label: "Ajuda", icon: HelpCircle, path: "/app/ajuda" },
  { label: "Atalhos do teclado", icon: Keyboard, path: "/app/atalhos", shortcut: "?" },
  { label: "Buscar", icon: Search, path: "/app/buscar" },
  { label: "Workspaces", icon: Briefcase, path: "/app/workspaces" },
  { label: "Conhecimento (Wiki)", icon: FileText, path: "/app/conhecimento" },
  // Admin
  { label: "Admin · Erros", icon: AlertTriangle, path: "/app/admin/erros" },
  { label: "Admin · Saúde", icon: ShieldCheck, path: "/app/admin/saude" },
];

const SETTINGS_ITEMS: NavItem[] = [
  { label: "Configurações", icon: Settings, path: "/app/configuracoes", shortcut: "G S" },
  { label: "Aparência", icon: Palette, path: "/app/configuracoes/aparencia" },
  { label: "Idioma", icon: Languages, path: "/app/configuracoes/idioma" },
  { label: "Dados", icon: Database, path: "/app/configuracoes/dados" },
  { label: "Integrações", icon: Workflow, path: "/app/configuracoes/integracoes" },
  { label: "Integrações Externas", icon: Globe, path: "/app/configuracoes/integracoes-externas" },
  { label: "Privacidade", icon: Shield, path: "/app/configuracoes/privacidade" },
  { label: "Plano", icon: Crown, path: "/app/configuracoes/plano" },
  { label: "Tipos de tarefa", icon: Shapes, path: "/app/configuracoes/tipos" },
  { label: "Custom Fields", icon: Cog, path: "/app/configuracoes/custom-fields" },
];

const ICON_BY_KEY: Record<string, LucideIcon> = {
  inbox: Inbox,
  plus: Plus,
  bell: Bell,
  timer: Timer,
  target: Target,
  rocket: Rocket,
  calendar: CalendarIcon,
  list: ListTodo,
  folder: FolderKanban,
  users: Users,
  network: Network,
  layout: LayoutDashboard,
  workflow: Workflow,
  briefcase: Briefcase,
  history: History,
  keyboard: Keyboard,
  search: Search,
};

function iconFor(key?: string): LucideIcon {
  if (!key) return Sparkles;
  return ICON_BY_KEY[key] ?? Sparkles;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const { results, loading } = useGlobalSearch(query);
  const { recordCommand, getRecent } = useRecentCommands();
  const { data: recentTasks = [] } = useRecentTasks(5);
  const projectsQuery = useProjects();
  const projects = projectsQuery.data ?? [];
  const wikiSearch = useWikiSearch(query);
  const { flat: wikiPagesFlat } = useWikiPages();
  const startPomodoro = useStartPomodoro();
  const markRead = useMarkRead();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const close = () => onOpenChange(false);

  const runCommand = (
    cmd: Omit<RecentCommand, "executed_at">,
    fn: () => void,
  ) => {
    recordCommand(cmd);
    close();
    // microtask para garantir que o dialog feche antes da navegação
    queueMicrotask(fn);
  };

  const go = (path: string, label: string) => {
    runCommand(
      { id: `nav:${path}`, label, action_type: "navigate", icon: "search" },
      () => navigate(path),
    );
  };

  const recentCommands = useMemo(() => getRecent(5), [getRecent]);
  const showRecent = !query && recentCommands.length > 0;

  const topWikiPages = useMemo(
    () => (wikiPagesFlat ?? []).slice(0, 10),
    [wikiPagesFlat],
  );

  const wikiHits = query.trim().length >= 2 ? wikiSearch.data ?? [] : [];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar ou digitar comando…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[480px]">
        <CommandEmpty>{loading ? "Buscando…" : "Nada encontrado."}</CommandEmpty>

        {showRecent && (
          <>
            <CommandGroup heading="Recentes">
              {recentCommands.map((c) => {
                const Icon = iconFor(c.icon);
                return (
                  <CommandItem
                    key={`recent-${c.id}`}
                    value={`recente ${c.label}`}
                    onSelect={() => {
                      // re-executa: se for navigate, extrai path do id
                      if (c.action_type === "navigate" && c.id.startsWith("nav:")) {
                        const path = c.id.slice(4);
                        runCommand(c, () => navigate(path));
                      } else {
                        // outras ações: só fecha (o usuário pode disparar de novo via menu)
                        close();
                      }
                    }}
                  >
                    <History className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Icon className="mr-2 h-4 w-4" />
                    <span className="flex-1 truncate">{c.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {results.length > 0 && (
          <>
            <CommandGroup heading={`Resultados (${results.length})`}>
              {results.map((r) => {
                const Icon =
                  r.kind === "task"
                    ? CheckSquare
                    : r.kind === "project"
                      ? FolderOpen
                      : Megaphone;
                return (
                  <CommandItem
                    key={`${r.kind}-${r.id}`}
                    onSelect={() =>
                      runCommand(
                        {
                          id: `nav:${r.href}`,
                          label: r.title,
                          action_type: "navigate",
                          icon: "folder",
                        },
                        () => navigate(r.href),
                      )
                    }
                    value={`${r.title} ${r.kind} ${r.id}`}
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{r.title}</span>
                    {r.subtitle && (
                      <span className="text-[10px] text-muted-foreground">
                        {r.subtitle}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Criar">
          <CommandItem
            value="criar nova tarefa novo task"
            onSelect={() =>
              runCommand(
                { id: "create:task", label: "Nova tarefa", action_type: "create", icon: "plus" },
                () => {
                  navigate("/app");
                  toast.info("Foco no Quick Add — pressione Q ou clique no campo no topo da Inbox.");
                },
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova tarefa
            <CommandShortcut>Cmd+N</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="criar novo projeto"
            onSelect={() =>
              runCommand(
                { id: "create:project", label: "Novo projeto", action_type: "create", icon: "folder" },
                () => navigate("/app/projetos"),
              )
            }
          >
            <FolderKanban className="mr-2 h-4 w-4" />
            Novo projeto
          </CommandItem>
          <CommandItem
            value="criar novo squad"
            onSelect={() =>
              runCommand(
                { id: "create:squad", label: "Novo squad", action_type: "create", icon: "users" },
                () => navigate("/app/squads"),
              )
            }
          >
            <Users className="mr-2 h-4 w-4" />
            Novo squad
          </CommandItem>
          <CommandItem
            value="criar nova wiki conhecimento"
            onSelect={() =>
              runCommand(
                { id: "create:wiki", label: "Nova página de wiki", action_type: "create", icon: "folder" },
                () => navigate("/app/conhecimento"),
              )
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            Nova página de wiki
          </CommandItem>
          <CommandItem
            value="criar novo whiteboard"
            onSelect={() =>
              runCommand(
                { id: "create:whiteboard", label: "Novo whiteboard", action_type: "create", icon: "network" },
                () => navigate("/app/whiteboards"),
              )
            }
          >
            <Network className="mr-2 h-4 w-4" />
            Novo whiteboard
          </CommandItem>
          <CommandItem
            value="criar novo dashboard"
            onSelect={() =>
              runCommand(
                { id: "create:dashboard", label: "Novo dashboard", action_type: "create", icon: "layout" },
                () => navigate("/app/dashboard"),
              )
            }
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Novo dashboard
          </CommandItem>
          <CommandItem
            value="criar nova automacao"
            onSelect={() =>
              runCommand(
                { id: "create:automation", label: "Nova automação", action_type: "create", icon: "workflow" },
                () => navigate("/app/automacoes/regras"),
              )
            }
          >
            <Workflow className="mr-2 h-4 w-4" />
            Nova automação
          </CommandItem>
          <CommandItem
            value="criar novo ticket atendimento"
            onSelect={() =>
              runCommand(
                { id: "create:ticket", label: "Novo ticket", action_type: "create", icon: "inbox" },
                () => navigate("/app/atendimento"),
              )
            }
          >
            <Inbox className="mr-2 h-4 w-4" />
            Novo ticket
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações rápidas">
          <CommandItem
            value="pomodoro 25 minutos foco"
            onSelect={() =>
              runCommand(
                { id: "action:pomodoro", label: "Pomodoro 25min", action_type: "action", icon: "timer" },
                () => {
                  startPomodoro.mutate(
                    { planned: 25, breakMinutes: 5 },
                    {
                      onSuccess: () => toast.success("Pomodoro de 25min iniciado."),
                    },
                  );
                },
              )
            }
          >
            <Timer className="mr-2 h-4 w-4" />
            Pomodoro 25min
          </CommandItem>
          <CommandItem
            value="ir foco modo concentracao"
            onSelect={() =>
              runCommand(
                { id: "action:foco", label: "Ir para Foco", action_type: "action", icon: "target" },
                () => navigate("/app/foco"),
              )
            }
          >
            <Target className="mr-2 h-4 w-4" />
            Ir para Foco
          </CommandItem>
          <CommandItem
            value="marcar todas notificacoes como lidas"
            onSelect={() =>
              runCommand(
                { id: "action:mark-all-read", label: "Marcar todas como lidas", action_type: "action", icon: "bell" },
                () => {
                  markRead.mutate(undefined, {
                    onSuccess: () => toast.success("Todas as notificações marcadas como lidas."),
                  });
                },
              )
            }
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como lidas
          </CommandItem>
          <CommandItem
            value="alternar tema dark light"
            onSelect={() =>
              runCommand(
                {
                  id: "action:toggle-theme",
                  label: `Alternar tema (${theme === "dark" ? "claro" : "escuro"})`,
                  action_type: "action",
                  icon: "search",
                },
                () => toggleTheme(),
              )
            }
          >
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Alternar tema ({theme === "dark" ? "claro" : "escuro"})
          </CommandItem>
          <CommandItem
            value="abrir atalhos teclado ajuda"
            onSelect={() =>
              runCommand(
                { id: "action:shortcuts", label: "Ver atalhos do teclado", action_type: "action", icon: "keyboard" },
                () => navigate("/app/atalhos"),
              )
            }
          >
            <Keyboard className="mr-2 h-4 w-4" />
            Ver atalhos do teclado
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {recentTasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tarefas recentes">
              {recentTasks.map((t) => (
                <CommandItem
                  key={`rt-${t.id}`}
                  value={`tarefa ${t.title} ${t.id}`}
                  onSelect={() =>
                    runCommand(
                      {
                        id: `nav:/app?task=${t.id}`,
                        label: t.title,
                        action_type: "navigate",
                        icon: "list",
                      },
                      () =>
                        navigate(
                          t.project_id
                            ? `/app/projetos/${t.project_id}?task=${t.id}`
                            : `/app?task=${t.id}`,
                        ),
                    )
                  }
                >
                  <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{t.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projetos">
              {projects.slice(0, 30).map((p) => (
                <CommandItem
                  key={`proj-${p.id}`}
                  value={`projeto ${p.name}`}
                  onSelect={() =>
                    runCommand(
                      { id: `nav:/app/projetos/${p.id}`, label: p.name, action_type: "navigate", icon: "folder" },
                      () => navigate(`/app/projetos/${p.id}`),
                    )
                  }
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">{p.name}</span>
                  {p.archived && (
                    <span className="text-[10px] text-muted-foreground">arquivado</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading="Wiki">
          {wikiHits.length > 0
            ? wikiHits.slice(0, 10).map((h) => (
                <CommandItem
                  key={`wiki-${h.id}`}
                  value={`wiki ${h.title}`}
                  onSelect={() =>
                    runCommand(
                      { id: `nav:/app/conhecimento/${h.slug}`, label: h.title, action_type: "navigate", icon: "folder" },
                      () => navigate(`/app/conhecimento/${h.slug}`),
                    )
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">{h.title}</span>
                </CommandItem>
              ))
            : topWikiPages.map((p) => (
                <CommandItem
                  key={`wiki-top-${p.id}`}
                  value={`wiki ${p.title}`}
                  onSelect={() =>
                    runCommand(
                      { id: `nav:/app/conhecimento/${p.slug}`, label: p.title, action_type: "navigate", icon: "folder" },
                      () => navigate(`/app/conhecimento/${p.slug}`),
                    )
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">{p.title}</span>
                </CommandItem>
              ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navegação">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => go(item.path, item.label)}
              value={`${item.label} ${item.path} ${item.keywords ?? ""}`}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
              {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Configurações">
          {SETTINGS_ITEMS.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => go(item.path, item.label)}
              value={`config ${item.label} ${item.path}`}
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
