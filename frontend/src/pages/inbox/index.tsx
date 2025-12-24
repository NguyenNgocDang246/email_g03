"use client";
import { EmailList } from "../../components/Email/EmailList";
import { EmailDetail } from "../../components/Email/EmailDetail";
import { useEmailData } from "../../hooks/useEmailData";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import NewMessage from "../../components/Email/NewMessage";
import { KanbanBoard } from "../../components/Kanban/KanbanBoard";
import { ToggleButton } from "../../components/Kanban/ToggleButton";
import { EmailDetailPanel } from "../../components/Kanban/EmailDetailPanel";
import { buildKanbanColumns, type KanbanStatus } from "../../constants/kanban";
import { useMail } from "../../context/MailContext";

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
  const { setSearchSuggestions } = useMail();

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
  const modeFromUrl = searchParams.get("mode") === "semantic" ? "semantic" : "keyword";

  const [debouncedQuery, setDebouncedQuery] = useState(queryFromUrl);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">(modeFromUrl);
  const [isDetailCollapsed, setIsDetailCollapsed] = useState(true);
  const [isManageColumnsOpen, setIsManageColumnsOpen] = useState(false);
  const [newColumnDisplayName, setNewColumnDisplayName] = useState("");
  const [newColumnDescription, setNewColumnDescription] = useState("");
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [editingDisplayName, setEditingDisplayName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [columnActionError, setColumnActionError] = useState("");

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
    queryFn: ({ pageParam }) => getMailBoxesEmailListInfo(mailboxId!, debouncedQuery, pageParam),
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

  const orderedKanbanColumnsData = useMemo(() => {
    if (!kanbanColumnsData?.length) return [];
    const sorted = [...kanbanColumnsData].sort((a, b) => a.position - b.position);
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
      { name: "INBOX", displayName: "Inbox", description: "Fresh emails waiting for triage" },
      { name: "TO_DO", displayName: "To Do", description: "Emails that require follow-up" },
      { name: "IN_PROGRESS", displayName: "In Progress", description: "Actively being handled" },
      { name: "DONE", displayName: "Done", description: "No further action needed" },
      { name: "SNOOZED", displayName: "Snoozed", description: "Parked for later" },
    ];
    const columns = orderedKanbanColumnsData.length ? orderedKanbanColumnsData : fallback;
    return buildKanbanColumns(columns, mailboxId);
  }, [orderedKanbanColumnsData, mailboxId]);

  const suggestionSource = useMemo(() => {
    const suggestionMap = new Map<string, string>();

    normalizedEmails.forEach((mail) => {
      const fromValue = mail.from?.trim();
      if (fromValue) {
        const key = fromValue.toLowerCase();
        if (!suggestionMap.has(key)) {
          suggestionMap.set(key, fromValue);
        }
      }

      const subjectValue = mail.subject?.trim();
      if (subjectValue) {
        subjectValue
          .split(/[\s,.;:!?()]+/)
          .map((word) => word.trim())
          .filter((word) => word.length >= 3)
          .forEach((word) => {
            const key = word.toLowerCase();
            if (!suggestionMap.has(key)) {
              suggestionMap.set(key, word);
            }
          });
      }
    });

    return Array.from(suggestionMap.values()).slice(0, 50);
  }, [normalizedEmails]);

  useEffect(() => {
    setSearchSuggestions(suggestionSource);
  }, [setSearchSuggestions, suggestionSource]);

  useEffect(() => {
    setEmails(normalizedEmails);
    if (selectedEmail && !normalizedEmails.find((mail) => mail.id === selectedEmail.id)) {
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
    mutationFn: ({ displayName, description }: { displayName: string; description?: string }) =>
      createKanbanColumn({ displayName, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
    },
    onError: (error: Error) => {
      setColumnActionError(error.message);
    },
  });

  const updateColumnMutation = useMutation({
    mutationFn: ({
      id,
      displayName,
      description,
    }: {
      id: string;
      displayName?: string;
      description?: string;
    }) => updateKanbanColumn(id, { displayName, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
      setColumnActionError("");
    },
    onError: (error: Error) => {
      setColumnActionError(error.message);
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (id: string) => deleteKanbanColumn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
      setColumnActionError("");
    },
    onError: (error: Error) => {
      setColumnActionError(error.message);
    },
  });

  const reorderColumnMutation = useMutation({
    mutationFn: (order: KanbanStatus[]) => reorderKanbanColumns(order),
    onMutate: async (order) => {
      await queryClient.cancelQueries({ queryKey: ["kanban-columns"] });
      const previous = queryClient.getQueryData<KanbanColumn[]>(["kanban-columns"]);
      if (!previous) return { previous };

      const map = new Map(previous.map((col) => [col.name, col]));
      const seen = new Set<string>();
      const nextOrder = order.filter((name) => {
        if (name === "SNOOZED") return false;
        if (seen.has(name)) return false;
        seen.add(name);
        return map.has(name);
      });

      const remaining = previous
        .filter((col) => col.name !== "SNOOZED" && !seen.has(col.name))
        .sort((a, b) => a.position - b.position);
      const snoozed = previous.filter((col) => col.name === "SNOOZED");
      const merged = [...nextOrder.map((name) => map.get(name)!), ...remaining, ...snoozed].map(
        (col, index) => ({ ...col, position: index })
      );

      queryClient.setQueryData(["kanban-columns"], merged);
      return { previous };
    },
    onError: (error, _order, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["kanban-columns"], context.previous);
      }
      setColumnActionError(error instanceof Error ? error.message : "Failed to reorder columns.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
    },
  });

  const isColumnMutationPending =
    createColumnMutation.isPending ||
    updateColumnMutation.isPending ||
    deleteColumnMutation.isPending ||
    reorderColumnMutation.isPending;

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
    const previousStatus = emails.find((m) => m.id === emailId)?.status || "INBOX";

    setEmails((prev) =>
      prev.map((mail) => (mail.id === emailId ? { ...mail, status: nextStatus } : mail))
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
    if (!newColumnDisplayName.trim()) {
      setColumnActionError("Column name is required.");
      return;
    }
    createColumnMutation.mutate(
      {
        displayName: newColumnDisplayName.trim(),
        description: newColumnDescription.trim() || "",
      },
      {
        onSuccess: () => {
          setNewColumnDisplayName("");
          setNewColumnDescription("");
          setColumnActionError("");
        },
      }
    );
  };

  const handleStartEdit = (column: KanbanColumn) => {
    setEditingColumn(column);
    setEditingDisplayName(column.displayName);
    setEditingDescription(column.description ?? "");
    setColumnActionError("");
  };

  const handleCancelEdit = () => {
    setEditingColumn(null);
    setEditingDisplayName("");
    setEditingDescription("");
  };

  const handleSaveEdit = () => {
    if (!editingColumn) return;
    if (!editingDisplayName.trim()) {
      setColumnActionError("Column name is required.");
      return;
    }
    updateColumnMutation.mutate(
      {
        id: editingColumn._id,
        displayName: editingDisplayName.trim(),
        description: editingDescription.trim(),
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
            className={`px-3 py-2 text-xs border rounded-md bg-white text-gray-700 hover:bg-gray-50 cursor-pointer transition-opacity ${
              viewMode === "kanban" ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => {
              setIsManageColumnsOpen(true);
              setColumnActionError("");
            }}
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
          {(currentError as Error)?.message || "Error loading list mail from mailboxes"}
        </div>
      )}

      {isInitialLoading && <p className="text-center mt-4 text-gray-500">Loading emails...</p>}

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
                    selectedEmail ? markAsUnreadMutation.mutate(selectedEmail.id) : undefined
                  }
                  onDelete={() =>
                    selectedEmail ? markAsDeleteMutation.mutate(selectedEmail.id) : undefined
                  }
                  onSnooze={(durationMs) =>
                    selectedEmail
                      ? updateStatusMutation.mutate({
                          emailId: selectedEmail.id,
                          status: "SNOOZED",
                          snoozedUntil: new Date(Date.now() + durationMs).toISOString(),
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
                  onMove={(emailId, _from, to) => handleStatusChange(emailId, to)}
                  onColumnReorder={(order) => reorderColumnMutation.mutate(order)}
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
                          selectedEmail && markAsUnreadMutation.mutate(selectedEmail.id)
                        }
                        onDelete={() =>
                          selectedEmail && markAsDeleteMutation.mutate(selectedEmail.id)
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
                  <p className="text-lg font-semibold text-gray-800">Kanban columns</p>
                  <p className="text-xs text-gray-500">
                    Max 10 columns, Inbox and Snoozed cannot be deleted.
                  </p>
                </div>
                <button
                  className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                  onClick={() => setIsManageColumnsOpen(false)}
                >
                  Close
                </button>
              </div>

              {kanbanColumnsError && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {(kanbanColumnsError as Error)?.message || "Error loading columns"}
                </div>
              )}
              {columnActionError && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {columnActionError}
                </div>
              )}
              {isColumnMutationPending && (
                <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
                  Saving changes...
                </div>
              )}

              <div className="mt-4 max-h-[45vh] space-y-3 overflow-y-auto pr-1">
                {(orderedKanbanColumnsData ?? []).map((column) => {
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
                            placeholder="Name"
                            className="h-9 flex-1 rounded-md border border-gray-200 px-2 text-sm"
                          />
                          <input
                            value={editingDescription}
                            onChange={(e) => setEditingDescription(e.target.value)}
                            placeholder="Description"
                            className="h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
                          />
                          <button
                            className="h-9 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                            onClick={handleSaveEdit}
                            disabled={updateColumnMutation.isPending}
                          >
                            {updateColumnMutation.isPending ? "Saving..." : "Save"}
                          </button>
                          <button
                            className="h-9 rounded-md border border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
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
                            <p className="text-xs text-gray-500">
                              {column.description?.trim() || "custom column"}
                            </p>
                            <p className="text-[11px] text-gray-400">{column.name}</p>
                          </div>
                          <button
                            className="h-8 rounded-md border border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleStartEdit(column)}
                          >
                            Edit
                          </button>
                          <button
                            className="h-8 rounded-md border border-gray-200 px-3 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                            onClick={() => deleteColumnMutation.mutate(column._id)}
                            disabled={column.isLocked}
                          >
                            {deleteColumnMutation.isPending ? "Deleting..." : "Delete"}
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
                    placeholder="Name"
                    className="h-9 flex-1 rounded-md border border-gray-200 px-2 text-sm"
                  />
                  <input
                    value={newColumnDescription}
                    onChange={(e) => setNewColumnDescription(e.target.value)}
                    placeholder="Description"
                    className="h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
                  />
                  <button
                    className="h-9 w-full rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    onClick={handleCreateColumn}
                    disabled={createColumnMutation.isPending || isColumnsAtLimit}
                  >
                    {createColumnMutation.isPending ? "Adding..." : "Add"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {isColumnsAtLimit
                    ? "Reached the 10-column limit."
                    : "Provide a name and optional description to add a column."}
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
