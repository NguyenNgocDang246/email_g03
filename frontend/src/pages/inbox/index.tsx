"use client";
import { EmailList } from "../../components/Email/EmailList";
import { EmailDetail } from "../../components/Email/EmailDetail";
import { useEmailData } from "../../hooks/useEmailData";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getMailBoxesEmailListInfo,
  modifyEmail,
  type MailInfo,
  updateEmailStatus,
} from "../../api/inbox";
import { semanticSearchEmails } from "../../api/ai";
import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import NewMessage from "../../components/Email/NewMessage";
import { KanbanBoard } from "../../components/Kanban/KanbanBoard";
import { ToggleButton } from "../../components/Kanban/ToggleButton";
import { EmailDetailPanel } from "../../components/Kanban/EmailDetailPanel";
import { KANBAN_COLUMNS, type KanbanStatus } from "../../constants/kanban";

export default function InboxPage() {
  const {
    emails,
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
    setEmails,
  } = useEmailData();

  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isLogged = !!user;
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLogged) {
      navigate("/login");
    }
  }, [isLogged, navigate]);

  const { id: mailboxId } = useParams<{ id: string }>();
  const location = useLocation();

  // Lấy query từ URL
  const searchParams = new URLSearchParams(location.search);
  const queryFromUrl = searchParams.get("query") || "";
  const modeFromUrl =
    searchParams.get("mode") === "semantic" ? "semantic" : "keyword";

  const [debouncedQuery, setDebouncedQuery] = useState(queryFromUrl);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">(
    modeFromUrl
  );
  const [isDetailCollapsed, setIsDetailCollapsed] = useState(true);

  // debounce 3s trước khi set debouncedQuery
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(queryFromUrl);
    }, 1000);

    return () => clearTimeout(handler);
  }, [queryFromUrl]);

  useEffect(() => {
    setSearchMode(modeFromUrl);
  }, [modeFromUrl]);

  useEffect(() => {
    setIsDetailCollapsed(viewMode === "kanban");
  }, [viewMode]);

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
    refetch,
  } = useInfiniteQuery({
    queryKey: ["emails", mailboxId, debouncedQuery, searchMode],
    queryFn: ({ pageParam }) =>
      getMailBoxesEmailListInfo(mailboxId!, debouncedQuery, pageParam),
    enabled: !!mailboxId && searchMode === "keyword",
    retry: false,
    refetchOnWindowFocus: false,
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
  });

  const allEmails = useMemo(
    () => infiniteData?.pages.flatMap((page) => page.data) ?? [],
    [infiniteData]
  );

  const {
    data: semanticEmails,
    isFetching: isSemanticFetching,
    error: semanticError,
  } = useQuery({
    queryKey: ["semantic-emails", mailboxId, debouncedQuery],
    queryFn: () => semanticSearchEmails({ query: debouncedQuery, mailboxId }),
    enabled:
      searchMode === "semantic" && !!debouncedQuery && !!mailboxId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const normalizedEmails = useMemo(() => {
    const source = searchMode === "semantic" ? semanticEmails ?? [] : allEmails;
    return source.map((mail) => ({
      ...mail,
      status: (mail.status as KanbanStatus) || "INBOX",
    }));
  }, [allEmails, semanticEmails, searchMode]);

  useEffect(() => {
    setEmails(normalizedEmails);
    if (
      selectedEmail &&
      !normalizedEmails.find((mail) => mail.id === selectedEmail.id)
    ) {
      setSelectedEmail(null);
    }
  }, [normalizedEmails, selectedEmail, setEmails, setSelectedEmail]);

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

  const updateStatusMutation = useMutation({
    mutationFn: ({ emailId, status }: { emailId: string; status: KanbanStatus }) =>
      updateEmailStatus(emailId, status),
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

  const handleStatusChange = (
    emailId: string,
    nextStatus: KanbanStatus
  ) => {
    setEmails((prev) =>
      prev.map((mail) =>
        mail.id === emailId ? { ...mail, status: nextStatus } : mail
      )
    );
    if (selectedEmail?.id === emailId) {
      setSelectedEmail({ ...selectedEmail, status: nextStatus } as MailInfo);
    }
    updateStatusMutation.mutate({ emailId, status: nextStatus });
  };

  const isSemanticMode = searchMode === "semantic";
  const displayEmails = useMemo(
    () => (isSemanticMode ? semanticEmails ?? [] : emails),
    [emails, isSemanticMode, semanticEmails]
  );

  const groupedEmails = useMemo(() => {
    const base = KANBAN_COLUMNS.reduce(
      (acc, column) => ({ ...acc, [column.id]: [] as MailInfo[] }),
      {} as Record<KanbanStatus, MailInfo[]>
    );
    displayEmails.forEach((mail) => {
      const status = (mail.status as KanbanStatus) || "INBOX";
      if (base[status]) {
        base[status].push(mail);
      } else {
        base.INBOX.push({ ...mail, status: "INBOX" });
      }
    });
    return base;
  }, [displayEmails]);

  const handleLoadMore = () => {
    if (!isSemanticMode && hasNextPage) {
      fetchNextPage();
    }
  };

  const handleRefreshClick = () => {
    handleRefresh();
    if (isSemanticMode) {
      queryClient.invalidateQueries({
        queryKey: ["semantic-emails", mailboxId, debouncedQuery],
      });
    } else {
      refetch();
    }
  };

  const currentError = isSemanticMode ? semanticError : error;
  const isLoadingState = isSemanticMode ? isSemanticFetching : isLoading;
  const isInitialLoading = isLoadingState && displayEmails.length === 0;
  const isEmptySemanticQuery = isSemanticMode && !debouncedQuery;

  return (
    <div className="flex flex-col h-full w-full bg-gray-100 p-3 gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-gray-800">Mailbox board</p>
            <p className="text-xs text-gray-500">
              {isSemanticMode
                ? "Semantic search: kết quả dựa trên độ liên quan ngữ nghĩa"
                : "Keyword search: kết quả dựa trên từ khóa"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ToggleButton mode={viewMode} onChange={setViewMode} />
            {viewMode === "kanban" && (
              <button
                className="px-3 py-2 text-xs border rounded-md bg-white text-gray-700 hover:bg-gray-50"
                onClick={() => setIsDetailCollapsed((prev) => !prev)}
              >
                {isDetailCollapsed ? "Show detail" : "Hide detail"}
              </button>
            )}
          </div>
        </div>

      {isEmptySemanticQuery && (
        <div className="text-sm text-gray-600 bg-white border rounded-md p-3">
          Nhập từ khóa để chạy semantic search.
        </div>
      )}

      {currentError && (
        <div className="text-sm text-red-600 bg-white border border-red-200 rounded-md p-3">
          {(currentError as Error)?.message ||
            "Error loading list mail from mailboxes"}
        </div>
      )}

      {isInitialLoading && (
        <p className="text-center mt-4 text-gray-500">Loading emails...</p>
      )}

      {!isInitialLoading && (
        <div className="flex-1 overflow-hidden">
          {viewMode === "list" ? (
            <div className="flex h-full w-full bg-gray-100">
              <EmailList
                emails={displayEmails}
                selectedEmail={selectedEmail}
                selectedEmails={selectedEmails}
                onEmailSelect={handleEmailSelect}
                onToggleStar={handleToggleStar}
                onSelectAll={handleSelectAll}
                onDelete={handleDelete}
                onMarkAsRead={handleMarkAsRead}
                onRefresh={handleRefreshClick}
                fetchNextPage={handleLoadMore}
                hasNextPage={!isSemanticMode && Boolean(hasNextPage)}
              />
              <div className="p-2 w-2/3">
                <EmailDetail
                  mailBoxId={mailboxId!}
                  emailId={selectedEmail ? selectedEmail.id : null}
                  onMarkAsUnread={() =>
                    selectedEmail
                      ? markAsUnreadMutation.mutate(selectedEmail.id)
                      : undefined
                  }
                  onDelete={() =>
                    selectedEmail
                      ? markAsDeleteMutation.mutate(selectedEmail.id)
                      : undefined
                  }
                />
                <NewMessage mailboxId={mailboxId!} />
              </div>
            </div>
          ) : (
            <div className="flex h-full gap-4 overflow-x-auto pb-2">
              <div className="flex-1 overflow-hidden min-w-0">
                <KanbanBoard
                  columns={[
                    {
                      ...KANBAN_COLUMNS[0],
                      title: mailboxId || "INBOX",
                      description: `Mailbox: ${mailboxId || "INBOX"}`,
                    },
                    ...KANBAN_COLUMNS.slice(1),
                  ]}
                  itemsByColumn={groupedEmails}
                  onMove={(emailId, _from, to) =>
                    handleStatusChange(emailId, to)
                  }
                  onCardSelect={handleEmailSelect}
                  selectedEmailId={selectedEmail?.id}
                />
              </div>
              {!isDetailCollapsed && (
                <div className="hidden md:block flex-shrink-0 w-full md:max-w-md lg:max-w-lg min-w-[360px]">
                  <EmailDetailPanel
                    mailboxId={mailboxId!}
                    emailId={selectedEmail ? selectedEmail.id : null}
                    onMarkAsUnread={() =>
                      selectedEmail
                        ? markAsUnreadMutation.mutate(selectedEmail.id)
                        : undefined
                    }
                    onDelete={() =>
                      selectedEmail
                        ? markAsDeleteMutation.mutate(selectedEmail.id)
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
