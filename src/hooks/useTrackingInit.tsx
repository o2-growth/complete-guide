import { useErrorTracking } from "@/hooks/useErrorTracking";
import { usePerfTracking } from "@/hooks/usePerfTracking";

export function useTrackingInit() {
  useErrorTracking();
  usePerfTracking();
}
