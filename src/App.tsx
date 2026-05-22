import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DEFAULT_QUERY_CLIENT_CONFIG } from "@/lib/query-config";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { I18nProvider } from "@/hooks/useI18n";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import AppHome from "./pages/AppHome.tsx";
import SmartListPage from "./pages/app/SmartListPage.tsx";
const InicioPage = lazy(() => import("./pages/app/InicioPage.tsx"));
const MyWorkPage = lazy(() => import("./pages/app/MyWorkPage.tsx"));
const TaskDetailPage = lazy(() => import("./pages/app/TaskDetailPage.tsx"));

// Code-splitting: tudo que não é entrypoint vai por lazy import.
const KanbanPage = lazy(() => import("./pages/app/KanbanPage.tsx"));
const CalendarPage = lazy(() => import("./pages/app/CalendarPage.tsx"));
const TaskTypesPage = lazy(() => import("./pages/app/TaskTypesPage.tsx"));
const CustomFieldsPage = lazy(() => import("./pages/app/CustomFieldsPage.tsx"));
const FocusPage = lazy(() => import("./pages/app/FocusPage.tsx"));
const WorkloadPage = lazy(() => import("./pages/app/WorkloadPage.tsx"));
const DemandsPage = lazy(() => import("./pages/app/DemandsPage.tsx"));
const MediaPage = lazy(() => import("./pages/app/MediaPage.tsx"));
const GeniusPage = lazy(() => import("./pages/app/GeniusPage.tsx"));
const DashboardPage = lazy(() => import("./pages/app/DashboardPage.tsx"));
const SettingsPage = lazy(() => import("./pages/app/SettingsPage.tsx"));
const SkillsPage = lazy(() => import("./pages/app/SkillsPage.tsx"));
const CapacityPage = lazy(() => import("./pages/app/CapacityPage.tsx"));
const SquadsPage = lazy(() => import("./pages/app/SquadsPage.tsx"));
const ProjectsPage = lazy(() => import("./pages/app/ProjectsPage.tsx"));
const ProjectDetailPage = lazy(() => import("./pages/app/ProjectDetailPage.tsx"));
const ApprovalsPage = lazy(() => import("./pages/app/ApprovalsPage.tsx"));
const SLAPage = lazy(() => import("./pages/app/SLAPage.tsx"));
const TemplatesPage = lazy(() => import("./pages/app/TemplatesPage.tsx"));
const ModelosPage = lazy(() => import("./pages/app/ModelosPage.tsx"));
const AuditLogPage = lazy(() => import("./pages/app/AuditLogPage.tsx"));
const RequestPage = lazy(() => import("./pages/public/RequestPage.tsx"));
const ApprovePage = lazy(() => import("./pages/public/ApprovePage.tsx"));
const SocialApprovePage = lazy(() => import("./pages/public/SocialApprovePage.tsx"));
const SocialCalendarPage = lazy(() => import("./pages/app/SocialCalendarPage.tsx"));
const CampaignsPage = lazy(() => import("./pages/app/CampaignsPage.tsx"));
const MediaLibraryPage = lazy(() => import("./pages/app/MediaLibraryPage.tsx"));
const SnippetsPage = lazy(() => import("./pages/app/SnippetsPage.tsx"));
const SocialPipelinePage = lazy(() => import("./pages/app/SocialPipelinePage.tsx"));
const SocialAnalyticsPage = lazy(() => import("./pages/app/SocialAnalyticsPage.tsx"));
const SocialStudioPage = lazy(() => import("./pages/app/SocialStudioPage.tsx"));
const SocialIntelPage = lazy(() => import("./pages/app/SocialIntelPage.tsx"));
const IntegrationsPage = lazy(() => import("./pages/app/IntegrationsPage.tsx"));
const SocialInboxPage = lazy(() => import("./pages/app/SocialInboxPage.tsx"));
const SocialCadencePage = lazy(() => import("./pages/app/SocialCadencePage.tsx"));
const CampaignReportPage = lazy(() => import("./pages/app/CampaignReportPage.tsx"));
const CreatorsPage = lazy(() => import("./pages/app/CreatorsPage.tsx"));
const BioEditorPage = lazy(() => import("./pages/app/BioEditorPage.tsx"));
const BoostsPage = lazy(() => import("./pages/app/BoostsPage.tsx"));
const PublicBioPage = lazy(() => import("./pages/public/BioPage.tsx"));
const ReportBuilderPage = lazy(() => import("./pages/app/ReportBuilderPage.tsx"));
const AnomaliesPage = lazy(() => import("./pages/app/AnomaliesPage.tsx"));
const ForecastPage = lazy(() => import("./pages/app/ForecastPage.tsx"));
const OKRsPage = lazy(() => import("./pages/app/OKRsPage.tsx"));
const NotificationsPage = lazy(() => import("./pages/app/NotificationsPage.tsx"));
const AutomationsPage = lazy(() => import("./pages/app/AutomationsPage.tsx"));
const ExecutivePage = lazy(() => import("./pages/app/ExecutivePage.tsx"));
const DeveloperHubPage = lazy(() => import("./pages/app/DeveloperHubPage.tsx"));
const CopilotPage = lazy(() => import("./pages/app/CopilotPage.tsx"));
const BenchmarksPage = lazy(() => import("./pages/app/BenchmarksPage.tsx"));
const SimulationsPage = lazy(() => import("./pages/app/SimulationsPage.tsx"));
const ShortcutsPage = lazy(() => import("./pages/app/ShortcutsPage.tsx"));
const AppearancePage = lazy(() => import("./pages/app/AppearancePage.tsx"));
const SearchPage = lazy(() => import("./pages/app/SearchPage.tsx"));
const DataPage = lazy(() => import("./pages/app/DataPage.tsx"));
const AutomationRulesPage = lazy(() => import("./pages/app/AutomationRulesPage.tsx"));
const WorkspacesPage = lazy(() => import("./pages/app/WorkspacesPage.tsx"));
const PlanPage = lazy(() => import("./pages/app/PlanPage.tsx"));
const AcceptInvitePage = lazy(() => import("./pages/public/AcceptInvitePage.tsx"));
const UnsubscribePage = lazy(() => import("./pages/public/UnsubscribePage.tsx"));
const AdminErrorsPage = lazy(() => import("./pages/app/AdminErrorsPage.tsx"));
const AdminHealthPage = lazy(() => import("./pages/app/AdminHealthPage.tsx"));
const LanguagePage = lazy(() => import("./pages/app/LanguagePage.tsx"));
const SecurityPage = lazy(() => import("./pages/app/SecurityPage.tsx"));
const PrivacyPage = lazy(() => import("./pages/app/PrivacyPage.tsx"));
const MarketplacePage = lazy(() => import("./pages/app/MarketplacePage.tsx"));
const StartHerePage = lazy(() => import("./pages/app/StartHerePage.tsx"));
const ExternalIntegrationsPage = lazy(() => import("./pages/app/ExternalIntegrationsPage.tsx"));
const AiCopilotProactivePage = lazy(() => import("./pages/app/AiCopilotProactivePage.tsx"));
const PricingPage = lazy(() => import("./pages/public/PricingPage.tsx"));
const CheckoutPage = lazy(() => import("./pages/public/CheckoutPage.tsx"));
const HelpCenterPage = lazy(() => import("./pages/app/HelpCenterPage.tsx"));
const AchievementsPage = lazy(() => import("./pages/app/AchievementsPage.tsx"));
const EnterprisePage = lazy(() => import("./pages/app/EnterprisePage.tsx"));
const EisenhowerPage = lazy(() => import("./pages/app/EisenhowerPage.tsx"));
const PriorizacaoPage = lazy(() => import("./pages/app/PriorizacaoPage.tsx"));
const PipefyIntegrationPage = lazy(() => import("./pages/app/PipefyIntegrationPage.tsx"));
const HabitsPage = lazy(() => import("./pages/app/HabitsPage.tsx"));
const PlanYourDayPage = lazy(() => import("./pages/app/PlanYourDayPage.tsx"));
const TimelinePage = lazy(() => import("./pages/app/TimelinePage.tsx"));
const ConhecimentoPage = lazy(() => import("./pages/app/ConhecimentoPage.tsx"));
const PersonasPage = lazy(() => import("./pages/app/PersonasPage.tsx"));
const AtendimentoPage = lazy(() => import("./pages/app/AtendimentoPage.tsx"));
const AtendimentoTicketPage = lazy(() => import("./pages/app/AtendimentoTicketPage.tsx"));
const TimesheetPage = lazy(() => import("./pages/app/TimesheetPage.tsx"));
const WhiteboardsPage = lazy(() => import("./pages/app/WhiteboardsPage.tsx"));
const WhiteboardDetailPage = lazy(() => import("./pages/app/WhiteboardDetailPage.tsx"));
import { CalendarClock, AlertTriangle, UserCheck, Sun, UserPlus, Share2, Inbox } from "lucide-react";

