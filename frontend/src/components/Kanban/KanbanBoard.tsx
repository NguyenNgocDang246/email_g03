import {
  DndContext,
  PointerSensor,
  // closestCorners,
  pointerWithin, // <-- Thêm cái này (Khuyên dùng)
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  useSensor,
  useSensors,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { type MailInfo } from "../../api/inbox";
import {
  type KanbanColumnConfig,
  type KanbanStatus,
} from "../../constants/kanban";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { useMemo, useState, useCallback } from "react";

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
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Helper tìm Column ID dựa trên ID của đối tượng (Card hoặc Column) được kéo/thả
  const findColumn = useCallback(
    (id: UniqueIdentifier | undefined): KanbanStatus | undefined => {
      if (!id) return undefined;

      // 1. Check xem id đó có phải là ID của một Column không (khi thả vào vùng trống của cột)
      // FIX: Dùng mảng columns prop để check thay vì itemsByColumn để đảm bảo nhận diện được cả cột rỗng
      if (columns.some((col) => col.id === id)) {
        return id as KanbanStatus;
      }

      // 2. Nếu không phải Column, tìm xem Card đó đang thuộc Column nào
      const columnEntry = Object.entries(itemsByColumn).find(([_, items]) =>
        items.some((item) => item.id === id)
      );

      return columnEntry ? (columnEntry[0] as KanbanStatus) : undefined;
    },
    [columns, itemsByColumn]
  );

  // Tạo danh sách phẳng để tìm activeItem cho DragOverlay
  const flatItems = useMemo(
    () => Object.values(itemsByColumn).flatMap((list) => list),
    [itemsByColumn]
  );

  const activeItem = useMemo(
    () => (activeId ? flatItems.find((item) => item.id === activeId) : null),
    [activeId, flatItems]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Tăng độ nhạy một chút (5px)
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // Reset state active
      setActiveId(null);

      // Nếu không thả vào đâu hoặc thả vào chính nó -> return
      if (!over || active.id === over.id) {
        return;
      }

      const activeColumn = findColumn(active.id);
      const overColumn = findColumn(over.id);

      // Chỉ thực hiện move nếu:
      // 1. Xác định được cả 2 cột
      // 2. Cột đích KHÁC cột nguồn
      if (activeColumn && overColumn && activeColumn !== overColumn && onMove) {
        onMove(active.id as string, activeColumn, overColumn);
      }
    },
    [findColumn, onMove]
  );

  return (
    <DndContext
      sensors={sensors}
      // collisionDetection={closestCorners}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="mt-2 grid grid-flow-col auto-cols-[calc((100vw-10px)/4)] gap-4 h-full overflow-x-auto pb-3 pr-2 scrollbar"
      >
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

      <DragOverlay adjustScale={false} dropAnimation={null}>
        {activeItem ? (
          <div className="cursor-grabbing w-[320px] opacity-80 rotate-2">
            <KanbanCard
              email={activeItem}
              columnId={activeItem.status as KanbanStatus}
              onSelect={() => {}}
              isSelected={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
