import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";

interface PerfEntry {
  route: string;
  metric: string;
  value: number;
  rating?: string;
}

const buf: PerfEntry[] = [];

function rate(metric: string, v: number): string {
  if (metric === "LCP") return v < 2500 ? "good" : v < 4000 ? "needs-improvement" : "poor";
  if (metric === "CLS") return v < 0.1 ? "good" : v < 0.25 ? "needs-improvement" : "poor";
  if (metric === "INP" || metric === "FID") return v < 200 ? "good" : v < 500 ? "needs-improvement" : "poor";
  if (metric === "TTFB") return v < 800 ? "good" : v < 1800 ? "needs-improvement" : "poor";
  return "good";
}

export function usePerfTracking() {
  const { user } = useAuth();
  const { tenantId } = useWorkspace();

  useEffect(() => {
    if (!("PerformanceObserver" in window)) return;
    const route = window.location.pathname;
    try {
      const lcpObs = new PerformanceObserver((list) => {
        const last = list.getEntries().pop();
        if (last) buf.push({ route, metric: "LCP", value: last.startTime, rating: rate("LCP", last.startTime) });
      });
      lcpObs.observe({ type: "largest-contentful-paint", buffered: true });

      let cls = 0;
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceEntry[]) {
          const e = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!e.hadRecentInput && typeof e.value === "number") cls += e.value;
        }
      });
      clsObs.observe({ type: "layout-shift", buffered: true });

      const onHide = () => {
        if (cls > 0) buf.push({ route, metric: "CLS", value: cls, rating: rate("CLS", cls) });
      };
      window.addEventListener("pagehide", onHide, { once: true });

      return () => {
        lcpObs.disconnect();
        clsObs.disconnect();
      };
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(async () => {
      if (!buf.length) return;
      const rows = buf.splice(0, buf.length).map((e) => ({
        ...e,
        user_id: user.id,
        tenant_id: tenantId,
      }));
      try {
        await supabase.from("perf_metrics").insert(rows as never);
      } catch {
        buf.unshift(...rows);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [user, tenantId]);
}
