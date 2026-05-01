import { NavLink, useLocation } from "react-router-dom";
import {
  Inbox,
  CalendarDays,
  KanbanSquare,
  ListTodo,
  Users,
  BarChart3,
  Sparkles,
  Settings,
  FolderKanban,
  ClipboardList,
  Sun,
  CalendarClock,
  AlertTriangle,
  UserCheck,
  Tag,
  Timer,
  ImageIcon,
  LayoutDashboard,
  Award,
  CalendarRange,
  GitBranch,
  Shield,
  FileStack,
  History,
  Megaphone,
  Library,
  Workflow,
  FileText,
  PieChart,
  Wand2,
  Brain,
  Plug,
  Inbox as InboxIcon,
  Clock,
  Link2,
  Rocket,
  UserPlus,
  FileBarChart,
  AlertOctagon,
  TrendingUp,
  Target,
  Crown,
  Bell,
  Code2,
  Bot,
  Gauge,
  FlaskConical,
  Keyboard,
  Palette,
  Search,
  Database,
  Pin,
  Building2,
  Zap,
  Activity,
  Bug,
  Languages,
  Lock,
  ShieldAlert,
  Store,
  Compass,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import logoOxy from "@/assets/logo-oxy.png";
import { useBranding } from "@/hooks/useBranding";
import { useSavedViews } from "@/hooks/useGlobalSearchAdvanced";

const principal = [
  { title: "Inbox", url: "/app", icon: Inbox, end: true as const },
  { title: "Hoje", url: "/app/hoje", icon: Sun },
  { title: "Próximos 7", url: "/app/proximos", icon: CalendarClock },
  { title: "Atrasadas", url: "/app/atrasadas", icon: AlertTriangle },
  { title: "Atribuídas", url: "/app/atribuidas", icon: UserCheck },
];

const visoes = [
  { title: "Calendário", url: "/app/calendario", icon: CalendarDays },
  { title: "Kanban", url: "/app/kanban", icon: KanbanSquare },
  { title: "Lista", url: "/app/projetos", icon: ListTodo },
];

const trabalho = [
  { title: "Projetos", url: "/app/projetos", icon: FolderKanban },
  { title: "Templates", url: "/app/templates", icon: FileStack },
  { title: "Squads", url: "/app/squads", icon: Users },
  { title: "Demandas", url: "/app/demandas", icon: ClipboardList },
  { title: "Aprovações", url: "/app/aprovacoes", icon: GitBranch },
  { title: "SLAs", url: "/app/slas", icon: Shield },
  { title: "Mídias (previews)", url: "/app/midias", icon: ImageIcon },
];

const social = [
  { title: "Calendário editorial", url: "/app/social", icon: CalendarRange },
  { title: "Inbox social", url: "/app/social/inbox", icon: InboxIcon },
  { title: "Cadência", url: "/app/social/cadencia", icon: Clock },
  { title: "Studio criativo", url: "/app/social/studio", icon: Wand2 },
  { title: "Pipeline de produção", url: "/app/social/pipeline", icon: Workflow },
  { title: "Inteligência IA", url: "/app/social/intel", icon: Brain },
  { title: "Analytics", url: "/app/social/analytics", icon: PieChart },
  { title: "Campanhas", url: "/app/campanhas", icon: Megaphone },
  { title: "Boost manager", url: "/app/social/boosts", icon: Rocket },
  { title: "Creators & UGC", url: "/app/social/creators", icon: UserPlus },
  { title: "Link-in-bio", url: "/app/social/bio", icon: Link2 },
  { title: "Biblioteca de mídia", url: "/app/biblioteca", icon: Library },
  { title: "Legendas & hashtags", url: "/app/snippets", icon: FileText },
];

const insights = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Executive", url: "/app/exec", icon: Crown },
  { title: "Copilot IA", url: "/app/copilot", icon: Bot },
  { title: "Benchmarks", url: "/app/benchmarks", icon: Gauge },
  { title: "Simulações", url: "/app/simulacoes", icon: FlaskConical },
  { title: "Report Builder", url: "/app/reports", icon: FileBarChart },
  { title: "Forecast IA", url: "/app/forecast", icon: TrendingUp },
  { title: "Goals & OKRs", url: "/app/okrs", icon: Target },
  { title: "Anomalias IA", url: "/app/anomalias", icon: AlertOctagon },
  { title: "Workload", url: "/app/workload", icon: BarChart3 },
  { title: "Skills", url: "/app/skills", icon: Award },
  { title: "Capacity", url: "/app/capacity", icon: CalendarRange },
  { title: "Foco", url: "/app/foco", icon: Timer },
  { title: "Gênio Growth", url: "/app/genio", icon: Sparkles },
];

