import { useEffect, useMemo, useState } from "react";
import { Calendar, Flag, Image as ImageIcon, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { DueDateLabel } from "@/components/tasks/DueDateLabel";
import { useProjects } from "@/hooks/useProjects";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import type { TaskRow } from "@/hooks/useTasks";
import type { AttachmentRow } from "@/hooks/useTaskDetail";
import { cn } from "@/lib/utils";

const PRIO_COLOR: Record<string, string> = {
  urgent: "text-[hsl(var(--prio-urgent))]",
  high: "text-[hsl(var(--prio-high))]",
  medium: "text-[hsl(var(--prio-medium))]",
  low: "text-[hsl(var(--prio-low))]",
  none: "text-muted-foreground/40",
};

const PRIO_LABEL: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  none: "—",
};

interface TaskGalleryViewProps {
  tasks: TaskRow[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

function isImageMime(m: string | null) {
  if (!m) return false;
  return m.startsWith("image/");
}

/**
 * Hook que busca a primeira imagem anexada a cada task (limit 200) — usada como
 * cover. Faz uma única query agregada pra evitar N+1.
 */
function useTaskCovers(taskIds: string[]) {
  const [covers, setCovers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!taskIds.length) {
      setCovers({});
      return;
    }
    let cancelled = false;
    const run = async () => {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .in("task_id", taskIds)
        .order("created_at", { ascending: true });
      if (error || cancelled || !data) return;
      const firstImageByTask = new Map<string, AttachmentRow>();
      for (const att of data as AttachmentRow[]) {
        if (!att.task_id) continue;
        if (firstImageByTask.has(att.task_id)) continue;
        if (isImageMime(att.mime_type)) firstImageByTask.set(att.task_id, att);
      }
      const out: Record<string, string> = {};
      await Promise.all(
        Array.from(firstImageByTask.entries()).map(async ([taskId, att]) => {
          const { data: signed } = await supabase.storage
            .from(att.bucket || "attachments")
            .createSignedUrl(att.path, 60 * 60);
          if (signed?.signedUrl) out[taskId] = signed.signedUrl;
        }),
      );
      if (!cancelled) setCovers(out);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [taskIds.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  return covers;
}

function CoverPlaceholder({ title, color }: { title: string; color?: string | null }) {
  const seed = title.charCodeAt(0) + title.charCodeAt(title.length - 1);
  const hue = (seed * 13) % 360;
  const bg = color ?? `hsl(${hue}, 60%, 70%)`;
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: bg }}
      aria-hidden
    >
      <ImageIcon className="h-10 w-10 text-white/70" />
    </div>
  );
}

function initials(name?: string | null, email?: string | null) {
  const s = (name || email || "?").trim();
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function TaskGalleryView({
  tasks,
  isLoading,
  emptyTitle = "Nada por aqui",
  emptyDescription = "Quando houver tarefas, elas aparecem como cards.",
}: TaskGalleryViewProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: projects = [] } = useProjects();
  const { data: members = [] } = useTenantMembers();

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const covers = useTaskCovers(taskIds);

  const projectMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string | null; key: string }>();
    projects.forEach((p) => m.set(p.id, { name: p.name, color: p.color, key: p.key }));
    return m;
  }, [projects]);

  const memberMap = useMemo(() => {
    const m = new Map<string, { name: string | null; avatar: string | null; email: string | null }>();
    members.forEach((mb) =>
      m.set(mb.id, {
        name: mb.full_name ?? mb.display_name ?? null,
        avatar: mb.avatar_url,
        email: mb.email,
      }),
    );
    return m;
  }, [members]);

  if (isLoading) return <ListSkeleton rows={6} />;
  if (!tasks.length) {
    return <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tasks.map((task) => {
          const project = task.project_id ? projectMap.get(task.project_id) : null;
          const member = task.assignee_id ? memberMap.get(task.assignee_id) : null;
          const cover = covers[task.id];
          const due = task.due_at ? new Date(task.due_at) : null;
          const done = !!task.done_at;

          return (
            <Card
              key={task.id}
              role="button"
              tabIndex={0}
              onClick={() => setOpenId(task.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenId(task.id);
                }
              }}
              className={cn(
                "group flex cursor-pointer flex-col overflow-hidden border bg-card transition-all hover:scale-[1.02] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                done && "opacity-60",
              )}
              aria-label={`Abrir tarefa ${task.title}`}
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                {cover ? (
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <CoverPlaceholder title={task.title} color={project?.color} />
                )}
                {task.priority !== "none" && (
                  <span
                    className={cn(
                      "absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium backdrop-blur",
                      PRIO_COLOR[task.priority],
                    )}
                  >
                    <Flag className="h-3 w-3" /> {PRIO_LABEL[task.priority]}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-start gap-2">
                  <p
                    className={cn(
                      "line-clamp-2 flex-1 text-sm font-medium",
                      done && "line-through text-muted-foreground",
                    )}
                  >
                    {task.title}
                  </p>
                  {task.code && (
                    <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                      {task.code}
                    </Badge>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="min-w-0 flex-1">
                    {project ? (
                      <Badge
                        variant="secondary"
                        className="max-w-full truncate text-[10px]"
                        style={
                          project.color
                            ? { background: `${project.color}22`, color: project.color }
                            : undefined
                        }
                      >
                        {project.name}
                      </Badge>
                    ) : null}
                  </div>
                  {due ? (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <DueDateLabel due={due} done={done} />
                    </span>
                  ) : null}
                  {member ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.avatar ?? undefined} alt={member.name ?? ""} />
                      <AvatarFallback className="text-[10px]">
                        {initials(member.name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <TaskDetailSheet taskId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </>
  );
}
