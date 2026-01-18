import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type MailInfo } from "../../api/inbox";
import { formatStatusLabel, type KanbanStatus } from "../../constants/kanban";
import { Mail } from "lucide-react";

interface KanbanCardProps {
  email: MailInfo;
  columnId: KanbanStatus;
  onSelect: (email: MailInfo) => void;
  isSelected: boolean;
}

export const KanbanCard = ({
  email,
  columnId,
  onSelect,
  isSelected,
}: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: email.id,
    data: { type: "card", columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Giảm opacity rõ hơn khi drag
  };

  // Format date ngắn gọn hơn cho thẻ
  const formattedDate = email.timestamp
    ? new Date(email.timestamp).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      })
    : "";

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(email)}
      className={`
        relative group flex flex-col gap-1
        bg-white rounded-lg border border-gray-200 
        shadow-sm hover:shadow-md transition-all
        cursor-grab active:cursor-grabbing
        
        // RESPONSIVE SPACING
        p-3 sm:p-2.5 
        
        ${isSelected ? "ring-2 ring-blue-500 border-transparent" : ""}
      `}
    >
      {/* HEADER: Avatar + Name + Date + Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Avatar: Mobile to hơn (w-8), Desktop nhỏ hơn (w-7) */}
          <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            {email.from?.charAt(0)?.toUpperCase() ?? (
              <Mail className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-[13px] font-semibold text-gray-900 leading-tight truncate">
              {email.from}
            </span>
            <span className="text-xs sm:text-[10px] text-gray-500">
              {formattedDate}{" "}
              {email.timestamp?.split(" ")[1] /* Thêm giờ nếu cần */}
            </span>
          </div>
        </div>

        {/* Status Label */}
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap shrink-0">
          {formatStatusLabel(email.status ?? columnId)}
        </span>
      </div>

      {/* CONTENT: Subject + Preview */}
      <div className="mt-1">
        <p className="text-sm sm:text-[13px] font-semibold text-gray-900 truncate leading-tight mb-0.5">
          {email.subject}
        </p>
        {/* Mobile: line-clamp-3 (xem nhiều hơn), Desktop: line-clamp-2 (gọn hơn) */}
        <p className="text-xs sm:text-[11px] text-gray-500 leading-snug line-clamp-3 sm:line-clamp-2 break-words">
          {email.preview}
        </p>
      </div>
    </article>
  );
};
