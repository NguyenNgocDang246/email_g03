import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { type MailInfo } from "../../api/inbox";
import { type KanbanColumnConfig, type KanbanStatus } from "../../constants/kanban";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  column: KanbanColumnConfig;
  items: MailInfo[];
  onCardSelect: (email: MailInfo) => void;
  selectedEmailId?: string | null;
}

export const KanbanColumn = ({
  column,
  items,
  onCardSelect,
  selectedEmailId,
}: KanbanColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <section
      ref={setNodeRef}
      className={`flex flex-col h-full min-h-[400px] min-w-[320px] md:min-w-[360px] lg:min-w-[400px] rounded-xl border ${column.accent} bg-white`}
    >
      <header className={`p-3 border-b ${column.accent} ${column.softBg}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{column.title}</p>
            <p className="text-xs text-gray-500">{column.description}</p>
          </div>
          <span className="text-xs font-medium text-gray-500">
            {items.length} mails
          </span>
        </div>
      </header>
      <SortableContext
        id={column.id}
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`flex-1 p-3 space-y-3 overflow-y-auto ${
            isOver ? "bg-blue-50/60" : "bg-gray-50"
          }`}
        >
          {items.map((email) => (
            <KanbanCard
              key={email.id}
              email={email}
              columnId={column.id as KanbanStatus}
              onSelect={onCardSelect}
              isSelected={selectedEmailId === email.id}
            />
          ))}
          {items.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">
              Thả email vào đây
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
};
