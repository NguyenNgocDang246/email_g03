import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Paperclip } from "lucide-react";
import { EmailListItem } from "./EmailListItem";
import type { MailInfo } from "../../api/inbox";
import { useInView } from "react-intersection-observer";

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

  /** ✅ state filter attachment */
  const [onlyWithAttachments, setOnlyWithAttachments] = useState(false);

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
    <main className="mt-2 lg:block flex-1 lg:max-w-xl bg-white border-r border-gray-200 flex flex-col w-1/3 rounded-xl scrollbar overflow-y-auto">
      {/* Toolbar */}
      <div className="border-b border-gray-200 py-2 px-4 flex items-center gap-2 sticky top-0 bg-white z-10">
        <input
          type="checkbox"
          checked={
            selectedEmails.length === filteredEmails.length &&
            filteredEmails.length > 0
          }
          onChange={onSelectAll}
          className="w-4 h-4 rounded"
        />

        <button
          className="p-2 hover:bg-gray-100 rounded"
          onClick={onRefresh}
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>

        {/* ✅ Filter attachment */}
        <button
          className={`p-2 rounded hover:bg-gray-100 ${
            onlyWithAttachments ? "bg-gray-200" : ""
          }`}
          onClick={() => setOnlyWithAttachments((prev) => !prev)}
          title="Chỉ hiển thị mail có attachment"
        >
          <Paperclip
            className={`w-4 h-4 ${
              onlyWithAttachments ? "text-black" : "text-gray-400"
            }`}
          />
        </button>

        <span className="ml-auto text-sm text-gray-600">
          {filteredEmails.length} mail
        </span>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
            <p>Không có mail phù hợp</p>
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
      </div>

      <div ref={ref}></div>
    </main>
  );
};
