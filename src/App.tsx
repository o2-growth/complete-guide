import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { I18nProvider } from "@/hooks/useI18n";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import AppHome from "./pages/AppHome.tsx";
import Placeholder from "./pages/app/Placeholder.tsx";
import SmartListPage from "./pages/app/SmartListPage.tsx";
import KanbanPage from "./pages/app/KanbanPage.tsx";
import CalendarPage from "./pages/app/CalendarPage.tsx";
import TaskTypesPage from "./pages/app/TaskTypesPage.tsx";
import FocusPage from "./pages/app/FocusPage.tsx";
import WorkloadPage from "./pages/app/WorkloadPage.tsx";
import DemandsPage from "./pages/app/DemandsPage.tsx";
import MediaPage from "./pages/app/MediaPage.tsx";
import GeniusPage from "./pages/app/GeniusPage.tsx";
import DashboardPage from "./pages/app/DashboardPage.tsx";
import SettingsPage from "./pages/app/SettingsPage.tsx";
import SkillsPage from "./pages/app/SkillsPage.tsx";
import CapacityPage from "./pages/app/CapacityPage.tsx";
import SquadsPage from "./pages/app/SquadsPage.tsx";
import ProjectsPage from "./pages/app/ProjectsPage.tsx";
import ProjectDetailPage from "./pages/app/ProjectDetailPage.tsx";
import ApprovalsPage from "./pages/app/ApprovalsPage.tsx";
import SLAPage from "./pages/app/SLAPage.tsx";
import TemplatesPage from "./pages/app/TemplatesPage.tsx";
import AuditLogPage from "./pages/app/AuditLogPage.tsx";
import RequestPage from "./pages/public/RequestPage.tsx";
import ApprovePage from "./pages/public/ApprovePage.tsx";
import SocialApprovePage from "./pages/public/SocialApprovePage.tsx";
import SocialCalendarPage from "./pages/app/SocialCalendarPage.tsx";
import CampaignsPage from "./pages/app/CampaignsPage.tsx";
import MediaLibraryPage from "./pages/app/MediaLibraryPage.tsx";
import { CalendarClock, AlertTriangle, UserCheck, Sun } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/solicitar/:slug" element={<RequestPage />} />
              <Route path="/aprovar/:token" element={<ApprovePage />} />
              <Route path="/aprovar-midia/:token" element={<SocialApprovePage />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AppHome />} />
                <Route
                  path="hoje"
                  element={
                    <SmartListPage
                      list="today"
                      title="Hoje"
                      description="Tarefas que vencem hoje. Foco no que importa agora."
                      icon={Sun}
                      showQuickAdd
                      emptyTitle="Sem tarefas para hoje"
                      emptyDescription="Aproveite — ou puxe algo do backlog."
                    />
                  }
                />
                <Route
                  path="proximos"
                  element={
                    <SmartListPage
                      list="next7"
                      title="Próximos 7 dias"
                      description="Tudo o que vence na próxima semana."
                      icon={CalendarClock}
                    />
                  }
                />
                <Route
                  path="atrasadas"
                  element={
                    <SmartListPage
                      list="overdue"
                      title="Atrasadas"
                      description="Tarefas com prazo vencido. Reagende ou conclua."
                      icon={AlertTriangle}
                      emptyTitle="Nada atrasado 🎉"
                      emptyDescription="Você está em dia."
                    />
                  }
                />
                <Route
                  path="atribuidas"
                  element={
                    <SmartListPage
                      list="assigned"
                      title="Atribuídas a mim"
                      description="Todas as tarefas que estão com você no momento."
                      icon={UserCheck}
                    />
                  }
                />
                <Route
                  path="calendario"
                  element={<CalendarPage />}
                />
                <Route
                  path="kanban"
                  element={<KanbanPage />}
                />
                <Route path="foco" element={<FocusPage />} />
                <Route path="projetos" element={<ProjectsPage />} />
                <Route path="projetos/:id" element={<ProjectDetailPage />} />
                <Route path="aprovacoes" element={<ApprovalsPage />} />
                <Route path="slas" element={<SLAPage />} />
                <Route path="templates" element={<TemplatesPage />} />
                <Route path="audit" element={<AuditLogPage />} />
                <Route path="squads" element={<SquadsPage />} />
                <Route path="demandas" element={<DemandsPage />} />
                <Route path="workload" element={<WorkloadPage />} />
                <Route path="midias" element={<MediaPage />} />
                <Route path="social" element={<SocialCalendarPage />} />
                <Route path="campanhas" element={<CampaignsPage />} />
                <Route path="biblioteca" element={<MediaLibraryPage />} />
                <Route path="genio" element={<GeniusPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="skills" element={<SkillsPage />} />
                <Route path="capacity" element={<CapacityPage />} />
                <Route
                  path="configuracoes"
                  element={<SettingsPage />}
                />
                <Route path="configuracoes/tipos" element={<TaskTypesPage />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
