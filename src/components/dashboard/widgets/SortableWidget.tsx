import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WidgetWrapper } from "./WidgetWrapper";
import { WidgetRenderer } from "./WidgetRenderer";
import type { DashboardWidget } from "@/hooks/useDashboards";
import { cn } from "@/lib/utils";

interface Props {
  widget: DashboardWidget;
  editing: boolean;
  onEdit: (w: DashboardWidget) => void;
  onRemove: (w: DashboardWidget) => void;
}

export function SortableWidget({ widget, editing, onEdit, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !editing,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    gridColumn: `span ${Math.min(4, Math.max(1, widget.width))}`,
    gridRow: `span ${Math.min(4, Math.max(1, widget.height))}`,
    minHeight: `${widget.height * 140}px`,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "z-10")}>
      <WidgetWrapper
        title={widget.title}
        editing={editing}
        dragHandleProps={{ ...attributes, ...listeners }}
        onEdit={() => onEdit(widget)}
        onRemove={() => onRemove(widget)}
      >
        <WidgetRenderer widget={widget} />
      </WidgetWrapper>
    </div>
  );
}
