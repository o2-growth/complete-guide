import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Flag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMyWorkTasks, type MyWorkTab } from "@/hooks/useMyWorkTasks";
import { taskDetailPath } from "@/lib/task-routes";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { DueDateLabel } from "./DueDateLabel";

const PRIO_COLOR: Record<string, string> = {
  urgent: "text-[hsl(var(--prio-urgent))]",
  high: "text-[hsl(var(--prio-high))]",
  medium: "text-[hsl(var(--prio-medium))]",
  low: "text-[hsl(var(--prio-low))]",
  none: "text-muted-foreground",
};

interface MyWorkPanelProps {
  defaultTab?: MyWorkTab;
  compact?: boolean;
}

export function MyWorkPanel({ defaultTab = "pending", compact = false }: MyWorkPanelProps) {
  const [tab, setTab] = useState<MyWorkTab>(defaultTab);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { groups, isLoading } = useMyWorkTasks(tab);

  const toggle = (key: string) =>
    setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  return (
    <div className={cn("rounded-xl border bg-card", compact ? "p-3" : "p-4")}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as MyWorkTab)}>
        <TabsList className="mb-4 h-8">
          <TabsTrigger value="pending" className="text-xs">
            Pendente
          </TabsTrigger>
          <TabsTrigger value="done" className="text-xs">
            Feito
          </TabsTrigger>
          <TabsTrigger value="delegated" className="text-xs">
            Delegado
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-0">
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : (
            <div className="space-y-3">
              {groups.map((g) => {
                const isColl = collapsed[g.key];
                if (g.count === 0 && tab === "pending" && g.key !== "today") {
                  return (
                    <div key={g.key} className="flex items-center justify-between text-sm text-muted-foreground">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggle(g.key)}
                      >
                        {isColl ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {g.label}
                      </button>
                      <span className="text-xs">{g.count}</span>
                    </div>
                  );
                }
                return (
                  <div key={g.key}>
                    <button
                      type="button"
                      className="mb-1.5 flex w-full items-center justify-between text-sm font-medium"
                      onClick={() => toggle(g.key)}
                    >
                      <span className="flex items-center gap-1">
                        {isColl ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {g.label}
                      </span>
                      <Badge variant="secondary" className="h-5 text-[10px]">
                        {g.count}
                      </Badge>
                    </button>
                    {!isColl && (
                      <ul className="space-y-0.5">
                        {g.tasks.map((t) => (
                          <li key={t.id}>
                            <button
                              type="button"
                              onClick={() => navigate(taskDetailPath(t.id))}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/60"
                            >
                              <span
                                className={cn(
                                  "h-2 w-2 shrink-0 rounded-full border-2",
                                  t.done_at ? "bg-primary border-primary" : "border-muted-foreground/40",
                                )}
                              />
                              <span className="min-w-0 flex-1 truncate">
                                <span className="font-medium">{t.title}</span>
                                {t.projectName && (
                                  <span className="text-muted-foreground"> · {t.projectName}</span>
                                )}
                              </span>
                              <Flag className={cn("h-3.5 w-3.5 shrink-0", PRIO_COLOR[t.priority])} />
                              {t.due_at && (
                                <span className="shrink-0 text-[10px] text-muted-foreground">
                                  <DueDateLabel
                                    due={new Date(t.due_at)}
                                    done={!!t.done_at}
                                    absoluteFormat="dd/MM"
                                  />
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
