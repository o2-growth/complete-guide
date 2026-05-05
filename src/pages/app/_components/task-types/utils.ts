// Utilitários e tipos compartilhados pelos componentes de task-types.
// Extraídos para preservar fast-refresh nos arquivos .tsx.
import {
  Image as ImageIcon,
  Camera,
  Video,
  Linkedin,
  Mail,
  Workflow,
  Store,
  BarChart3,
  Inbox,
  Tag,
} from "lucide-react";

export const TASK_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Image: ImageIcon,
  Camera,
  Video,
  Linkedin,
  Mail,
  Workflow,
  Store,
  BarChart3,
  Inbox,
  Tag,
};

export interface TaskTypeFormState {
  id?: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  default_estimate_minutes: number | null;
  description: string;
  checklistText: string;
}

export const emptyTaskTypeForm: TaskTypeFormState = {
  name: "",
  slug: "",
  icon: "Tag",
  color: "#0EA5E9",
  default_estimate_minutes: 60,
  description: "",
  checklistText: "",
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
