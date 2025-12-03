import React from "react";
import { RefreshCw, Trash2, MailOpen } from "lucide-react";
import { EmailListItem } from "./EmailListItem";
import type { MailInfo } from "../../api/inbox";

interface EmailListProps {
  emails: MailInfo[];
  selectedEmail: MailInfo | null;
  selectedEmails: string[];
  onEmailSelect: (email: MailInfo) => void;
  onToggleStar: (
    emailId:string,
    isStar:boolean,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => void;
  // onCheckboxChange: (
  //   emailId: number,
  //   e: React.ChangeEvent<HTMLInputElement>
  // ) => void;
  onSelectAll: () => void;
  onDelete: () => void;
  onMarkAsRead: () => void;
  onRefresh: () => void;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmail,
  selectedEmails,
  onEmailSelect,
  onToggleStar,
  // onCheckboxChange,
  onSelectAll,
  onDelete,
  onMarkAsRead,
  onRefresh,

}) => {
  return (
    <main
      className="lg:block flex-1 lg:max-w-xl bg-white border-r border-gray-200 flex flex-col w-1/3 scrollbar overflow-y-auto"
    >
      <div className="border-b border-gray-200 py-2 px-4 flex items-center gap-2 sticky top-0 bg-white z-10">
        <input
          type="checkbox"
          checked={selectedEmails.length === emails.length && emails.length > 0}
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
        <button
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
          onClick={onDelete}
          disabled={selectedEmails.length === 0}
          title="Delete"
        >
          <Trash2 className="w-4 h-4 text-black" />
        </button>
        <button
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
          onClick={onMarkAsRead}
          disabled={selectedEmails.length === 0}
          title="Mark as read"
        >
          <MailOpen className="w-4 h-4 text-black" />
        </button>
        <span className="ml-auto text-sm text-gray-600">
          1-{emails.length} of {emails.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
            <p>Hiện tại không có mail</p>
          </div>
        ) : (
          emails.map((email) => (
            <EmailListItem
              key={email.id}
              email={email}
              isSelected={selectedEmail?.id === email.id}
              isChecked={selectedEmails.includes(email.id)}
              onSelect={onEmailSelect}
              onToggleStar={onToggleStar}
              // onCheckboxChange={onCheckboxChange}
            />
          ))
        )}
      </div>
    </main>
  );
};
