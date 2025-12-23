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
import {
  createKanbanColumn,
  deleteKanbanColumn,
  getKanbanColumns,
  updateKanbanColumn,
  type KanbanColumn,
} from "../../api/kanban";
import { semanticSearchEmails } from "../../api/ai";
import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import NewMessage from "../../components/Email/NewMessage";
import { KanbanBoard } from "../../components/Kanban/KanbanBoard";
import { ToggleButton } from "../../components/Kanban/ToggleButton";
import { EmailDetailPanel } from "../../components/Kanban/EmailDetailPanel";
import { buildKanbanColumns, type KanbanStatus } from "../../constants/kanban";

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
  const [isManageColumnsOpen, setIsManageColumnsOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnDisplayName, setNewColumnDisplayName] = useState("");
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDisplayName, setEditingDisplayName] = useState("");

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
    enabled: searchMode === "semantic" && !!debouncedQuery && !!mailboxId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const {
    data: kanbanColumnsData,
    isLoading: isKanbanColumnsLoading,
    error: kanbanColumnsError,
  } = useQuery({
    queryKey: ["kanban-columns"],
    queryFn: () => getKanbanColumns(),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const allowedStatuses = useMemo(() => {
    const names = kanbanColumnsData?.map((col) => col.name) ?? ["INBOX"];
    return new Set(names);
  }, [kanbanColumnsData]);

  const normalizedEmails = useMemo(() => {
    const source = searchMode === "semantic" ? semanticEmails ?? [] : allEmails;
    return source.map((mail) => ({
      ...mail,
      status: allowedStatuses.has(mail.status ?? "") ? mail.status : "INBOX",
    }));
  }, [allEmails, semanticEmails, searchMode, allowedStatuses]);

  const kanbanColumns = useMemo(() => {
    const fallback = [
      { name: "INBOX", displayName: "Inbox" },
      { name: "TO_DO", displayName: "To Do" },
      { name: "IN_PROGRESS", displayName: "In Progress" },
      { name: "DONE", displayName: "Done" },
      { name: "SNOOZED", displayName: "Snoozed" },
    ];
    const columns = kanbanColumnsData?.length ? kanbanColumnsData : fallback;
    return buildKanbanColumns(columns, mailboxId);
  }, [kanbanColumnsData, mailboxId]);

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
    mutationFn: ({
      emailId,
      status,
      snoozedUntil,
      previousStatus,
    }: {
      emailId: string;
      status: KanbanStatus;
      snoozedUntil?: string;
      previousStatus?: KanbanStatus;
    }) => updateEmailStatus(emailId, status, { snoozedUntil, previousStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
    },
  });

  const createColumnMutation = useMutation({
    mutationFn: ({
      name,
      displayName,
    }: {
      name: string;
      displayName?: string;
    }) => createKanbanColumn({ name, displayName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
    },
  });

  const updateColumnMutation = useMutation({
    mutationFn: ({
      id,
      name,
      displayName,
    }: {
      id: string;
      name?: string;
      displayName?: string;
    }) => updateKanbanColumn(id, { name, displayName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (id: string) => deleteKanbanColumn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
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
    if (isStar) {
      markAsUnStarMutation.mutate(emailId);
    } else {
      markAsStarMutation.mutate(emailId);
    }
  };

  const handleStatusChange = (emailId: string, nextStatus: KanbanStatus) => {
    const isSnoozed = nextStatus === "SNOOZED";
    const snoozedUntil = isSnoozed
      ? new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      : undefined;
    const previousStatus =
      emails.find((m) => m.id === emailId)?.status || "INBOX";

    setEmails((prev) =>
      prev.map((mail) =>
        mail.id === emailId ? { ...mail, status: nextStatus } : mail
      )
    );
    if (selectedEmail?.id === emailId) {
      setSelectedEmail({ ...selectedEmail, status: nextStatus } as MailInfo);
    }
    updateStatusMutation.mutate({
      emailId,
      status: nextStatus,
      snoozedUntil,
      previousStatus,
    });
  };

  const isSemanticMode = searchMode === "semantic";
  const displayEmails = useMemo(
    () => (isSemanticMode ? semanticEmails ?? [] : emails),
    [emails, isSemanticMode, semanticEmails]
  );

  const groupedEmails = useMemo(() => {
    const base = kanbanColumns.reduce(
      (acc, column) => ({ ...acc, [column.id]: [] as MailInfo[] }),
      {} as Record<string, MailInfo[]>
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

  const isColumnsAtLimit = (kanbanColumnsData?.length ?? 0) >= 10;
  const handleCreateColumn = () => {
    if (!newColumnName.trim()) return;
    createColumnMutation.mutate(
      {
        name: newColumnName.trim(),
        displayName: newColumnDisplayName.trim() || undefined,
      },
      {
        onSuccess: () => {
          setNewColumnName("");
          setNewColumnDisplayName("");
        },
      }
    );
  };

  const handleStartEdit = (column: KanbanColumn) => {
    setEditingColumn(column);
    setEditingName(column.name);
    setEditingDisplayName(column.displayName);
  };

  const handleCancelEdit = () => {
    setEditingColumn(null);
    setEditingName("");
    setEditingDisplayName("");
  };

  const handleSaveEdit = () => {
    if (!editingColumn) return;
    updateColumnMutation.mutate(
      {
        id: editingColumn._id,
        name: editingName.trim() || editingColumn.name,
        displayName: editingDisplayName.trim() || editingColumn.displayName,
      },
      {
        onSuccess: () => {
          handleCancelEdit();
        },
      }
    );
  };

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
          <button
            className="px-3 py-2 text-xs border rounded-md bg-white text-gray-700 hover:bg-gray-50"
            onClick={() => setIsManageColumnsOpen(true)}
          >
            Manage columns
          </button>
          <button
            className={`px-3 py-2 text-xs border rounded-md
      transition-opacity
      ${
        viewMode === "kanban"
          ? "bg-white text-gray-700 hover:bg-gray-50"
          : "opacity-0 pointer-events-none"
      }
    `}
            onClick={() => setIsDetailCollapsed((prev) => !prev)}
          >
            {isDetailCollapsed ? "Show detail" : "Hide detail"}
          </button>

          <ToggleButton mode={viewMode} onChange={setViewMode} />
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
              <div className=" w-2/3">
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
                  onSnooze={(durationMs) =>
                    selectedEmail
                      ? updateStatusMutation.mutate({
                          emailId: selectedEmail.id,
                          status: "SNOOZED",
                          snoozedUntil: new Date(
                            Date.now() + durationMs
                          ).toISOString(),
                          previousStatus: selectedEmail.status as KanbanStatus,
                        })
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
                  columns={kanbanColumns}
                  itemsByColumn={groupedEmails}
                  onMove={(emailId, _from, to) =>
                    handleStatusChange(emailId, to)
                  }
                  onCardSelect={handleEmailSelect}
                  selectedEmailId={selectedEmail?.id}
                />
              </div>
              {!isDetailCollapsed && (
                <div
                  className="fixed inset-0 z-40 bg-black/50"
                  onClick={() => setIsDetailCollapsed(true)}
                >
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                      className="
                        w-full max-w-4/5 h-4/5 max-h-4/5
                        bg-white rounded-lg shadow-2xl
                        overflow-hidden
                      "
                      onClick={(e) => e.stopPropagation()} // 👈 click trong không tắt
                    >
                      <EmailDetailPanel
                        mailboxId={mailboxId!}
                        emailId={selectedEmail?.id ?? null}
                        onMarkAsUnread={() =>
                          selectedEmail &&
                          markAsUnreadMutation.mutate(selectedEmail.id)
                        }
                        onDelete={() =>
                          selectedEmail &&
                          markAsDeleteMutation.mutate(selectedEmail.id)
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isManageColumnsOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsManageColumnsOpen(false)}
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    Kanban columns
                  </p>
                  <p className="text-xs text-gray-500">
                    Tối đa 10 cột, không thể xóa Inbox hoặc Snoozed.
                  </p>
                </div>
                <button
                  className="text-sm text-gray-500 hover:text-gray-700"
                  onClick={() => setIsManageColumnsOpen(false)}
                >
                  Close
                </button>
              </div>

              {kanbanColumnsError && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {(kanbanColumnsError as Error)?.message ||
                    "Error loading columns"}
                </div>
              )}

              <div className="mt-4 space-y-3">
                {(kanbanColumnsData ?? []).map((column) => {
                  const isEditing = editingColumn?._id === column._id;
                  return (
                    <div
                      key={column._id}
                      className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-3"
                    >
                      {isEditing ? (
                        <>
                          <input
                            value={editingDisplayName}
                            onChange={(e) => setEditingDisplayName(e.target.value)}
                            placeholder="Display name"
                            className="h-9 flex-1 rounded-md border border-gray-200 px-2 text-sm"
                          />
                          <input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            placeholder="Name (key)"
                            disabled={column.isLocked}
                            className="h-9 flex-1 rounded-md border border-gray-200 px-2 text-sm disabled:bg-gray-100"
                          />
                          <button
                            className="h-9 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                            onClick={handleSaveEdit}
                            disabled={updateColumnMutation.isPending}
                          >
                            Save
                          </button>
                          <button
                            className="h-9 rounded-md border border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">
                              {column.displayName}
                            </p>
                            <p className="text-xs text-gray-500">{column.name}</p>
                          </div>
                          <button
                            className="h-8 rounded-md border border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50"
                            onClick={() => handleStartEdit(column)}
                          >
                            Edit
                          </button>
                          <button
                            className="h-8 rounded-md border border-gray-200 px-3 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => deleteColumnMutation.mutate(column._id)}
                            disabled={column.isLocked}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-md border border-dashed border-gray-300 p-3">
                <p className="text-xs font-semibold text-gray-600">Add column</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    value={newColumnDisplayName}
                    onChange={(e) => setNewColumnDisplayName(e.target.value)}
                    placeholder="Display name"
                    className="h-9 flex-1 rounded-md border border-gray-200 px-2 text-sm"
                  />
                  <input
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Name (key)"
                    className="h-9 flex-1 rounded-md border border-gray-200 px-2 text-sm"
                  />
                  <button
                    className="h-9 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleCreateColumn}
                    disabled={createColumnMutation.isPending || isColumnsAtLimit}
                  >
                    Add
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {isColumnsAtLimit
                    ? "Đã đạt tối đa 10 cột."
                    : "Nhập tên và display name để tạo cột mới."}
                </p>
              </div>

              {isKanbanColumnsLoading && (
                <p className="mt-3 text-xs text-gray-500">Loading columns...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
