import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "./CommandPalette";
import { useTimerSync } from "@/hooks/useTimer";
import { useI18n } from "@/hooks/useI18n";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";

export default function AppLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  useTimerSync();
  useGlobalShortcuts();
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
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
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <OnboardingChecklist />
    </SidebarProvider>
  );
}