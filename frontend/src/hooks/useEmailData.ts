import { useState } from "react";
import {  type MailInfo } from "../api/inbox";

export const useEmailData = () => {
  const [emails, setEmails] = useState<MailInfo[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<MailInfo | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);

  const handleEmailSelect = (email: MailInfo) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e))
      );
    }
  };

  

  const handleToggleStar = (
    emailId: number,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (e) e.stopPropagation();
    setEmails((prev) =>
      prev.map((email) =>
        email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
      )
    );
    setSelectedEmail((prev) =>
      prev?.id === emailId ? { ...prev, isStarred: !prev.isStarred } : prev
    );
  };

  const handleCheckboxChange = (
    emailId: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.stopPropagation();
    setSelectedEmails((prev) =>
      prev.includes(emailId)
        ? prev.filter((id) => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    setSelectedEmails((prev) =>
      prev.length === emails.length ? [] : emails.map((e) => e.id)
    );
  };

  const handleDelete = () => {
    if (selectedEmails.length === 0) return;
    setEmails((prev) => prev.filter((e) => !selectedEmails.includes(e.id)));
    setSelectedEmails([]);
    setSelectedEmail((prev) =>
      prev && selectedEmails.includes(prev.id) ? null : prev
    );
  };

  const handleMarkAsRead = () => {
    if (selectedEmails.length === 0) return;
    setEmails((prev) =>
      prev.map((e) =>
        selectedEmails.includes(e.id) ? { ...e, isRead: true } : e
      )
    );
  };

  const handleMarkAsUnread = () => {
    if (selectedEmails.length === 0) return;
    setEmails((prev) =>
      prev.map((e) =>
        selectedEmails.includes(e.id) ? { ...e, isRead: false } : e
      )
    );
    setSelectedEmail((prev) =>
      prev && selectedEmails.includes(prev.id)
        ? { ...prev, isRead: false }
        : prev
    );
  };

  const handleRefresh = (newEmails: MailInfo[] = []) => {
    setEmails(newEmails);
    setSelectedEmail(null);
    setSelectedEmails([]);
  };

  return {
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
    setSelectedEmail,
    setEmails, // dùng khi fetch mới từ API
  };
};
