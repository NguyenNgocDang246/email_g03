import React, { useEffect, useMemo } from "react";
import { RefreshCw, Paperclip } from "lucide-react";
import { EmailListItem } from "./EmailListItem";
import type { MailInfo } from "../../api/inbox";
import { useInView } from "react-intersection-observer";
import { useMail } from "../../context/MailContext";

interface EmailListProps {
  emails: MailInfo[];
  selectedEmail: MailInfo | null;
  selectedEmails: string[];
  onEmailSelect: (email: MailInfo) => void;
  onToggleStar: (
    emailId: string,
    isStar: boolean,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => void;
  onSelectAll: () => void;
  onDelete: () => void;
  onMarkAsRead: () => void;
  onRefresh: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmail,
  selectedEmails,
  onEmailSelect,
  onToggleStar,
  onSelectAll,
  onRefresh,
  fetchNextPage,
  hasNextPage,
}) => {
  const { ref, inView } = useInView();

  /** ✅ state filter attachment from context */
  const { onlyWithAttachments, setOnlyWithAttachments } = useMail();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, inView, hasNextPage]);

  /** ✅ filter email list */
  const filteredEmails = useMemo(() => {
    if (!onlyWithAttachments) return emails;
    return emails.filter((email) => email.hasAttachments);
  }, [emails, onlyWithAttachments]);

  return (
    <main
      className={`
        bg-white border-r border-gray-200 flex flex-col scrollbar overflow-y-auto h-full
        
        // RESPONSIVE WIDTH & VISIBILITY
        // Mobile: Ẩn list nếu đang xem detail (selectedEmail != null). Hiện full width nếu không xem.
        ${selectedEmail ? "hidden lg:flex" : "flex w-full"}
        
        // Desktop: Luôn hiện, width 1/3
        lg:w-1/3 lg:max-w-xl lg:flex-1
        
        // RESPONSIVE STYLING
        // Mobile: Tràn viền, vuông góc
        m-0 rounded-none
        
        // Desktop: Cách lề trên, bo góc
        lg:mt-2 lg:rounded-xl
      `}
    >
      {/* Toolbar */}
      <div className="border-b border-gray-200 py-3 px-4 flex items-center gap-3 sticky top-0 bg-white z-10 shadow-sm sm:shadow-none">
        <input
          type="checkbox"
          checked={
            selectedEmails.length === filteredEmails.length &&
            filteredEmails.length > 0
          }
          onChange={onSelectAll}
          className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />

        <button
          className="p-2 hover:bg-gray-100 rounded-full sm:rounded transition-colors"
          onClick={onRefresh}
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500" />
        </button>

        {/* ✅ Filter attachment */}
        <button
          className={`p-2 rounded-full sm:rounded hover:bg-gray-100 transition-colors ${
            onlyWithAttachments ? "bg-blue-50 text-blue-600" : ""
          }`}
          onClick={() => setOnlyWithAttachments(!onlyWithAttachments)}
          title="Chỉ hiển thị mail có attachment"
        >
          <Paperclip
            className={`w-5 h-5 sm:w-4 sm:h-4 ${
              onlyWithAttachments ? "text-blue-600" : "text-gray-500"
            }`}
          />
        </button>

        <span className="ml-auto text-xs sm:text-sm text-gray-500 font-medium">
          {filteredEmails.length} <span className="hidden sm:inline">mail</span>
        </span>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto scrollbar">
        {filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 sm:h-full p-8 text-gray-400">
            <Paperclip className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm">Không có mail phù hợp</p>
          </div>
        ) : (
          filteredEmails.map((email, index) => (
            <EmailListItem
              key={`${email.id}-${index}`}
              email={email}
              isSelected={selectedEmail?.id === email.id}
              isChecked={selectedEmails.includes(email.id)}
              onSelect={onEmailSelect}
              onToggleStar={onToggleStar}
            />
          ))
        )}

        {/* Infinite Scroll Trigger */}
        <div ref={ref} className="h-4 w-full" />
      </div>
    </main>
  );
};
