import {
  DndContext,
  PointerSensor,
  closestCorners,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { type MailInfo } from "../../api/inbox";
import { type KanbanColumnConfig, type KanbanStatus } from "../../constants/kanban";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  columns: KanbanColumnConfig[];
  itemsByColumn: Record<KanbanStatus, MailInfo[]>;
  onMove: (emailId: string, from: KanbanStatus, to: KanbanStatus) => void;
  onCardSelect: (email: MailInfo) => void;
  selectedEmailId?: string | null;
}

export const KanbanBoard = ({
  columns,
  itemsByColumn,
  onMove,
  onCardSelect,
  selectedEmailId,
}: KanbanBoardProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeColumn = active?.data?.current?.columnId as KanbanStatus;
    const overColumn =
      over?.data?.current?.sortable?.containerId ||
      (over?.id as KanbanStatus | undefined);

    if (
      activeColumn &&
      overColumn &&
      activeColumn !== overColumn &&
      onMove
    ) {
      onMove(active.id as string, activeColumn, overColumn as KanbanStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="grid auto-cols-[minmax(320px,1fr)] grid-flow-col md:grid-flow-col md:auto-cols-[minmax(360px,1fr)] lg:auto-cols-[minmax(400px,1fr)] gap-4 h-full overflow-x-auto pb-3 pr-2">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            items={itemsByColumn[column.id] ?? []}
            onCardSelect={onCardSelect}
            selectedEmailId={selectedEmailId}
          />
        ))}
      </div>
    </DndContext>
  );
};
