import { useMemo } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskRow } from "@/hooks/useTasks";
import { getTaskPreview } from "./preview-utils";

interface Props {
  tasks: TaskRow[];
  onSelect?: (taskId: string) => void;
  className?: string;
}

/**
 * Grid IG 3×N: mostra os criativos dos posts ig_feed na ordem
 * cronológica reversa (mais novos no topo) — espelha a aparência do
 * perfil no Instagram.
 */
export function IgGrid({ tasks, onSelect, className }: Props) {
  const items = useMemo(() => {
    return tasks
      .map((t) => ({
        task: t,
        preview: getTaskPreview(
          (t as TaskRow & { custom_fields?: Record<string, unknown> }).custom_fields,
        ),
      }))
      .filter(
        (it) => it.preview.kind === "ig_feed" || it.preview.kind === "ig_reel" || it.preview.kind === "ig_story",
      );
  }, [tasks]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
        <ImageIcon className="mb-2 h-8 w-8 opacity-50" />
        <p>Nenhum criativo ainda.</p>
        <p className="mt-1 text-xs">
          Marque tarefas com tipo de preview <code className="rounded bg-muted px-1">ig_feed</code> para vê-las aqui.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-3 gap-1 sm:gap-1.5", className)}>
      {items.map(({ task, preview }) => (
        <button
          key={task.id}
          onClick={() => onSelect?.(task.id)}
          className="group relative aspect-square overflow-hidden rounded-sm bg-gradient-to-br from-pink-500/30 via-fuchsia-500/30 to-orange-400/30 ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          title={task.title}
        >
          {preview.imageUrl ? (
            <img
              src={preview.imageUrl}
              alt={task.title}
              loading="lazy"
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] font-medium text-foreground/70">
              {task.title}
            </div>
          )}
          <div className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
            <span className="line-clamp-2 text-[10px] font-medium text-white">{task.title}</span>
          </div>
          {preview.kind === "ig_reel" && (
            <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white">
              REEL
            </span>
          )}
          {preview.kind === "ig_story" && (
            <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white">
              STORY
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
