"use client";
import { EmailList } from "../../components/Email/EmailList";
import { EmailDetail } from "../../components/Email/EmailDetail";
import { useEmailData } from "../../hooks/useEmailData";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMailBoxesEmailListInfo, modifyEmail, type MailInfo, type MailListResponse } from "../../api/inbox";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import NewMessage from "../../components/Email/NewMessage";


export default function InboxPage() {
  const {
    selectedEmail,
    selectedEmails,
    // handleToggleStar,
    // handleCheckboxChange,
    handleSelectAll,
    handleDelete,
    handleMarkAsRead,
    // handleMarkAsUnread,
    handleRefresh,
    setSelectedEmail,
  } = useEmailData();

  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isLogged = !!user;
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

  const emptyMailList: MailListResponse = {
    page: 1,
    limit: 0,
    total: 0,
    data: [],
  };
  
  const {
    data = emptyMailList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["emails", mailboxId, debouncedQuery],
    queryFn: () => getMailBoxesEmailListInfo(mailboxId!, debouncedQuery),
    enabled: !!mailboxId, // chỉ chạy khi mailboxId tồn tại
    retry: false,
    refetchOnWindowFocus: false,
  });


  const markAsUnreadMutation = useMutation({
    mutationFn: (emailId: string) => modifyEmail(emailId, { isRead: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (emailId: string) => modifyEmail(emailId, { isRead: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
    },
  });

  const markAsStarMutation = useMutation({
    mutationFn: (emailId: string) => modifyEmail(emailId, { isStar: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
    },
  });

  const handleEmailSelect = (email: MailInfo) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markAsReadMutation.mutate(email!.id);
    }
  };

  console.log(selectedEmail)
  const handleToggleStar = (
    emailId:string,
    isStar:boolean,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    console.log("ne",emailId,isStar)
    if (e) e.stopPropagation();
    if(!isStar){
      markAsStarMutation.mutate(emailId)
    }
  };

  if (isLoading) return <p className="text-center mt-10">Loading...</p>;
  if (error)
    return (
      <p className="text-center mt-10 text-red-600">
        Error loading list mail from mailboxes
      </p>
    );

  return (
    <div className="flex h-full w-full bg-gray-100">
      <EmailList
        emails={data.data}
        selectedEmail={selectedEmail}
        selectedEmails={selectedEmails}
        onEmailSelect={handleEmailSelect}
        onToggleStar={handleToggleStar}
        // onCheckboxChange={handleCheckboxChange}
        onSelectAll={handleSelectAll}
        onDelete={handleDelete}
        onMarkAsRead={handleMarkAsRead}
        onRefresh={handleRefresh}
      />
      <div className="p-2 w-2/3">
        <EmailDetail
          mailBoxId={mailboxId!}
          emailId={selectedEmail ? selectedEmail.id : null}
          onMarkAsUnread={() => markAsUnreadMutation.mutate(selectedEmail!.id)}
          onDelete={handleDelete}
        />
        <NewMessage mailboxId={mailboxId!} />
      </div>
    </div>
  );
}
