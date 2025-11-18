


"use client";
import { EmailList } from "../../components/Email/EmailList";
import { EmailDetail } from "../../components/Email/EmailDetail";
import { useEmailData } from "../../hooks/useEmailData";

export default function InboxPage() {
  const {
    emails,
    selectedEmail,
    selectedEmails,
    handleEmailSelect,
    handleToggleStar,
    handleCheckboxChange,
    handleSelectAll,
    handleDelete,
    handleMarkAsRead,
    handleMarkAsUnread,
    handleRefresh,
  } = useEmailData();

  return (
    <div className="flex h-full w-full">
      <EmailList
        emails={emails}
        selectedEmail={selectedEmail}
        selectedEmails={selectedEmails}
        onEmailSelect={handleEmailSelect}
        onToggleStar={handleToggleStar}
        onCheckboxChange={handleCheckboxChange}
        onSelectAll={handleSelectAll}
        onDelete={handleDelete}
        onMarkAsRead={handleMarkAsRead}
        onRefresh={handleRefresh}
        showMobileDetail={false}
      />
      <EmailDetail
        email={selectedEmail}
        onToggleStar={handleToggleStar}
        onMarkAsUnread={handleMarkAsUnread}
        onDelete={handleDelete}
      />
    </div>
  );
}
