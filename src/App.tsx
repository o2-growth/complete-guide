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
                  element={<Placeholder title="Hoje" description="Smart list com tarefas vencendo hoje + atrasadas." step={5} />}
                />
                <Route
                  path="calendario"
                  element={<Placeholder title="Calendário editorial" description="Mês, semana, dia e agenda — drag para reagendar." step={8} />}
                />
                <Route
                  path="kanban"
                  element={<Placeholder title="Kanban" description="Quadro com auto-assign por status e drag-drop." step={7} />}
                />
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
                <Route
                  path="workload"
                  element={<Placeholder title="Workload" description="Heatmap semanal de carga por pessoa, com drag para realocar." step={11} />}
                />
                <Route
                  path="genio"
                  element={<Placeholder title="Gênio Growth" description="Assistente de IA: copy, classificação, busca semântica e resumos." step={14} />}
                />
                <Route
                  path="configuracoes"
                  element={<Placeholder title="Configurações" description="Tipos de tarefa, integrações, equipe, preferências." step={9} />}
                />
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
