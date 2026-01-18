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
  reorderKanbanColumns,
  updateKanbanColumn,
  type KanbanColumn,
} from "../../api/kanban";
import { semanticSearchEmails } from "../../api/ai";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import NewMessage from "../../components/Email/NewMessage";
import { KanbanBoard } from "../../components/Kanban/KanbanBoard";
import { ToggleButton } from "../../components/Kanban/ToggleButton";
import { EmailDetailPanel } from "../../components/Kanban/EmailDetailPanel";
import { buildKanbanColumns, type KanbanStatus } from "../../constants/kanban";
import { useMail } from "../../context/MailContext";
import { X } from "lucide-react";

export default function InboxPage() {
  const {
    emails,
    selectedEmail,
    selectedEmails,
    handleSelectAll,
    handleDelete,
    handleMarkAsRead,
    handleRefresh,
    setSelectedEmail,
    setEmails,
  } = useEmailData();

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { setSearchSuggestions, selectOnNewMail } = useMail();
  const cachedSuggestionsRef = useRef<string[]>([]);

  const isLogged = !!user;
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLogged) {
      navigate("/login");
    }
  }, [isLogged, navigate]);

  const { id: mailboxId } = useParams<{ id: string }>();
  const location = useLocation();

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isManageColumnsOpen, setIsManageColumnsOpen] = useState(false);
  const [newColumnDisplayName, setNewColumnDisplayName] = useState("");
  const [newColumnDescription, setNewColumnDescription] = useState("");
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [editingDisplayName, setEditingDisplayName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [columnActionError, setColumnActionError] = useState("");

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

  const {
    data: infiniteData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["emails", mailboxId, debouncedQuery, searchMode, refreshTrigger],
    queryFn: ({ pageParam }) => {
      const shouldRefresh = !pageParam || refreshTrigger > 0;
      return getMailBoxesEmailListInfo(
        mailboxId!,
        debouncedQuery,
        pageParam,
        shouldRefresh
      );
    },
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

  const orderedKanbanColumnsData = useMemo(() => {
    if (!kanbanColumnsData?.length) return [];
    const sorted = [...kanbanColumnsData].sort(
      (a, b) => a.position - b.position
    );
    const snoozed = sorted.filter((col) => col.name === "SNOOZED");
    const rest = sorted.filter((col) => col.name !== "SNOOZED");
    return [...rest, ...snoozed];
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
      { name: "INBOX", displayName: "Inbox", description: "Fresh emails" },
      { name: "TO_DO", displayName: "To Do", description: "Require follow-up" },
      {
        name: "IN_PROGRESS",
        displayName: "In Progress",
        description: "Actively handled",
      },
      { name: "DONE", displayName: "Done", description: "No action needed" },
      {
        name: "SNOOZED",
        displayName: "Snoozed",
        description: "Parked for later",
      },
    ];
    const columns = orderedKanbanColumnsData.length
      ? orderedKanbanColumnsData
      : fallback;
    return buildKanbanColumns(columns, mailboxId);
  }, [orderedKanbanColumnsData, mailboxId]);

  const suggestionSource = useMemo(() => {
    if (normalizedEmails.length === 0) return null;
    const suggestionMap = new Map<string, { value: string; count: number }>();
    const MAX_SUGGESTIONS = 50;
    const MAX_EMAILS_TO_PROCESS = 500;
    const MIN_WORD_LENGTH = 4;
    const commonWords = new Set([
      "that",
      "this",
      "with",
      "from",
      "have",
      "been",
      "were",
      "their",
      "there",
      "would",
      "could",
      "about",
      "which",
      "these",
      "those",
      "when",
      "where",
      "your",
      "mail",
      "email",
      "message",
      "notification",
      "update",
      "information",
    ]);
    const emailsToProcess = normalizedEmails.slice(0, MAX_EMAILS_TO_PROCESS);
    emailsToProcess.forEach((mail) => {
      const fromValue = mail.from?.trim();
      if (fromValue) {
        const nameMatch = fromValue.match(/^([^<]+)</);
        const senderName = nameMatch
          ? nameMatch[1].trim()
          : fromValue.split("@")[0];
        if (senderName && senderName.length >= 3) {
          const key = senderName.toLowerCase();
          if (!suggestionMap.has(key)) {
            suggestionMap.set(key, { value: senderName, count: 1 });
          } else {
            suggestionMap.get(key)!.count++;
          }
        }
      }
      const subjectValue = mail.subject?.trim();
      if (subjectValue) {
        const words = subjectValue
          .split(/[\s,.;:!?()[\]{}]+/)
          .map((word) => word.trim())
          .filter((word) => {
            const lowerWord = word.toLowerCase();
            return (
              word.length >= MIN_WORD_LENGTH &&
              !commonWords.has(lowerWord) &&
              !/^\d+$/.test(word) &&
              !/^[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]+$/.test(word)
            );
          });
        words.forEach((word) => {
          const key = word.toLowerCase();
          if (!suggestionMap.has(key)) {
            suggestionMap.set(key, { value: word, count: 1 });
          } else {
            suggestionMap.get(key)!.count++;
          }
        });
      }
      if (suggestionMap.size >= MAX_SUGGESTIONS * 3) return;
    });
    return Array.from(suggestionMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_SUGGESTIONS)
      .map((item) => item.value);
  }, [normalizedEmails]);

  useEffect(() => {
    if (suggestionSource !== null) {
      cachedSuggestionsRef.current = suggestionSource;
      setSearchSuggestions(suggestionSource);
    } else if (cachedSuggestionsRef.current.length > 0) {
      setSearchSuggestions(cachedSuggestionsRef.current);
    }
  }, [setSearchSuggestions, suggestionSource]);

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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] }),
  });
  const markAsReadMutation = useMutation({
    mutationFn: (emailId: string) => modifyEmail(emailId, { isRead: true }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] }),
  });
  const markAsStarMutation = useMutation({
    mutationFn: (emailId: string) => modifyEmail(emailId, { isStar: true }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] }),
  });
  const markAsUnStarMutation = useMutation({
    mutationFn: (emailId: string) => modifyEmail(emailId, { isStar: false }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] }),
  });
  const markAsDeleteMutation = useMutation({
    mutationFn: (emailId: string) => modifyEmail(emailId, { isDelete: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
      setSelectedEmail(null);
    },
  });
  const updateStatusMutation = useMutation({
    mutationFn: ({ emailId, status, snoozedUntil, previousStatus }: any) =>
      updateEmailStatus(emailId, status, { snoozedUntil, previousStatus }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] }),
  });
  const createColumnMutation = useMutation({
    mutationFn: createKanbanColumn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
      setNewColumnDisplayName("");
      setNewColumnDescription("");
      setColumnActionError("");
    },
    onError: (e) => setColumnActionError(e.message),
  });
  const updateColumnMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => updateKanbanColumn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
      handleCancelEdit();
    },
    onError: (e) => setColumnActionError(e.message),
  });
  const deleteColumnMutation = useMutation({
    mutationFn: deleteKanbanColumn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] }),
    onError: (e) => setColumnActionError(e.message),
  });
  const reorderColumnMutation = useMutation({
    mutationFn: reorderKanbanColumns,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] }),
  });

  const isColumnMutationPending =
    createColumnMutation.isPending ||
    updateColumnMutation.isPending ||
    deleteColumnMutation.isPending ||
    reorderColumnMutation.isPending;

  const handleEmailSelect = (email: MailInfo) => {
    setSelectedEmail(email);
    if (!email.isRead) markAsReadMutation.mutate(email!.id);
  };

  const handleToggleStar = (
    emailId: string,
    isStar: boolean,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    isStar
      ? markAsUnStarMutation.mutate(emailId)
      : markAsStarMutation.mutate(emailId);
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
    updateStatusMutation.mutate({
      emailId,
      status: nextStatus,
      snoozedUntil,
      previousStatus,
    });
  };

  const isSemanticMode = searchMode === "semantic";
  const displayEmails = useMemo(() => {
    if (isSemanticMode && !debouncedQuery) return emails;
    return isSemanticMode ? semanticEmails ?? [] : emails;
  }, [emails, isSemanticMode, semanticEmails, debouncedQuery]);

  const groupedEmails = useMemo(() => {
    const base = kanbanColumns.reduce(
      (acc, col) => ({ ...acc, [col.id]: [] as MailInfo[] }),
      {} as Record<string, MailInfo[]>
    );
    displayEmails.forEach((mail) => {
      const status = (mail.status as KanbanStatus) || "INBOX";
      base[status]
        ? base[status].push(mail)
        : base.INBOX.push({ ...mail, status: "INBOX" });
    });
    return base;
  }, [displayEmails, kanbanColumns]);

  const handleLoadMore = () => {
    if (!isSemanticMode && hasNextPage) fetchNextPage();
  };
  const handleRefreshClick = () => {
    handleRefresh();
    isSemanticMode
      ? queryClient.invalidateQueries({
          queryKey: ["semantic-emails", mailboxId, debouncedQuery],
        })
      : setRefreshTrigger((prev) => prev + 1);
  };

  const currentError = isSemanticMode ? semanticError : error;
  const isLoadingState = isSemanticMode ? isSemanticFetching : isLoading;
  const isInitialLoading = isLoadingState && displayEmails.length === 0;
  const isColumnsAtLimit = (kanbanColumnsData?.length ?? 0) >= 10;

  const handleCreateColumn = () => {
    if (!newColumnDisplayName.trim())
      return setColumnActionError("Name required.");
    createColumnMutation.mutate({
      displayName: newColumnDisplayName.trim(),
      description: newColumnDescription.trim(),
    });
  };

  const handleStartEdit = (col: KanbanColumn) => {
    setEditingColumn(col);
    setEditingDisplayName(col.displayName);
    setEditingDescription(col.description ?? "");
    setColumnActionError("");
  };
  const handleCancelEdit = () => {
    setEditingColumn(null);
    setEditingDisplayName("");
    setEditingDescription("");
  };
  const handleSaveEdit = () => {
    if (!editingColumn || !editingDisplayName.trim())
      return setColumnActionError("Name required.");
    updateColumnMutation.mutate({
      id: editingColumn._id,
      displayName: editingDisplayName.trim(),
      description: editingDescription.trim(),
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-100 p-0 sm:p-3 gap-0 sm:gap-3 relative">
      {/* HEADER / TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-0 bg-white sm:bg-transparent border-b sm:border-0 border-gray-200">
        <div>
          <p className="text-lg font-semibold text-gray-800">Mailbox board</p>
          <p className="text-xs text-gray-500">
            {isSemanticMode ? "Semantic Search (AI)" : "Keyword Search"}
          </p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <button
            className={`px-3 py-2 text-xs border rounded-md bg-white text-gray-700 hover:bg-gray-50 whitespace-nowrap transition-opacity ${
              viewMode === "kanban"
                ? "opacity-100"
                : "opacity-0 pointer-events-none hidden sm:block"
            }`}
            onClick={() => {
              setIsManageColumnsOpen(true);
              setColumnActionError("");
            }}
          >
            Manage columns
          </button>
          <button
            className={`px-3 py-2 text-xs border rounded-md whitespace-nowrap transition-opacity ${
              viewMode === "kanban"
                ? "bg-white text-gray-700 hover:bg-gray-50"
                : "opacity-0 pointer-events-none hidden sm:block"
            }`}
            onClick={() => setIsDetailCollapsed((prev) => !prev)}
          >
            {isDetailCollapsed ? "Show detail" : "Hide detail"}
          </button>

          <ToggleButton mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {currentError && (
        <div className="mx-3 sm:mx-0 text-sm text-red-600 bg-white border border-red-200 rounded-md p-3">
          {(currentError as Error)?.message || "Error loading emails"}
        </div>
      )}

      {isInitialLoading && (
        <p className="text-center mt-4 text-gray-500">Loading emails...</p>
      )}

      {!isInitialLoading && (
        <div className="flex-1 overflow-hidden relative">
          {/* --- LIST VIEW --- */}
          {viewMode === "list" ? (
            <div className="flex h-full w-full bg-white sm:bg-gray-100">
              {/* EMAIL LIST */}
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

              {/* EMAIL DETAIL WRAPPER */}
              <div
                className={`
                  bg-white h-full
                  ${
                    selectedEmail || selectOnNewMail
                      ? "fixed inset-0 z-40 w-full block sm:static sm:z-auto sm:w-2/3 sm:block sm:ml-3 sm:rounded-xl shadow-none sm:shadow-sm overflow-hidden"
                      : "hidden sm:block sm:w-2/3 sm:ml-3 sm:rounded-xl sm:bg-gray-50/50 border border-dashed border-gray-300"
                  }
                `}
              >
                <EmailDetail
                  mailBoxId={mailboxId!}
                  emailId={selectedEmail ? selectedEmail.id : null}
                  onBack={() => setSelectedEmail(null)}
                  onMarkAsUnread={() =>
                    selectedEmail &&
                    markAsUnreadMutation.mutate(selectedEmail.id)
                  }
                  onDelete={() =>
                    selectedEmail &&
                    markAsDeleteMutation.mutate(selectedEmail.id)
                  }
                  onSnooze={(duration) =>
                    selectedEmail &&
                    updateStatusMutation.mutate({
                      emailId: selectedEmail.id,
                      status: "SNOOZED",
                      snoozedUntil: new Date(
                        Date.now() + duration
                      ).toISOString(),
                      previousStatus: selectedEmail.status as KanbanStatus,
                    })
                  }
                />
                <NewMessage mailboxId={mailboxId!} />
              </div>
            </div>
          ) : (
            /* --- KANBAN VIEW --- */
            <div className="flex h-full gap-4 overflow-x-auto pb-2 px-3 sm:px-0 scrollbar">
              <div className="flex-1 min-w-0">
                <KanbanBoard
                  columns={kanbanColumns}
                  itemsByColumn={groupedEmails}
                  onMove={(emailId, _from, to) =>
                    handleStatusChange(emailId, to)
                  }
                  onColumnReorder={(order) =>
                    reorderColumnMutation.mutate(order)
                  }
                  onCardSelect={handleEmailSelect}
                  selectedEmailId={selectedEmail?.id}
                />
              </div>

              {/* KANBAN DETAIL PANEL OVERLAY */}
              {!isDetailCollapsed && (
                <div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  onClick={() => setIsDetailCollapsed(true)}
                >
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-8">
                    <div
                      className="w-full h-full sm:w-4/5 sm:h-4/5 sm:max-w-5xl bg-white sm:rounded-lg shadow-2xl overflow-hidden flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Đã xóa header cũ, dùng nút Back tích hợp */}
                      <div className="flex-1 overflow-hidden">
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
                          // ✅ Nút Back: Đóng modal
                          onBack={() => setIsDetailCollapsed(true)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MANAGE COLUMNS MODAL */}
      {isManageColumnsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setIsManageColumnsOpen(false)}
        >
          <div
            className="w-full h-[90vh] sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-white rounded-t-xl sm:rounded-lg shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-none">
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  Kanban columns
                </p>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Max 10 columns, Inbox & Snoozed locked.
                </p>
              </div>
              <button
                className="p-2 hover:bg-gray-100 rounded-full"
                onClick={() => setIsManageColumnsOpen(false)}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-4 pt-2">
              {(kanbanColumnsError ||
                columnActionError ||
                isColumnMutationPending) && (
                <div
                  className={`rounded-md p-3 text-xs ${
                    isColumnMutationPending
                      ? "bg-blue-50 text-blue-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {isColumnMutationPending
                    ? "Saving changes..."
                    : (kanbanColumnsError as Error)?.message ||
                      columnActionError}
                </div>
              )}
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-3">
                {(orderedKanbanColumnsData ?? []).map((column) => {
                  const isEditing = editingColumn?._id === column._id;
                  return (
                    <div
                      key={column._id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border border-gray-200 p-3 bg-gray-50/50"
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-2 w-full">
                          <input
                            value={editingDisplayName}
                            onChange={(e) =>
                              setEditingDisplayName(e.target.value)
                            }
                            placeholder="Name"
                            className="p-2 border rounded text-sm"
                          />
                          <input
                            value={editingDescription}
                            onChange={(e) =>
                              setEditingDescription(e.target.value)
                            }
                            placeholder="Desc"
                            className="p-2 border rounded text-sm"
                          />
                          <div className="flex gap-2 justify-end mt-1">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-xs border rounded bg-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={updateColumnMutation.isPending}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {column.displayName}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {column.description || "No description"}
                            </p>
                          </div>
                          <div className="flex gap-2 justify-end sm:justify-start">
                            <button
                              onClick={() => handleStartEdit(column)}
                              className="px-3 py-1.5 text-xs border rounded bg-white hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                deleteColumnMutation.mutate(column._id)
                              }
                              disabled={column.isLocked}
                              className={`px-3 py-1.5 text-xs border rounded ${
                                column.isLocked
                                  ? "opacity-50 cursor-not-allowed"
                                  : "text-red-600 hover:bg-red-50 bg-white"
                              }`}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Add new column
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={newColumnDisplayName}
                    onChange={(e) => setNewColumnDisplayName(e.target.value)}
                    placeholder="Column Name"
                    className="p-2 border rounded text-sm flex-1"
                  />
                  <input
                    value={newColumnDescription}
                    onChange={(e) => setNewColumnDescription(e.target.value)}
                    placeholder="Description (Optional)"
                    className="p-2 border rounded text-sm flex-1"
                  />
                  <button
                    onClick={handleCreateColumn}
                    disabled={
                      createColumnMutation.isPending || isColumnsAtLimit
                    }
                    className="p-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    Add Column
                  </button>
                </div>
                {isColumnsAtLimit && (
                  <p className="text-xs text-red-500 mt-1">Limit reached.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
