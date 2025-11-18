import { useState } from "react";
import { mockEmails } from "../data/mockData";
import type { Email } from "../data/mockData";


export const useEmailData = () => {
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      setEmails(
        emails.map((e) => (e.id === email.id ? { ...e, isRead: true } : e))
      );
    }
  };

  const handleToggleStar = (
    emailId: number,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (e) e.stopPropagation();
    setEmails(
      emails.map((email) =>
        email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
      )
    );
    if (selectedEmail?.id === emailId) {
      setSelectedEmail({
        ...selectedEmail,
        isStarred: !selectedEmail.isStarred,
      });
    }
  };

  const handleCheckboxChange = (
    emailId: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.stopPropagation();
    if (selectedEmails.includes(emailId)) {
      setSelectedEmails(selectedEmails.filter((id) => id !== emailId));
    } else {
      setSelectedEmails([...selectedEmails, emailId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map((e) => e.id));
    }
  };

  const handleDelete = () => {
    if (selectedEmails.length > 0) {
      setEmails(emails.filter((e) => !selectedEmails.includes(e.id)));
      setSelectedEmails([]);
      if (selectedEmail && selectedEmails.includes(selectedEmail.id)) {
        setSelectedEmail(null);
      }
    }
  };

  const handleMarkAsRead = () => {
    if (selectedEmails.length > 0) {
      setEmails(
        emails.map((e) =>
          selectedEmails.includes(e.id) ? { ...e, isRead: true } : e
        )
      );
    }
  };

  const handleMarkAsUnread = () => {
    if (selectedEmail) {
      setEmails(
        emails.map((e) =>
          e.id === selectedEmail.id ? { ...e, isRead: false } : e
        )
      );
      setSelectedEmail({ ...selectedEmail, isRead: false });
    }
  };

  const handleRefresh = () => {
    setEmails([...mockEmails]);
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
  };
};