const queryClient = new QueryClient(DEFAULT_QUERY_CLIENT_CONFIG);

const PageFallback = () => (
  <div className="flex h-[60vh] items-center justify-center" role="status" aria-live="polite">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Carregando" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
   <ErrorBoundary>
    <ThemeProvider>
      <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/app/inicio" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/solicitar/:slug" element={<RequestPage />} />
              <Route path="/aprovar/:token" element={<ApprovePage />} />
              <Route path="/aprovar-midia/:token" element={<SocialApprovePage />} />
              <Route path="/bio/:slug" element={<PublicBioPage />} />
              <Route path="/aceitar-convite/:token" element={<AcceptInvitePage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
              <Route path="/precos" element={<PricingPage />} />
              <Route path="/checkout/:plan" element={<CheckoutPage />} />
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
                <Route index element={<Navigate to="inicio" replace />} />
                <Route path="inicio" element={<InicioPage />} />
                <Route
                  path="minhas-tarefas"
                  element={
                    <MyWorkPage
                      title="Minhas tarefas"
                      description="Tudo que está com você agora."
                      defaultTab="pending"
                    />
                  }
                />
                <Route
                  path="minhas-tarefas/hoje-atrasadas"
                  element={
                    <MyWorkPage
                      title="Hoje e atrasadas"
                      description="Foco no que vence hoje ou já passou do prazo."
                      defaultTab="pending"
                      withAgenda
                      breadcrumb={[{ label: "Minhas tarefas", to: "/app/minhas-tarefas" }]}
                    />
                  }
                />
                <Route
                  path="lista-pessoal"
                  element={
                    <SmartListPage
                      list="inbox"
                      title="Lista pessoal"
                      description="Deposite tarefas rápidas aqui — sua caixa pessoal."
                      icon={Inbox}
                      showQuickAdd
                    />
                  }
                />
                <Route
                  path="caixa-de-entrada"
                  element={
                    <SmartListPage
                      list="inbox"
                      title="Caixa de entrada"
                      description="Tarefas na sua lista pessoal."
                      icon={Inbox}
                      showQuickAdd
                    />
                  }
                />
                <Route
                  path="comentarios-atribuidos"
                  element={
                    <SmartListPage
                      list="shared_with_me"
                      title="Comentários atribuídos"
                      description="Demandas que outros compartilharam com você."
                      icon={UserCheck}
                    />
                  }
                />
                <Route path="tarefas/:id" element={<TaskDetailPage />} />
                <Route path="home-legado" element={<AppHome />} />
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
                  path="deleguei"
                  element={
                    <SmartListPage
                      list="assigned_by_me"
                      title="Atribuídas por mim"
                      description="Tarefas que você delegou e estão com outras pessoas."
                      icon={UserPlus}
                      emptyTitle="Você não delegou nada"
                      emptyDescription="Quando atribuir uma tarefa a alguém, ela aparece aqui."
                    />
                  }
                />
                <Route
                  path="compartilhadas"
                  element={
                    <SmartListPage
                      list="shared_with_me"
                      title="Compartilhadas comigo"
                      description="Tarefas que outras pessoas atribuíram a você."
                      icon={Share2}
                      emptyTitle="Nada compartilhado"
                      emptyDescription="Tarefas atribuídas a você por colegas aparecem aqui."
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
                <Route path="eisenhower" element={<EisenhowerPage />} />
                <Route path="priorizacao" element={<PriorizacaoPage />} />
                <Route path="configuracoes/integracoes/pipefy" element={<PipefyIntegrationPage />} />
                <Route path="habitos" element={<HabitsPage />} />
                <Route path="plano-do-dia" element={<PlanYourDayPage />} />
                <Route path="timeline" element={<TimelinePage />} />
                <Route path="atendimento" element={<AtendimentoPage />} />
                <Route path="atendimento/:id" element={<AtendimentoTicketPage />} />
                <Route path="projetos" element={<ProjectsPage />} />
                <Route path="projetos/:id" element={<ProjectDetailPage />} />
                <Route path="aprovacoes" element={<ApprovalsPage />} />
                <Route path="slas" element={<SLAPage />} />
                <Route path="templates" element={<TemplatesPage />} />
                <Route path="modelos" element={<ModelosPage />} />
                <Route path="audit" element={<AuditLogPage />} />
                <Route path="whiteboards" element={<WhiteboardsPage />} />
                <Route path="whiteboards/:id" element={<WhiteboardDetailPage />} />
                <Route path="squads" element={<SquadsPage />} />
                <Route path="demandas" element={<DemandsPage />} />
                <Route path="workload" element={<WorkloadPage />} />
                <Route path="timesheet" element={<TimesheetPage />} />
                <Route path="midias" element={<MediaPage />} />
                <Route path="social" element={<SocialCalendarPage />} />
                <Route path="campanhas" element={<CampaignsPage />} />
                <Route path="campanhas/:id" element={<CampaignReportPage />} />
                <Route path="biblioteca" element={<MediaLibraryPage />} />
                <Route path="snippets" element={<SnippetsPage />} />
                <Route path="social/pipeline" element={<SocialPipelinePage />} />
                <Route path="social/analytics" element={<SocialAnalyticsPage />} />
                <Route path="social/studio" element={<SocialStudioPage />} />
                <Route path="social/intel" element={<SocialIntelPage />} />
                <Route path="social/inbox" element={<SocialInboxPage />} />
                <Route path="social/cadencia" element={<SocialCadencePage />} />
                <Route path="social/creators" element={<CreatorsPage />} />
                <Route path="social/bio" element={<BioEditorPage />} />
                <Route path="social/boosts" element={<BoostsPage />} />
                <Route path="personas" element={<PersonasPage />} />
                <Route path="configuracoes/integracoes" element={<IntegrationsPage />} />
                <Route path="genio" element={<GeniusPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="reports" element={<ReportBuilderPage />} />
                <Route path="anomalias" element={<AnomaliesPage />} />
                <Route path="forecast" element={<ForecastPage />} />
                <Route path="okrs" element={<OKRsPage />} />
                <Route path="notificacoes" element={<NotificationsPage />} />
                <Route path="automacoes" element={<AutomationsPage />} />
                <Route path="exec" element={<ExecutivePage />} />
                <Route path="developer" element={<DeveloperHubPage />} />
                <Route path="copilot" element={<CopilotPage />} />
                <Route path="benchmarks" element={<BenchmarksPage />} />
                <Route path="simulacoes" element={<SimulationsPage />} />
                <Route path="skills" element={<SkillsPage />} />
                <Route path="capacity" element={<CapacityPage />} />
                <Route path="atalhos" element={<ShortcutsPage />} />
                <Route path="configuracoes/aparencia" element={<AppearancePage />} />
                <Route path="buscar" element={<SearchPage />} />
                <Route path="configuracoes/dados" element={<DataPage />} />
                <Route path="automacoes/regras" element={<AutomationRulesPage />} />
                <Route path="workspaces" element={<WorkspacesPage />} />
                <Route path="configuracoes/plano" element={<PlanPage />} />
                <Route path="admin/erros" element={<AdminErrorsPage />} />
                <Route path="admin/saude" element={<AdminHealthPage />} />
                <Route path="configuracoes/idioma" element={<LanguagePage />} />
                <Route path="seguranca" element={<SecurityPage />} />
                <Route path="configuracoes/privacidade" element={<PrivacyPage />} />
                <Route path="marketplace" element={<MarketplacePage />} />
                <Route path="comecar" element={<StartHerePage />} />
                <Route path="configuracoes/integracoes-externas" element={<ExternalIntegrationsPage />} />
                <Route path="ia-proativa" element={<AiCopilotProactivePage />} />
                <Route path="ajuda" element={<HelpCenterPage />} />
                <Route path="conhecimento" element={<ConhecimentoPage />} />
                <Route path="conhecimento/:slug" element={<ConhecimentoPage />} />
                <Route path="conquistas" element={<AchievementsPage />} />
                <Route path="enterprise" element={<EnterprisePage />} />
                <Route
                  path="configuracoes"
                  element={<SettingsPage />}
                />
                <Route path="configuracoes/tipos" element={<TaskTypesPage />} />
                <Route path="configuracoes/custom-fields" element={<CustomFieldsPage />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
   </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