const sistema = [
  { title: "Notificações", url: "/app/notificacoes", icon: Bell },
  { title: "Comece aqui", url: "/app/comecar", icon: Compass },
  { title: "Automações", url: "/app/automacoes", icon: Workflow },
  { title: "Regras (no-code)", url: "/app/automacoes/regras", icon: Zap },
  { title: "Workspaces", url: "/app/workspaces", icon: Building2 },
  { title: "Plano & billing", url: "/app/configuracoes/plano", icon: Crown },
  { title: "Marketplace", url: "/app/marketplace", icon: Store },
  { title: "Developer Hub", url: "/app/developer", icon: Code2 },
  { title: "Busca global", url: "/app/buscar", icon: Search },
  { title: "Dados (import/export)", url: "/app/configuracoes/dados", icon: Database },
  { title: "Segurança (2FA)", url: "/app/seguranca", icon: Lock },
  { title: "Privacidade (LGPD)", url: "/app/configuracoes/privacidade", icon: ShieldAlert },
  { title: "Saúde do sistema", url: "/app/admin/saude", icon: Activity },
  { title: "Erros (admin)", url: "/app/admin/erros", icon: Bug },
  { title: "Atalhos", url: "/app/atalhos", icon: Keyboard },
  { title: "Aparência", url: "/app/configuracoes/aparencia", icon: Palette },
  { title: "Idioma", url: "/app/configuracoes/idioma", icon: Languages },
  { title: "Tipos de tarefa", url: "/app/configuracoes/tipos", icon: Tag },
  { title: "Integrações", url: "/app/configuracoes/integracoes", icon: Plug },
  { title: "Audit log", url: "/app/audit", icon: History },
  { title: "Configurações", url: "/app/configuracoes", icon: Settings, end: true as const },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const branding = useBranding();
  const { data: savedViews = [] } = useSavedViews();
  const pinnedViews = savedViews.filter((v) => v.pinned);

  const isActive = (url: string, end?: boolean) =>
    end ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const renderGroup = (label: string, items: typeof principal) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url, item.end);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <NavLink to={item.url} end={item.end}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader data-tour="sidebar">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <img
            src={branding.logoUrl || logoOxy}
            alt={branding.workspaceName || "Oxy"}
            className="h-7 w-7 shrink-0 rounded object-contain"
          />
          {!collapsed && (
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="text-sm font-bold tracking-tight truncate">
                {branding.workspaceName || "Oxy Growth OS"}
              </span>
              <span className="text-[10px] text-sidebar-foreground/60 truncate">por O2 Inc.</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Principal", principal)}
        {renderGroup("Visões", visoes)}
        {pinnedViews.length > 0 && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel>Saved Views</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {pinnedViews.map((v) => {
                  const url = `/app/buscar?view=${v.id}`;
                  return (
                    <SidebarMenuItem key={v.id}>
                      <SidebarMenuButton asChild tooltip={v.name}>
                        <NavLink to={url}>
                          <Pin
                            className="h-4 w-4"
                            style={v.color ? { color: v.color } : undefined}
                          />
                          <span className="truncate">{v.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {renderGroup("Trabalho", trabalho)}
        {renderGroup("Mídias sociais", social)}
        {renderGroup("Insights", insights)}
        {renderGroup("Sistema", sistema)}
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && (
          <p className="px-2 py-1 text-[10px] text-sidebar-foreground/50">
            v1.0 · 40/43
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}