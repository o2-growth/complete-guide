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
  HelpCircle,
  Trophy,
  Grid2X2,
  Sunrise,
  Repeat,
  GanttChartSquare,
  UserCircle,
  BookOpen,
  LifeBuoy,
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
import { ProjectTreeSidebar } from "@/components/layout/ProjectTreeSidebar";

// Sub-fase 6F.5: 6 domínios principais. Comportamento idêntico — todas as URLs
// continuam funcionando; apenas o agrupamento muda para ficar mais escaneável.

const visoes = [
  { title: "Inbox", url: "/app", icon: Inbox, end: true as const },
  { title: "Hoje", url: "/app/hoje", icon: Sun },
  { title: "Próximos 7 dias", url: "/app/proximos", icon: CalendarClock },
  { title: "Atrasadas", url: "/app/atrasadas", icon: AlertTriangle },
  { title: "Atribuídas a mim", url: "/app/atribuidas", icon: UserCheck },
  { title: "Calendário", url: "/app/calendario", icon: CalendarDays },
  { title: "Kanban", url: "/app/kanban", icon: KanbanSquare },
  { title: "Eisenhower", url: "/app/eisenhower", icon: Grid2X2 },
  { title: "Plano do dia", url: "/app/plano-do-dia", icon: Sunrise },
  { title: "Timeline", url: "/app/timeline", icon: GanttChartSquare },
  { title: "Foco", url: "/app/foco", icon: Timer },
  { title: "Hábitos", url: "/app/habitos", icon: Repeat },
];

const trabalho = [
  { title: "Projetos", url: "/app/projetos", icon: FolderKanban },
  { title: "Squads", url: "/app/squads", icon: Users },
  { title: "Demandas", url: "/app/demandas", icon: ClipboardList },
  { title: "Workload", url: "/app/workload", icon: BarChart3 },
  { title: "Timesheet", url: "/app/timesheet", icon: Clock },
  { title: "Skills", url: "/app/skills", icon: Award },
  { title: "Capacity", url: "/app/capacity", icon: CalendarRange },
  { title: "Aprovações", url: "/app/aprovacoes", icon: GitBranch },
  { title: "SLAs", url: "/app/slas", icon: Shield },
  { title: "Modelos", url: "/app/modelos", icon: FileStack },
  { title: "Templates", url: "/app/templates", icon: ListTodo },
  { title: "Tipos de tarefa", url: "/app/configuracoes/tipos", icon: Tag },
  { title: "Whiteboards", url: "/app/whiteboards", icon: Palette },
  { title: "Audit log", url: "/app/audit", icon: History },
];

const atendimento = [
  { title: "Tickets", url: "/app/atendimento", icon: LifeBuoy },
];

const social = [
  { title: "Calendário editorial", url: "/app/social", icon: CalendarRange },
  { title: "Pipeline", url: "/app/social/pipeline", icon: Workflow },
  { title: "Studio", url: "/app/social/studio", icon: Wand2 },
  { title: "Inteligência IA", url: "/app/social/intel", icon: Brain },
  { title: "Inbox social", url: "/app/social/inbox", icon: InboxIcon },
  { title: "Cadência", url: "/app/social/cadencia", icon: Clock },
  { title: "Campanhas", url: "/app/campanhas", icon: Megaphone },
  { title: "Boosts/ROAS", url: "/app/social/boosts", icon: Rocket },
  { title: "Creators", url: "/app/social/creators", icon: UserPlus },
  { title: "Link in bio", url: "/app/social/bio", icon: Link2 },
  { title: "Biblioteca", url: "/app/biblioteca", icon: Library },
  { title: "Snippets", url: "/app/snippets", icon: FileText },
  { title: "Personas", url: "/app/personas", icon: UserCircle },
  { title: "Mídias", url: "/app/midias", icon: ImageIcon },
  { title: "Analytics social", url: "/app/social/analytics", icon: PieChart },
];

const insights = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Reports", url: "/app/reports", icon: FileBarChart },
  { title: "Anomalias", url: "/app/anomalias", icon: AlertOctagon },
  { title: "Forecast", url: "/app/forecast", icon: TrendingUp },
  { title: "OKRs", url: "/app/okrs", icon: Target },
  { title: "Executivo", url: "/app/exec", icon: Crown },
  { title: "Copilot IA", url: "/app/copilot", icon: Bot },
  { title: "Benchmarks", url: "/app/benchmarks", icon: Gauge },
  { title: "Simulações", url: "/app/simulacoes", icon: FlaskConical },
  { title: "IA Proativa", url: "/app/ia-proativa", icon: Sparkles },
  { title: "Gênio", url: "/app/genio", icon: Sparkles },
];

const conhecimento = [
  { title: "Wiki interna", url: "/app/conhecimento", icon: BookOpen },
  { title: "Central de Ajuda", url: "/app/ajuda", icon: HelpCircle },
];

const sistema = [
  { title: "Notificações", url: "/app/notificacoes", icon: Bell },
  { title: "Automações", url: "/app/automacoes", icon: Workflow },
  { title: "Regras (no-code)", url: "/app/automacoes/regras", icon: Zap },
  { title: "Workspaces", url: "/app/workspaces", icon: Building2 },
  { title: "Plano & billing", url: "/app/configuracoes/plano", icon: Crown },
  { title: "Marketplace", url: "/app/marketplace", icon: Store },
  { title: "Developer Hub", url: "/app/developer", icon: Code2 },
  { title: "Conquistas & XP", url: "/app/conquistas", icon: Trophy },
  { title: "Comece aqui", url: "/app/comecar", icon: Compass },
  { title: "Atalhos", url: "/app/atalhos", icon: Keyboard },
  { title: "Busca global", url: "/app/buscar", icon: Search },
  { title: "Enterprise", url: "/app/enterprise", icon: Building2 },
  { title: "Segurança", url: "/app/seguranca", icon: Lock },
  { title: "Privacidade", url: "/app/configuracoes/privacidade", icon: ShieldAlert },
  { title: "Aparência", url: "/app/configuracoes/aparencia", icon: Palette },
  { title: "Idioma", url: "/app/configuracoes/idioma", icon: Languages },
  { title: "Dados", url: "/app/configuracoes/dados", icon: Database },
  { title: "Integrações", url: "/app/configuracoes/integracoes", icon: Plug },
  { title: "Integrações externas", url: "/app/configuracoes/integracoes-externas", icon: Plug },
  { title: "Saúde do sistema", url: "/app/admin/saude", icon: Activity },
  { title: "Erros (admin)", url: "/app/admin/erros", icon: Bug },
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

  const renderGroup = (label: string, items: typeof visoes) => (
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
        <SidebarGroup>
          <SidebarGroupContent>
            <ProjectTreeSidebar collapsed={collapsed} />
          </SidebarGroupContent>
        </SidebarGroup>
        {renderGroup("Atendimento", atendimento)}
        {renderGroup("Mídias sociais", social)}
        {renderGroup("Insights", insights)}
        {renderGroup("Conhecimento", conhecimento)}
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