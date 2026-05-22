import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";

import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
const HomePage = lazy(() => import("@/pages/app/HomePage"));
const ListPage = lazy(() => import("@/pages/app/ListPage"));
const MyTasksPage = lazy(() => import("@/pages/app/MyTasksPage"));
const SettingsPage = lazy(() => import("@/pages/app/SettingsPage"));
const AcceptInvitePage = lazy(() => import("@/pages/public/AcceptInvitePage"));
const UnsubscribePage = lazy(() => import("@/pages/public/UnsubscribePage"));

const qc = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30_000 } },
});

const Fallback = () => (
  <div className="flex h-full min-h-[40vh] items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider delayDuration={150}>
              <Toaster richColors closeButton position="top-right" />
              <BrowserRouter>
                <Suspense fallback={<Fallback />}>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/invite/:token" element={<AcceptInvitePage />} />
                    <Route path="/unsubscribe" element={<UnsubscribePage />} />
                    <Route path="/" element={<Navigate to="/app" replace />} />
                    <Route
                      path="/app"
                      element={
                        <ProtectedRoute>
                          <AppLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<HomePage />} />
                      <Route path="my" element={<MyTasksPage />} />
                      <Route path="list/:listId" element={<ListPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}