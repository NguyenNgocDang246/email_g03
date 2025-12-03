"use client";
import { EmailList } from "../../components/Email/EmailList";
import { EmailDetail } from "../../components/Email/EmailDetail";
import { useEmailData } from "../../hooks/useEmailData";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getMailBoxesEmailListInfo,
  modifyEmail,
  type MailInfo,
} from "../../api/inbox";
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

  // const emptyMailList: MailListResponse = {
  //   currentPage: 1,
  //   nextPage: 0,
  //   total: 0,
  //   data: [],
  // };

  const {
    data: infiniteData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["emails", mailboxId, debouncedQuery],
    queryFn: ({ pageParam }) =>
      getMailBoxesEmailListInfo(mailboxId!, debouncedQuery, pageParam),
    enabled: !!mailboxId,
    retry: false,
    refetchOnWindowFocus: false,
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
  });

  const allEmails = infiniteData?.pages.flatMap((page) => page.data) ?? [];

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

  const markAsUnStarMutation = useMutation({
    mutationFn: (emailId: string) => modifyEmail(emailId, { isStar: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
    },
  });

   const markAsDeleteMutation = useMutation({
     mutationFn: (emailId: string) => modifyEmail(emailId, { isDelete: true }),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
       setSelectedEmail(null);
     },
   });

  const handleEmailSelect = (email: MailInfo) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markAsReadMutation.mutate(email!.id);
    }
  };

  const handleToggleStar = (    
    emailId: string,
    isStar: boolean,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (e) e.stopPropagation();
    if(isStar){
      markAsUnStarMutation.mutate(emailId);
    }else{
      markAsStarMutation.mutate(emailId);
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
        emails={allEmails}
        selectedEmail={selectedEmail}
        selectedEmails={selectedEmails}
        onEmailSelect={handleEmailSelect}
        onToggleStar={handleToggleStar}
        onSelectAll={handleSelectAll}
        onDelete={handleDelete}
        onMarkAsRead={handleMarkAsRead}
        onRefresh={handleRefresh}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
      />
      <div className="p-2 w-2/3">
        <EmailDetail
          mailBoxId={mailboxId!}
          emailId={selectedEmail ? selectedEmail.id : null}
          onMarkAsUnread={() => markAsUnreadMutation.mutate(selectedEmail!.id)}
          onDelete={()=>markAsDeleteMutation.mutate(selectedEmail!.id)}
        />
        <NewMessage mailboxId={mailboxId!} />
      </div>
    </div>
  );
}
