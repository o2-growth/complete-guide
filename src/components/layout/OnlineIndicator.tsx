import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useI18n } from "@/hooks/useI18n";
import { WifiOff } from "lucide-react";

export function OnlineIndicator() {
  const online = useOnlineStatus();
  const { t } = useI18n();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning"
    >
      <WifiOff className="h-3 w-3" aria-hidden />
      {t("common.offline")}
    </div>
  );
}
