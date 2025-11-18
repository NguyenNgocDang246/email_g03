"use client";
import { EmailList } from "../../components/Email/EmailList";
import { EmailDetail } from "../../components/Email/EmailDetail";
import { useEmailData } from "../../hooks/useEmailData";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMailBoxesEmailListInfo } from "../../api/inbox";
import { useState, useEffect } from "react";
import { accessTokenMemory, refreshTokenMemory } from "../../api/baseAPI";

export default function InboxPage() {
  const {
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
  const isLogged = !!accessTokenMemory || !!refreshTokenMemory;
  console.log(isLogged);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLogged) {
      navigate("/login");
    }
  });

  const { id: mailboxId } = useParams<{ id: string }>();
  const location = useLocation();

  // Lấy query từ URL
  const searchParams = new URLSearchParams(location.search);
  const queryFromUrl = searchParams.get("query") || "";

  const [debouncedQuery, setDebouncedQuery] = useState(queryFromUrl);

  // debounce 3s trước khi set debouncedQuery
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(queryFromUrl);
    }, 1000);

    return () => clearTimeout(handler);
  }, [queryFromUrl]);

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["emails", mailboxId, debouncedQuery],
    queryFn: () => getMailBoxesEmailListInfo(mailboxId!, debouncedQuery),
    enabled: !!mailboxId, // chỉ chạy khi mailboxId tồn tại
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <p className="text-center mt-10">Loading...</p>;
  if (error)
    return <p className="text-center mt-10 text-red-600">Error loading list mail from mailboxes</p>;

  return (
    <div className="flex h-full w-full">
      <EmailList
        emails={data}
        selectedEmail={selectedEmail}
        selectedEmails={selectedEmails}
        onEmailSelect={handleEmailSelect}
        onToggleStar={handleToggleStar}
        onCheckboxChange={handleCheckboxChange}
        onSelectAll={handleSelectAll}
        onDelete={handleDelete}
        onMarkAsRead={handleMarkAsRead}
        onRefresh={handleRefresh}
      />
      <div className="p-6 w-2/3 bg-white">
        <EmailDetail
          emailId={selectedEmail ? selectedEmail.id : null}
          onMarkAsUnread={handleMarkAsUnread}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
