import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import { Paperclip, GripVertical } from "lucide-react"; // Dùng icon Grip cho nút Drag đẹp hơn
import { type MailInfo } from "../../api/inbox";
import {
  type KanbanColumnConfig,
  type KanbanStatus,
} from "../../constants/kanban";
import { KanbanCard } from "./KanbanCard";
import { useMail } from "../../context/MailContext";

interface KanbanColumnProps {
  column: KanbanColumnConfig;
  items: MailInfo[];
  onCardSelect: (email: MailInfo) => void;
  selectedEmailId?: string | null;
}

type SortOption = "newest" | "oldest" | "fromAsc" | "subjectAsc";

export const KanbanColumn = ({
  column,
  items,
  onCardSelect,
  selectedEmailId,
}: KanbanColumnProps) => {
  const [searchText, setSearchText] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  /** ✅ Get attachment filter from context */
  const { onlyWithAttachments, setOnlyWithAttachments } = useMail();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: column.id,
    data: { type: "column", columnId: column.id },
    disabled: column.id === "SNOOZED",
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const filteredAndSortedItems = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase();

    const filtered = items.filter((email) => {
      if (unreadOnly && email.isRead) return false;
      if (starredOnly && !email.isStarred) return false;
      if (onlyWithAttachments && !email.hasAttachments) return false;

      if (!normalizedQuery) return true;

      const haystack = `${email.from ?? ""} ${email.subject ?? ""} ${
        email.preview ?? ""
      }`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    const toTime = (value: string | undefined) => {
      const ms = Date.parse(value ?? "");
      return Number.isFinite(ms) ? ms : 0;
    };

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "oldest":
          return toTime(a.timestamp) - toTime(b.timestamp);
        case "fromAsc":
          return (a.from ?? "").localeCompare(b.from ?? "");
        case "subjectAsc":
          return (a.subject ?? "").localeCompare(b.subject ?? "");
        case "newest":
        default:
          return toTime(b.timestamp) - toTime(a.timestamp);
      }
    });
  }, [
    items,
    searchText,
    unreadOnly,
    starredOnly,
    sortOption,
    onlyWithAttachments,
  ]);

  return (
    <section
      ref={setNodeRef}
      style={style}
      // h-full để cột chiếm hết chiều cao của board
      className={`flex flex-col h-full rounded-xl border ${column.accent} bg-white shadow-sm overflow-hidden`}
    >
      {/* HEADER */}
      <header
        className={`p-3 border-b flex-none ${column.accent} ${column.softBg}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">
              {column.title}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1">
              {column.description}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-white/60 rounded-full text-gray-600 shrink-0">
            {filteredAndSortedItems.length}/{items.length}
          </span>
        </div>

        {/* FILTERS & TOOLS */}
        <div className="mt-3 flex flex-col gap-2">
          {/* Row 1: Drag Handle + Search + Sort */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 active:cursor-grabbing shrink-0 ${
                column.id === "SNOOZED"
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-grab"
              }`}
              title="Drag Column"
              disabled={column.id === "SNOOZED"}
              {...attributes}
              {...listeners}
            >
              <GripVertical size={14} />
            </button>

            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              className="h-8 min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Row 2: Sort + Checkboxes + Attachment */}
          <div className="flex items-center justify-between gap-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="h-8 flex-1 w-full max-w-[110px] rounded-md border border-gray-200 bg-white px-1 text-[11px] outline-none focus:border-blue-400"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="fromAsc">From (A-Z)</option>
              <option value="subjectAsc">Subject (A-Z)</option>
            </select>

            <div className="flex items-center gap-2">
              {/* Unread Checkbox */}
              <label
                className="flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-black/5"
                title="Unread only"
              >
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                  className="h-3.5 w-3.5 accent-blue-600 rounded cursor-pointer"
                />
                {/* Ẩn chữ trên mobile bé quá, hoặc dùng icon mail kín */}
                <span className="text-[10px] font-medium text-gray-600">
                  Unread
                </span>
              </label>

              {/* Starred Checkbox */}
              <label
                className="flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-black/5"
                title="Starred only"
              >
                <input
                  type="checkbox"
                  checked={starredOnly}
                  onChange={(e) => setStarredOnly(e.target.checked)}
                  className="h-3.5 w-3.5 accent-blue-600 rounded cursor-pointer"
                />
                <span className="text-[10px] font-medium text-gray-600">
                  Star
                </span>
              </label>

              {/* Attachment Toggle */}
              <button
                type="button"
                className={`h-7 w-7 flex items-center justify-center rounded-md border transition-all ${
                  onlyWithAttachments
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
                onClick={() => setOnlyWithAttachments(!onlyWithAttachments)}
                title="Has attachments"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* BODY - SCROLLABLE AREA */}
      {/* flex-1 min-h-0 là trick để scroll hoạt động trong flex container */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar p-2 bg-gray-50/50">
        <SortableContext
          id={column.id}
          items={filteredAndSortedItems.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            className={`space-y-2 pb-2 h-full ${
              isOver ? "bg-blue-50/30 rounded-lg transition-colors" : ""
            }`}
          >
            {filteredAndSortedItems.map((email) => (
              <KanbanCard
                key={email.id}
                email={email}
                columnId={column.id as KanbanStatus}
                onSelect={onCardSelect}
                isSelected={selectedEmailId === email.id}
              />
            ))}
            {filteredAndSortedItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 opacity-60">
                <p className="text-xs italic">No matching emails</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </section>
  );
};
