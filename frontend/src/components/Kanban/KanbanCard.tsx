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

export const KanbanCard = ({ email, columnId, onSelect, isSelected }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: email.id,
    data: { columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formattedDate = email.timestamp ? new Date(email.timestamp).toLocaleString() : "";

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(email)}
      className={`rounded-md border border-gray-200 bg-white p-2 cursor-pointer shadow-sm hover:shadow-md transition ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
            {email.from?.charAt(0)?.toUpperCase() ?? <Mail className="w-4 h-4" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-gray-900 leading-tight">
              {email.from}
            </span>
            <span className="text-[10px] text-gray-500">{formattedDate}</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600">
          {formatStatusLabel(email.status ?? columnId)}
        </span>
      </div>
      <p className="text-[13px] font-semibold text-gray-900 truncate">{email.subject}</p>
      <p className="text-[11px] text-gray-600 overflow-hidden text-ellipsis leading-tight line-clamp-2">
        {email.preview}
      </p>
    </article>
  );
};
