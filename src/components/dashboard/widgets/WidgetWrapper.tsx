import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  editing?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onEdit?: () => void;
  onRemove?: () => void;
  className?: string;
  children: ReactNode;
}

export function WidgetWrapper({
  title,
  editing = false,
  dragHandleProps,
  onEdit,
  onRemove,
  className,
  children,
}: Props) {
  return (
    <Card className={cn("h-full flex flex-col overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4 border-b">
        <div className="flex items-center gap-2 min-w-0">
          {editing && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
              aria-label="Arrastar widget"
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <CardTitle className="text-sm truncate">{title}</CardTitle>
        </div>
        {editing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Configurar
                </DropdownMenuItem>
              )}
              {onEdit && onRemove && <DropdownMenuSeparator />}
              {onRemove && (
                <DropdownMenuItem onClick={onRemove} className="text-red-600 focus:text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-auto">{children}</CardContent>
    </Card>
  );
}
