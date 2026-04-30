import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
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
import { CalendarClock, AlertTriangle, UserCheck, Sun } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
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
                <Route
                  path="projetos"
                  element={<Placeholder title="Projetos" description="Hierarquia Squad → Projeto → Tarefas, múltiplas visões." step={7} />}
                />
                <Route
                  path="squads"
                  element={<Placeholder title="Squads" description="IA & Automação, Marketing e Expansão — membros, papéis e workload." step={11} />}
                />
                <Route
                  path="demandas"
                  element={<Placeholder title="Portal de demandas" description="Formulários públicos para solicitantes externos sem licença." step={12} />}
                />
                <Route path="workload" element={<WorkloadPage />} />
                <Route
                  path="genio"
                  element={<Placeholder title="Gênio Growth" description="Assistente de IA: copy, classificação, busca semântica e resumos." step={14} />}
                />
                <Route
                  path="configuracoes"
                  element={<Placeholder title="Configurações" description="Tipos de tarefa, integrações, equipe, preferências." step={9} />}
                />
                <Route path="configuracoes/tipos" element={<TaskTypesPage />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
