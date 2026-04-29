import { Badge } from "@/components/ui/badge";
import { TaskList } from "@/components/tasks/TaskList";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { SmartList } from "@/hooks/useTasks";
import { LucideIcon } from "lucide-react";

interface SmartListPageProps {
  list: SmartList;
  title: string;
  description: string;
  icon: LucideIcon;
  showQuickAdd?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function SmartListPage({
  list,
  title,
  description,
  icon: Icon,
  showQuickAdd = false,
  emptyTitle,
  emptyDescription,
}: SmartListPageProps) {
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
            <Icon className="mr-1.5 h-3 w-3" /> Smart list
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        {showQuickAdd && <QuickAdd />}

        <TaskList list={list} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
      </div>
    </div>
  );
}