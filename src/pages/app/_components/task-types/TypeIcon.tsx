import { Tag } from "lucide-react";
import { TASK_TYPE_ICONS } from "./utils";

export function TypeIcon({ name, className }: { name: string | null; className?: string }) {
  const C = (name && TASK_TYPE_ICONS[name]) || Tag;
  return <C className={className} />;
}
