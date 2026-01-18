import {
  DndContext,
  pointerWithin,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  useSensor,
  useSensors,
  type UniqueIdentifier,
  TouchSensor, // Thêm TouchSensor cho mobile mượt hơn
  MouseSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { type MailInfo } from "../../api/inbox";
import {
  type KanbanColumnConfig,
  type KanbanStatus,
} from "../../constants/kanban";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { useMemo, useState, useCallback, useEffect } from "react";

interface KanbanBoardProps {
  columns: KanbanColumnConfig[];
  itemsByColumn: Record<KanbanStatus, MailInfo[]>;
  onMove: (emailId: string, from: KanbanStatus, to: KanbanStatus) => void;
  onCardSelect: (email: MailInfo) => void;
  selectedEmailId?: string | null;
  onColumnReorder?: (order: KanbanStatus[]) => void;
}

export const KanbanBoard = ({
  columns,
  itemsByColumn,
  onMove,
  onCardSelect,
  selectedEmailId,
  onColumnReorder,
}: KanbanBoardProps) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [orderedColumns, setOrderedColumns] = useState(columns);

  useEffect(() => {
    setOrderedColumns(columns);
  }, [columns]);

  const findColumn = useCallback(
    (id: UniqueIdentifier | undefined): KanbanStatus | undefined => {
      if (!id) return undefined;
      if (orderedColumns.some((col) => col.id === id)) {
        return id as KanbanStatus;
      }
      const columnEntry = Object.entries(itemsByColumn).find(([_, items]) =>
        items.some((item) => item.id === id)
      );
      return columnEntry ? (columnEntry[0] as KanbanStatus) : undefined;
    },
    [orderedColumns, itemsByColumn]
  );

  const flatItems = useMemo(
    () => Object.values(itemsByColumn).flatMap((list) => list),
    [itemsByColumn]
  );

  const activeItem = useMemo(
    () => (activeId ? flatItems.find((item) => item.id === activeId) : null),
    [activeId, flatItems]
  );

  // Cấu hình Sensor riêng biệt cho Mouse và Touch để trải nghiệm tốt nhất
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 }, // Chuột: Kéo 5px mới bắt đầu drag
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 }, // Touch: Giữ 150ms mới drag (tránh nhầm với vuốt cuộn trang)
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) {
        return;
      }

      const activeType = active.data.current?.type;

      if (activeType === "column") {
        if (active.id === "SNOOZED") return;

        const overId =
          over.data.current?.type === "column"
            ? (over.id as KanbanStatus)
            : (over.data.current?.columnId as KanbanStatus | undefined);

        if (!overId || overId === active.id) return;

        const reorderable = orderedColumns.filter(
          (column) => column.id !== "SNOOZED"
        );
        const snoozed = orderedColumns.find(
          (column) => column.id === "SNOOZED"
        );
        const activeIndex = reorderable.findIndex(
          (column) => column.id === active.id
        );
        const overIndex =
          overId === "SNOOZED"
            ? reorderable.length - 1
            : reorderable.findIndex((column) => column.id === overId);

        if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
          return;
        }

        const next = arrayMove(reorderable, activeIndex, overIndex);
        const nextColumns = snoozed ? [...next, snoozed] : next;
        setOrderedColumns(nextColumns);
        onColumnReorder?.(nextColumns.map((column) => column.id));
        return;
      }

      const activeColumn = findColumn(active.id);
      const overColumn = findColumn(over.id);

      if (activeColumn && overColumn && activeColumn !== overColumn && onMove) {
        onMove(active.id as string, activeColumn, overColumn);
      }
    },
    [findColumn, onMove, onColumnReorder, orderedColumns]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedColumns.map((column) => column.id)}
        strategy={horizontalListSortingStrategy}
      >
        {/* RESPONSIVE GRID LAYOUT */}
        <div
          className="
            mt-2 grid grid-flow-col h-full overflow-x-auto pb-3 pr-2 scrollbar
            gap-3 md:gap-4 
            auto-cols-[85vw] md:auto-cols-[320px] 
            snap-x snap-mandatory md:snap-none // Snap effect trên mobile để lướt từng cột
          "
        >
          {orderedColumns.map((column) => (
            <div key={column.id} className="snap-center h-full">
              {" "}
              {/* Snap align center */}
              <KanbanColumn
                column={column}
                items={itemsByColumn[column.id] ?? []}
                onCardSelect={onCardSelect}
                selectedEmailId={selectedEmailId}
              />
            </div>
          ))}
        </div>
      </SortableContext>

      <DragOverlay adjustScale={false} dropAnimation={null}>
        {activeItem ? (
          // Responsive width cho item đang kéo
          <div className="cursor-grabbing w-[85vw] md:w-[320px] opacity-90 rotate-2 shadow-2xl">
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
