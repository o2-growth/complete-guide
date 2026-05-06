import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "./CommandPalette";
import { useTimerSync } from "@/hooks/useTimer";
import { useI18n } from "@/hooks/useI18n";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { useTrackingInit } from "@/hooks/useTrackingInit";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { BrandingProvider } from "@/hooks/useBranding";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useNavigate } from "react-router-dom";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/feedback/PullToRefreshIndicator";
import { useQueryClient } from "@tanstack/react-query";

export default function AppLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  useTimerSync();
  useGlobalShortcuts();
  useTrackingInit();
  const { t } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { pull, refreshing } = usePullToRefresh(async () => {
    await qc.invalidateQueries();
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // Cmd+K / Ctrl+K — abre Command Palette
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && k === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      // Cmd+Shift+P / Ctrl+Shift+P — Quick Switcher (mesma palette)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && k === "p") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
    };
    const onOpen = () => setPaletteOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("oxy:open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("oxy:open-palette", onOpen);
    };
  }, []);

  return (
    <BrandingProvider>
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-elevated"
      >
        {t("common.skip_to_content")}
      </a>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenCommand={() => setPaletteOpen(true)} />
          <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
            <Outlet />
          </main>
          <MobileBottomNav onQuickAdd={() => navigate("/app")} />
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <OnboardingChecklist />
      <PullToRefreshIndicator pull={pull} refreshing={refreshing} />
    </SidebarProvider>
    </BrandingProvider>
  );
}