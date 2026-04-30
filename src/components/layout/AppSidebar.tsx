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
  { title: "Workload", url: "/app/workload", icon: BarChart3 },
  { title: "Skills", url: "/app/skills", icon: Award },
  { title: "Capacity", url: "/app/capacity", icon: CalendarRange },
  { title: "Foco", url: "/app/foco", icon: Timer },
  { title: "Gênio Growth", url: "/app/genio", icon: Sparkles },
];

const sistema = [
  { title: "Tipos de tarefa", url: "/app/configuracoes/tipos", icon: Tag },
  { title: "Integrações", url: "/app/configuracoes/integracoes", icon: Plug },
  { title: "Audit log", url: "/app/audit", icon: History },
  { title: "Configurações", url: "/app/configuracoes", icon: Settings, end: true as const },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

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
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <img src={logoOxy} alt="Oxy" className="h-7 w-7 shrink-0" />
          {!collapsed && (
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="text-sm font-bold tracking-tight truncate">Oxy Growth OS</span>
              <span className="text-[10px] text-sidebar-foreground/60 truncate">por O2 Inc.</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Principal", principal)}
        {renderGroup("Visões", visoes)}
        {renderGroup("Trabalho", trabalho)}
        {renderGroup("Mídias sociais", social)}
        {renderGroup("Insights", insights)}
        {renderGroup("Sistema", sistema)}
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && (
          <p className="px-2 py-1 text-[10px] text-sidebar-foreground/50">
            v1.0 · 29/43
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}