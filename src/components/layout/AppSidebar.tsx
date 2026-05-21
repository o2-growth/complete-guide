import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Inbox,
  Home,
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
  Share2,
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
  Briefcase,
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
  Star,
  ChevronRight,
  GripVertical,
  type LucideIcon,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { Button } from "@/components/ui/button";
import logoOxy from "@/assets/logo-oxy.png";
import { useBranding } from "@/hooks/useBranding";
import { useSavedViews } from "@/hooks/useGlobalSearchAdvanced";
import { useSidebarPrefs } from "@/hooks/useSidebarPrefs";
import { useRecentPages } from "@/hooks/useRecentPages";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProjectTreeSidebar } from "@/components/layout/ProjectTreeSidebar";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  // ── Core: visível por padrão ────────────────────────────────────────────────
  {
    id: "visoes",
    label: "Visões",
    items: [
      { title: "Resumo", url: "/app", icon: Home, end: true },
      { title: "Hoje", url: "/app/hoje", icon: Sun },
      { title: "Próximos 7 dias", url: "/app/proximos", icon: CalendarClock },
      { title: "Atrasadas", url: "/app/atrasadas", icon: AlertTriangle },
      { title: "Atribuídas a mim", url: "/app/atribuidas", icon: UserCheck },
      { title: "Atribuídas por mim", url: "/app/deleguei", icon: UserPlus },
      { title: "Compartilhadas comigo", url: "/app/compartilhadas", icon: Share2 },
      { title: "Calendário", url: "/app/calendario", icon: CalendarDays },
      { title: "Kanban", url: "/app/kanban", icon: KanbanSquare },
      { title: "Foco", url: "/app/foco", icon: Timer },
      { title: "Timeline", url: "/app/timeline", icon: GanttChartSquare },
      { title: "Eisenhower", url: "/app/eisenhower", icon: Grid2X2 },
      { title: "Plano do dia", url: "/app/plano-do-dia", icon: Sunrise },
      { title: "Hábitos", url: "/app/habitos", icon: Repeat },
    ],
  },
  {
    id: "trabalho",
    label: "Trabalho",
    items: [
      { title: "Projetos", url: "/app/projetos", icon: FolderKanban },
      { title: "Squads", url: "/app/squads", icon: Users },
      { title: "Carga de trabalho", url: "/app/workload", icon: BarChart3 },
      { title: "Apontamento de horas", url: "/app/timesheet", icon: Clock },
      { title: "Habilidades", url: "/app/skills", icon: Award },
      { title: "Capacidade", url: "/app/capacity", icon: CalendarRange },
      { title: "Quadros brancos", url: "/app/whiteboards", icon: Palette },
    ],
  },
  {
    id: "insights-basicos",
    label: "Insights",
    items: [
      { title: "Painel", url: "/app/dashboard", icon: LayoutDashboard },
      { title: "Relatórios", url: "/app/reports", icon: FileBarChart },
    ],
  },
  {
    id: "sistema-core",
    label: "Sistema",
    items: [
      { title: "Notificações", url: "/app/notificacoes", icon: Bell },
      { title: "Configurações", url: "/app/configuracoes", icon: Settings, end: true },
    ],
  },
  // ── Não-core: recolhido por padrão ─────────────────────────────────────────
  {
    id: "midias-sociais",
    label: "Mídias Sociais",
    items: [
      { title: "Calendário editorial", url: "/app/social", icon: CalendarRange },
      { title: "Pipeline", url: "/app/social/pipeline", icon: Workflow },
      { title: "Studio", url: "/app/social/studio", icon: Wand2 },
      { title: "Inteligência IA", url: "/app/social/intel", icon: Brain },
      { title: "Caixa do social", url: "/app/social/inbox", icon: InboxIcon },
      { title: "Cadência", url: "/app/social/cadencia", icon: Clock },
      { title: "Campanhas", url: "/app/campanhas", icon: Megaphone },
      { title: "Boosts e ROAS", url: "/app/social/boosts", icon: Rocket },
      { title: "Criadores", url: "/app/social/creators", icon: UserPlus },
      { title: "Link na bio", url: "/app/social/bio", icon: Link2 },
      { title: "Biblioteca", url: "/app/biblioteca", icon: Library },
      { title: "Trechos", url: "/app/snippets", icon: FileText },
      { title: "Personas", url: "/app/personas", icon: UserCircle },
      { title: "Mídias", url: "/app/midias", icon: ImageIcon },
      { title: "Métricas sociais", url: "/app/social/analytics", icon: PieChart },
    ],
  },
  {
    id: "insights-avancados",
    label: "Insights Avançados",
    items: [
      { title: "Anomalias", url: "/app/anomalias", icon: AlertOctagon },
      { title: "Previsões", url: "/app/forecast", icon: TrendingUp },
      { title: "OKRs", url: "/app/okrs", icon: Target },
      { title: "Visão executiva", url: "/app/exec", icon: Crown },
      { title: "Copiloto IA", url: "/app/copilot", icon: Bot },
      { title: "Comparativos", url: "/app/benchmarks", icon: Gauge },
      { title: "Simulações", url: "/app/simulacoes", icon: FlaskConical },
      { title: "IA proativa", url: "/app/ia-proativa", icon: Sparkles },
      { title: "Gênio", url: "/app/genio", icon: Sparkles },
    ],
  },
  {
    id: "atendimento",
    label: "Atendimento",
    items: [
      { title: "Demandas", url: "/app/demandas", icon: ClipboardList },
      { title: "Aprovações", url: "/app/aprovacoes", icon: GitBranch },
      { title: "SLAs", url: "/app/slas", icon: Shield },
      { title: "Tickets", url: "/app/atendimento", icon: LifeBuoy },
    ],
  },
  {
    id: "conhecimento",
    label: "Conhecimento",
    items: [
      { title: "Modelos", url: "/app/modelos", icon: FileStack },
      { title: "Modelos prontos", url: "/app/templates", icon: ListTodo },
      { title: "Tipos de tarefa", url: "/app/configuracoes/tipos", icon: Tag },
      { title: "Registro de auditoria", url: "/app/audit", icon: History },
      { title: "Wiki interna", url: "/app/conhecimento", icon: BookOpen },
      { title: "Central de ajuda", url: "/app/ajuda", icon: HelpCircle },
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    items: [
      { title: "Enterprise", url: "/app/enterprise", icon: Briefcase },
      { title: "Segurança", url: "/app/seguranca", icon: Lock },
      { title: "Privacidade", url: "/app/configuracoes/privacidade", icon: ShieldAlert },
      { title: "Saúde do sistema", url: "/app/admin/saude", icon: Activity },
      { title: "Erros (admin)", url: "/app/admin/erros", icon: Bug },
    ],
  },
  {
    id: "developer",
    label: "Developer Hub",
    items: [
      { title: "Hub do desenvolvedor", url: "/app/developer", icon: Code2 },
      { title: "Automações", url: "/app/automacoes", icon: Workflow },
      { title: "Regras (no-code)", url: "/app/automacoes/regras", icon: Zap },
      { title: "Integrações", url: "/app/configuracoes/integracoes", icon: Plug },
      { title: "Integrações externas", url: "/app/configuracoes/integracoes-externas", icon: Plug },
      { title: "Dados", url: "/app/configuracoes/dados", icon: Database },
    ],
  },
  {
    id: "gamificacao",
    label: "Gamificação",
    items: [
      { title: "Conquistas e XP", url: "/app/conquistas", icon: Trophy },
      { title: "Comece aqui", url: "/app/comecar", icon: Compass },
      { title: "Atalhos", url: "/app/atalhos", icon: Keyboard },
      { title: "Busca global", url: "/app/buscar", icon: Search },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    items: [
      { title: "Marketplace", url: "/app/marketplace", icon: Store },
      { title: "Plano e faturamento", url: "/app/configuracoes/plano", icon: Crown },
      { title: "Workspaces", url: "/app/workspaces", icon: Building2 },
      { title: "Aparência", url: "/app/configuracoes/aparencia", icon: Palette },
      { title: "Idioma", url: "/app/configuracoes/idioma", icon: Languages },
    ],
  },
];

const ALL_ITEMS_BY_PATH: Map<string, NavItem> = new Map(
  GROUPS.flatMap((g) => g.items).map((i) => [i.url, i] as [string, NavItem]),
);

function applyCustomOrder(items: NavItem[], order?: string[]): NavItem[] {
  if (!order || order.length === 0) return items;
  const byPath = new Map(items.map((i) => [i.url, i] as [string, NavItem]));
  const ordered: NavItem[] = [];
  for (const url of order) {
    const item = byPath.get(url);
    if (item) {
      ordered.push(item);
      byPath.delete(url);
    }
  }
  return [...ordered, ...byPath.values()];
}

interface SidebarItemRowProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  isFavorite: boolean;
  onToggleFavorite: (path: string) => void;
  draggable?: boolean;
  showDragHandle?: boolean;
}

