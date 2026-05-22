import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Inbox,
  MessageSquare,
  ListTodo,
  UserCheck,
  CalendarClock,
  Star,
  ChevronDown,
  ChevronRight,
  Settings,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ProjectTreeSidebar } from "@/components/layout/ProjectTreeSidebar";
import { useBranding } from "@/hooks/useBranding";
import { useSeedClickUpSpaces } from "@/hooks/useSeedClickUpSpaces";
import logoOxy from "@/assets/logo-oxy.png";
import { cn } from "@/lib/utils";

export function ClickUpSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { logoUrl } = useBranding();
  const [minhasOpen, setMinhasOpen] = useState(true);
  const [espacosOpen, setEspacosOpen] = useState(true);

  useSeedClickUpSpaces();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border/60 p-3">
        <NavLink to="/app/inicio" className="flex items-center gap-2">
          <img
            src={logoUrl || logoOxy}
            alt="Oxy"
            className={cn("rounded", collapsed ? "h-7 w-7" : "h-8 w-auto max-w-[120px]")}
          />
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Início" isActive={location.pathname === "/app/inicio"}>
                  <NavLink to="/app/inicio">
                    <Home className="h-4 w-4" />
                    <span>Início</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Caixa de entrada">
                  <NavLink to="/app/caixa-de-entrada">
                    <Inbox className="h-4 w-4" />
                    <span>Caixa de entrada</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Comentários atribuídos">
                  <NavLink to="/app/comentarios-atribuidos">
                    <MessageSquare className="h-4 w-4" />
                    <span>Comentários atribuídos</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible open={minhasOpen} onOpenChange={setMinhasOpen}>
            <div className="flex items-center justify-between px-2">
              <CollapsibleTrigger className="flex flex-1 items-center gap-1 rounded px-1 py-1 text-xs font-semibold text-sidebar-foreground/70 hover:bg-sidebar-accent">
                {minhasOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <ListTodo className="h-3.5 w-3.5" />
                {!collapsed && <span>Minhas tarefas</span>}
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild isActive={location.pathname === "/app/minhas-tarefas"}>
                    <NavLink to="/app/minhas-tarefas">
                      <UserCheck className="h-3.5 w-3.5" />
                      Atribuídas a mim
                    </NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild isActive={location.pathname === "/app/minhas-tarefas/hoje-atrasadas"}>
                    <NavLink to="/app/minhas-tarefas/hoje-atrasadas">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Hoje e atrasadas
                    </NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild isActive={location.pathname === "/app/lista-pessoal"}>
                    <NavLink to="/app/lista-pessoal">
                      <Star className="h-3.5 w-3.5" />
                      Lista pessoal
                    </NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible open={espacosOpen} onOpenChange={setEspacosOpen}>
            <div className="flex items-center justify-between px-2">
              <CollapsibleTrigger className="flex flex-1 items-center gap-1 rounded px-1 py-1 text-xs font-semibold text-sidebar-foreground/70 hover:bg-sidebar-accent">
                {espacosOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {!collapsed && <span>Espaços</span>}
              </CollapsibleTrigger>
              {!collapsed && (
                <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Novo espaço" asChild>
                  <NavLink to="/app/squads">
                    <Plus className="h-3 w-3" />
                  </NavLink>
                </Button>
              )}
            </div>
            <CollapsibleContent>
              <ProjectTreeSidebar collapsed={collapsed} hideHeader />
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-2">
        {!collapsed && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="sm">
                <NavLink to="/app/configuracoes">
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="sm">
                <NavLink to="/app/atalhos">
                  <MoreHorizontal className="h-4 w-4" />
                  <span>Mais ferramentas</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
