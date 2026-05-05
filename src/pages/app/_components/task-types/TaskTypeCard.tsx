import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskType } from "@/hooks/useTaskTypes";
import { TypeIcon } from "./TypeIcon";

interface Props {
  type: TaskType;
  onEdit: (t: TaskType) => void;
  onDelete: (t: TaskType) => void;
}

export function TaskTypeCard({ type: t, onEdit, onDelete }: Props) {
  return (
    <Card className="group">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: (t.color ?? "#0EA5E9") + "20", color: t.color ?? "#0EA5E9" }}
        >
          <TypeIcon name={t.icon} className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
            {t.name}
            <Badge variant="secondary" className="font-mono text-[10px]">
              {t.slug}
            </Badge>
          </CardTitle>
          {t.description && (
            <CardDescription className="mt-1 line-clamp-2">{t.description}</CardDescription>
          )}
        </div>
        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
          <Button size="icon" variant="ghost" onClick={() => onEdit(t)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(t)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {t.default_estimate_minutes != null && (
          <span>⏱ {t.default_estimate_minutes}min</span>
        )}
        {t.checklist && t.checklist.length > 0 && (
          <span>☑ {t.checklist.length} itens</span>
        )}
        {t.workflow && (t.workflow as Record<string, unknown>).preview ? (
          <Badge variant="outline">
            preview: {String((t.workflow as Record<string, unknown>).preview)}
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  );
}