function SidebarItemRow({
  item,
  active,
  collapsed,
  isFavorite,
  onToggleFavorite,
  draggable,
  showDragHandle,
}: SidebarItemRowProps) {
  const sortable = useSortable({
    id: item.url,
    disabled: !draggable,
  });
  const style = draggable
    ? {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <SidebarMenuItem
      ref={draggable ? sortable.setNodeRef : undefined}
      style={style}
      className="group/item"
    >
      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
        <NavLink
          to={item.url}
          end={item.end}
          className="relative"
          style={{ paddingTop: "var(--density-row-pad-y)", paddingBottom: "var(--density-row-pad-y)" }}
        >
          {showDragHandle && !collapsed && (
            <button
              type="button"
              aria-label="Reordenar"
              className="absolute left-0 -ml-1 hidden h-4 w-4 cursor-grab text-sidebar-foreground/40 opacity-0 transition-opacity group-hover/item:opacity-100 md:block"
              {...sortable.attributes}
              {...sortable.listeners}
              onClick={(e) => e.preventDefault()}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          )}
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.title}</span>
          {!collapsed && (
            <button
              type="button"
              aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(item.url);
              }}
              className={cn(
                "ml-auto flex h-5 w-5 items-center justify-center rounded text-sidebar-foreground/40 transition-opacity hover:text-sidebar-foreground/80",
                isFavorite
                  ? "opacity-100 text-amber-400 hover:text-amber-300"
                  : "opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100",
              )}
            >
              <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
            </button>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

interface CollapsibleGroupProps {
  group: NavGroup;
  collapsed: boolean;
  collapsedGroup: boolean;
  onToggleCollapsed: () => void;
  isFavorite: (path: string) => boolean;
  onToggleFavorite: (path: string) => void;
  customOrder?: string[];
  onReorder: (order: string[]) => void;
  pathname: string;
  enableDnd: boolean;
}

function CollapsibleGroup({
  group,
  collapsed,
  collapsedGroup,
  onToggleCollapsed,
  isFavorite,
  onToggleFavorite,
  customOrder,
  onReorder,
  pathname,
  enableDnd,
}: CollapsibleGroupProps) {
  const items = useMemo(
    () => applyCustomOrder(group.items, customOrder),
    [group.items, customOrder],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const isActive = (url: string, end?: boolean) =>
    end ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.url === active.id);
    const newIndex = items.findIndex((i) => i.url === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered.map((i) => i.url));
  };

  return (
    <SidebarGroup>
      {!collapsed && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsedGroup}
          aria-controls={`group-${group.id}`}
          className="flex w-full items-center justify-between px-2 py-1 text-xs font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground/90 transition-colors"
        >
          <span className="flex items-center gap-1">
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform",
                !collapsedGroup && "rotate-90",
              )}
            />
            {group.label}
          </span>
          <span className="text-[10px] tabular-nums text-sidebar-foreground/40">
            {group.items.length}
          </span>
        </button>
      )}
      {(!collapsedGroup || collapsed) && (
        <SidebarGroupContent id={`group-${group.id}`} role="group" aria-label={group.label}>
          {enableDnd && !collapsed ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.url)}
                strategy={verticalListSortingStrategy}
              >
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarItemRow
                      key={item.url}
                      item={item}
                      active={isActive(item.url, item.end)}
                      collapsed={collapsed}
                      isFavorite={isFavorite(item.url)}
                      onToggleFavorite={onToggleFavorite}
                      draggable
                      showDragHandle
                    />
                  ))}
                </SidebarMenu>
              </SortableContext>
            </DndContext>
          ) : (
            <SidebarMenu>
              {items.map((item) => (
                <SidebarItemRow
                  key={item.url}
                  item={item}
                  active={isActive(item.url, item.end)}
                  collapsed={collapsed}
                  isFavorite={isFavorite(item.url)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </SidebarMenu>
          )}
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const branding = useBranding();
  const { data: savedViews = [] } = useSavedViews();
  const pinnedViews = savedViews.filter((v) => v.pinned);
  const isMobile = useIsMobile();
  const {
    favorites,
    customOrder,
    toggleFavorite,
    toggleGroupCollapsed,
    reorderItems,
    isFavorite,
    isGroupCollapsed,
  } = useSidebarPrefs();
  const { recents } = useRecentPages(5);

  const isActive = (url: string, end?: boolean) =>
    end ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const favoriteItems = useMemo(() => {
    const order = customOrder.favorites;
    const items = favorites
      .map((path) => ALL_ITEMS_BY_PATH.get(path))
      .filter((i): i is NavItem => Boolean(i));
    return applyCustomOrder(items, order);
  }, [favorites, customOrder.favorites]);

  const recentItems = useMemo(
    () =>
      recents
        .map((r) => ALL_ITEMS_BY_PATH.get(r.path))
        .filter((i): i is NavItem => Boolean(i)),
    [recents],
  );

  const enableDnd = !isMobile && !collapsed;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleFavoritesDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = favoriteItems.findIndex((i) => i.url === active.id);
    const newIndex = favoriteItems.findIndex((i) => i.url === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(favoriteItems, oldIndex, newIndex);
    reorderItems("favorites", reordered.map((i) => i.url));
  };

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent("oxy:open-palette"));
  };

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
        {!collapsed && (
          <div className="px-2 pb-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={openCommandPalette}
              className="h-8 w-full justify-start gap-2 bg-sidebar-accent/40 px-2 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Buscar...</span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar/80 px-1.5 font-mono text-[10px] font-medium text-sidebar-foreground/60 sm:inline-flex">
                ⌘K
              </kbd>
            </Button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {favoriteItems.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="flex items-center gap-1.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                Favoritos
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              {enableDnd ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleFavoritesDragEnd}
                >
                  <SortableContext
                    items={favoriteItems.map((i) => i.url)}
                    strategy={verticalListSortingStrategy}
                  >
                    <SidebarMenu>
                      {favoriteItems.map((item) => (
                        <SidebarItemRow
                          key={item.url}
                          item={item}
                          active={isActive(item.url, item.end)}
                          collapsed={collapsed}
                          isFavorite
                          onToggleFavorite={toggleFavorite}
                          draggable
                          showDragHandle
                        />
                      ))}
                    </SidebarMenu>
                  </SortableContext>
                </DndContext>
              ) : (
                <SidebarMenu>
                  {favoriteItems.map((item) => (
                    <SidebarItemRow
                      key={item.url}
                      item={item}
                      active={isActive(item.url, item.end)}
                      collapsed={collapsed}
                      isFavorite
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {recentItems.length > 0 && !collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Recentes
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentItems.map((item) => (
                  <SidebarMenuItem key={`recent-${item.url}`}>
                    <SidebarMenuButton asChild tooltip={item.title} size="sm">
                      <NavLink to={item.url} end={item.end}>
                        <item.icon className="h-3.5 w-3.5 text-sidebar-foreground/60" />
                        <span className="truncate text-xs">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {pinnedViews.length > 0 && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel>Views salvas</SidebarGroupLabel>}
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

        {GROUPS.map((group) => (
          <div key={group.id}>
            <CollapsibleGroup
              group={group}
              collapsed={collapsed}
              collapsedGroup={isGroupCollapsed(group.id)}
              onToggleCollapsed={() => toggleGroupCollapsed(group.id)}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              customOrder={customOrder[group.id]}
              onReorder={(order) => reorderItems(group.id, order)}
              pathname={pathname}
              enableDnd={enableDnd}
            />
            {group.id === "trabalho" && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <ProjectTreeSidebar collapsed={collapsed} />
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && (
          <p className="px-2 py-1 text-[10px] text-sidebar-foreground/50">
            v1.0 · 43/43
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
