import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import { Paperclip } from "lucide-react";
import { type MailInfo } from "../../api/inbox";
import { type KanbanColumnConfig, type KanbanStatus } from "../../constants/kanban";
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
    opacity: isDragging ? 0.7 : 1,
  };

  const filteredAndSortedItems = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase();

    const filtered = items.filter((email) => {
      if (unreadOnly && email.isRead) return false;
      if (starredOnly && !email.isStarred) return false;
      if (onlyWithAttachments && !email.hasAttachments) return false;

      if (!normalizedQuery) return true;

      const haystack = `${email.from ?? ""} ${email.subject ?? ""} ${email.preview ?? ""}`.toLowerCase();
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
  }, [items, searchText, unreadOnly, starredOnly, sortOption, onlyWithAttachments]);

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`flex flex-col h-full rounded-xl border ${column.accent} bg-white`}
    >
      <header
        className={`p-3 border-b ${column.accent} ${column.softBg} rounded-t-xl`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{column.title}</p>
            <p className="text-xs text-gray-500">{column.description}</p>
          </div>
          <span className="text-xs font-medium text-gray-500">
            {filteredAndSortedItems.length}/{items.length} mails
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`h-8 rounded-md border border-gray-200 bg-white px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 ${
              column.id === "SNOOZED" ? "cursor-not-allowed opacity-50" : "cursor-grab"
            }`}
            aria-label="Drag column"
            disabled={column.id === "SNOOZED"}
            {...attributes}
            {...listeners}
          >
            Drag
          </button>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Filter by keyword..."
            className="h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-xs outline-none focus:border-blue-400 sm:w-44"
          />

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs outline-none focus:border-blue-400"
            aria-label="Sort"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="fromAsc">From (A-Z)</option>
            <option value="subjectAsc">Subject (A-Z)</option>
          </select>

          <label className="flex items-center gap-1 text-xs text-gray-700 select-none">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="h-3.5 w-3.5 accent-blue-600"
            />
            Unread
          </label>

          <label className="flex items-center gap-1 text-xs text-gray-700 select-none">
            <input
              type="checkbox"
              checked={starredOnly}
              onChange={(e) => setStarredOnly(e.target.checked)}
              className="h-3.5 w-3.5 accent-blue-600"
            />
            Starred
          </label>

          <button
            type="button"
            className={`h-8 rounded-md border px-2 transition-all ${
              onlyWithAttachments
                ? "bg-blue-100 border-blue-300 text-blue-700"
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
            onClick={() => setOnlyWithAttachments(!onlyWithAttachments)}
            title="Filter emails with attachments"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>
      <SortableContext
        id={column.id}
        items={filteredAndSortedItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`flex-1 p-3 space-y-3 rounded-xl ${
            isOver ? "bg-blue-50/60" : "bg-gray-50"
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
            <p className="text-xs text-gray-400 text-center py-6">
              No matching emails
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
};
