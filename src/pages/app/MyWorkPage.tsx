import { useEffect } from "react";
import { MyWorkPanel } from "@/components/tasks/MyWorkPanel";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, UserCheck } from "lucide-react";
import SEO from "@/components/SEO";
import type { MyWorkTab } from "@/hooks/useMyWorkTasks";

interface MyWorkPageProps {
  title: string;
  description: string;
  defaultTab?: MyWorkTab;
}

export default function MyWorkPage({
  title,
  description,
  defaultTab = "pending",
}: MyWorkPageProps) {
  useEffect(() => {
    document.title = `${title} — Oxy Growth OS`;
  }, [title]);

  return (
    <div className="flex h-full flex-col">
      <SEO title={title} />
      <div className="border-b px-6 py-4">
        <PageHeader
          icon={UserCheck}
          title={title}
          description={description}
          actions={
            <CreateTaskModal
              trigger={
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Nova tarefa
                </Button>
              }
            />
          }
        />
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">
          <MyWorkPanel defaultTab={defaultTab} />
        </div>
      </div>
    </div>
  );
}
