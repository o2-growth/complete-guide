import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

export interface BrandingSettings {
  primaryColor: string; // hex
  accentColor: string; // hex
  logoUrl: string | null;
  highContrast: boolean;
  fontSize: "small" | "normal" | "large";
  workspaceName: string;
}

const DEFAULT: BrandingSettings = {
  primaryColor: "#0EA5E9",
  accentColor: "#FCD34D",
  logoUrl: null,
  highContrast: false,
  fontSize: "normal",
  workspaceName: "Oxy Growth OS",
};

interface BrandingContextValue extends BrandingSettings {
  loading: boolean;
  update: (patch: Partial<BrandingSettings>) => Promise<void>;
  reset: () => Promise<void>;
}

const Ctx = createContext<BrandingContextValue>({
  ...DEFAULT,
  loading: true,
  update: async () => {},
  reset: async () => {},
});

/** Convert hex (#RRGGBB) -> "H S% L%" string for CSS variable. */
function hexToHsl(hex: string): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hh = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hh = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hh = (b - r) / d + 2; break;
      case b: hh = (r - g) / d + 4; break;
    }
    hh /= 6;
  }
  return `${Math.round(hh * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyBranding(b: BrandingSettings) {
  const root = document.documentElement;
  root.style.setProperty("--primary", hexToHsl(b.primaryColor));
  root.style.setProperty("--ring", hexToHsl(b.primaryColor));
  root.style.setProperty("--sidebar-primary", hexToHsl(b.primaryColor));
  root.style.setProperty("--accent", hexToHsl(b.accentColor));

  // Font size
  const sizeMap = { small: "14px", normal: "16px", large: "18px" } as const;
  root.style.fontSize = sizeMap[b.fontSize];

  // High contrast
  root.classList.toggle("high-contrast", b.highContrast);
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { tenantId } = useWorkspace();
  const [state, setState] = useState<BrandingSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);

  // Load
  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("tenants")
        .select("name, primary_color, accent_color, logo_url, settings")
        .eq("id", tenantId)
        .maybeSingle();
      if (cancelled || !data) {
        setLoading(false);
        return;
      }
      const settings = (data.settings as Record<string, unknown> | null) ?? {};
      const branding = (settings.branding as Record<string, unknown> | undefined) ?? {};
      const next: BrandingSettings = {
        primaryColor: (data.primary_color as string) || DEFAULT.primaryColor,
        accentColor: (data.accent_color as string) || DEFAULT.accentColor,
        logoUrl: (data.logo_url as string | null) ?? null,
        highContrast: !!(branding.high_contrast as boolean | undefined),
        fontSize: ((branding.font_size as BrandingSettings["fontSize"] | undefined) ?? "normal"),
        workspaceName: (data.name as string) || DEFAULT.workspaceName,
      };
      setState(next);
      applyBranding(next);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  const update = useCallback(async (patch: Partial<BrandingSettings>) => {
    if (!tenantId) return;
    const next = { ...state, ...patch };
    setState(next);
    applyBranding(next);
    // Read current settings to merge
    const { data: cur } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", tenantId)
      .maybeSingle();
    const settings = (cur?.settings as Record<string, unknown> | null) ?? {};
    const branding = (settings.branding as Record<string, unknown> | undefined) ?? {};
    const newSettings = {
      ...settings,
      branding: {
        ...branding,
        high_contrast: next.highContrast,
        font_size: next.fontSize,
      },
    };
    await supabase
      .from("tenants")
      .update({
        primary_color: next.primaryColor,
        accent_color: next.accentColor,
        logo_url: next.logoUrl,
        name: next.workspaceName,
        settings: newSettings,
      })
      .eq("id", tenantId);
  }, [tenantId, state]);

  const reset = useCallback(async () => {
    await update(DEFAULT);
  }, [update]);

  return (
    <Ctx.Provider value={{ ...state, loading, update, reset }}>
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- Provider e hook do contexto coexistem por convenção React.
export const useBranding = () => useContext(Ctx);