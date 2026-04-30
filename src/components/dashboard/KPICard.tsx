import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "danger";
}

const accentMap: Record<NonNullable<Props["accent"]>, string> = {
  primary: "text-primary bg-primary/10",
  success: "text-emerald-500 bg-emerald-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  danger: "text-red-500 bg-red-500/10",
};

export function KPICard({ label, value, hint, icon: Icon, accent = "primary" }: Props) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold mt-1 truncate">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}