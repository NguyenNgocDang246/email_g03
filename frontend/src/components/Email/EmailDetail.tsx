import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Star, RefreshCcw, Paperclip, ArrowLeft } from "lucide-react";
import React, { Suspense, useMemo, useRef, useState } from "react";
import {
  getEmailDetail,
  replyEmail,
  type ReplyEmailPayload,
  type Attachment,
} from "../../api/inbox";
import { Trash } from "lucide-react";
import { SendHorizonal } from "lucide-react";
import { useMail } from "../../context/MailContext";
import { AttachmentList } from "../UI/AttachmentList";
import { summarizeEmail } from "../../api/ai";
import DOMPurify from "dompurify";

interface EmailDetailProps {
  mailBoxId: string;
  emailId: string | null;
  onMarkAsUnread: () => void;
  onDelete: () => void;
  onSnooze?: (durationMs: number) => void;
  onBack?: () => void; // ✅ Thêm prop này để xử lý quay lại trên mobile
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  mailBoxId,
  emailId,
  onMarkAsUnread,
  onDelete,
  onSnooze,
  onBack,
}) => {
  const forceRefreshRef = useRef(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["mailDetailInfo", emailId],
    queryFn: () => getEmailDetail(emailId!),
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!emailId,
  });
  const {
    data: summaryData,
    isFetching: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["mailSummaryInfo", emailId],
    queryFn: () => summarizeEmail(emailId!, forceRefreshRef.current),
    enabled: !!emailId,
    staleTime: 1000 * 60 * 10,
  });

  const handleRefreshSummary = async () => {
    try {
      forceRefreshRef.current = true;
      await refetchSummary();
    } finally {
      forceRefreshRef.current = false;
    }
  };

  const queryClient = useQueryClient();

  const { selectOnNewMail } = useMail();
  const [message, setMessage] = useState("");
  const [isReply, setIsReply] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const cleanHtml = useMemo(() => {
    return DOMPurify.sanitize(data?.bodyHtml ?? "", {
      FORBID_TAGS: ["style", "meta", "title", "head", "html", "body", "script"],
    });
  }, [data?.bodyHtml]);

  const handleReplyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const filesArray: Attachment[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));
    setReplyAttachments((prev) => [...prev, ...filesArray]);
    setReplyFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const handleRemoveReplyAttachment = (id: string) => {
    const index = replyAttachments.findIndex((att) => att.id === id);
    if (index !== -1) {
      setReplyAttachments((prev) => prev.filter((att) => att.id !== id));
      setReplyFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const replyMutation = useMutation({
    mutationFn: (payload: ReplyEmailPayload) => {
      if (!emailId) {
        return Promise.reject(new Error("Email ID is missing"));
      }
      return replyEmail(emailId, payload);
    },

    onSuccess: (res) => {
      alert(res.message);

      setMessage("");
      setIsReply(false);
      setReplyAttachments([]);
      setReplyFiles([]);
      queryClient.invalidateQueries({
        queryKey: ["mailDetailInfo", emailId],
      });
      queryClient.invalidateQueries({ queryKey: ["emails", mailBoxId] });
    },

    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Reply failed!";
      alert(message);
    },
  });

  if (isLoading)
    return (
      <div className="h-full flex items-center justify-center">
        <p className="font-bold text-gray-400">Loading...</p>
      </div>
    );

  if (error)
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-red-600">Error loading email</p>
      </div>
    );

  if (!emailId || !data) {
    return (
      <div
        className={`w-full h-screen ${selectOnNewMail ? "hidden" : "block"}`}
      >
        <div className="h-full flex justify-center items-center text-gray-400">
          <div className="text-center px-4">
            <Mail className="w-24 h-24 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Select an email to view details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="p-6 w-full flex justify-center items-center h-full">
          <p className="text-gray-400 text-lg">Loading email...</p>
        </div>
      }
    >
      <div
        className={`scrollbar overflow-y-auto h-full pb-20 sm:pb-0 ${
          selectOnNewMail ? "hidden" : "block"
        }`}
      >
        {/* HEADER */}
        {/* Sticky top on mobile for easy back navigation */}
        <div className="bg-white m-0 sm:m-2 rounded-none sm:rounded shadow border-b sm:border-0 sticky top-0 z-10 sm:static">
          <div className="p-3 flex items-start gap-3">
            {/* ✅ BACK BUTTON (Mobile Only) */}
            <button
              onClick={onBack}
              className="sm:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>

            <h1 className="text-lg sm:text-xl font-semibold text-black break-words leading-tight flex-1 pt-1">
              {data.subject}
            </h1>
          </div>
        </div>

        <div className="bg-white m-0 sm:m-2 mt-2 sm:mt-2 rounded-none sm:rounded shadow p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
            <div>
              <p className="text-sm font-semibold text-black">AI Summary</p>
              <p className="text-xs text-gray-500">
                Tóm tắt email và metadata liên quan
              </p>
            </div>
            <button
              onClick={handleRefreshSummary}
              className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 sm:py-1 rounded-md border text-xs text-gray-700 hover:bg-gray-100 w-full sm:w-auto"
            >
              <RefreshCcw size={14} />
              Làm mới
            </button>
          </div>
          {isSummaryLoading && (
            <p className="text-xs text-gray-500">Đang sinh tóm tắt...</p>
          )}
          {summaryError && (
            <p className="text-xs text-red-500">
              {(summaryError as Error)?.message || "Không lấy được summary"}
            </p>
          )}
          {summaryData && (
            <div className="space-y-2">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {summaryData.summary || "Chưa có summary cho email này"}
              </p>
              {summaryData.metadata && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(summaryData.metadata).map(([key, value]) => (
                    <div
                      key={key}
                      className="text-[11px] text-gray-500 bg-gray-50 rounded p-2 break-all"
                    >
                      <span className="font-semibold text-gray-700">
                        {key}:
                      </span>{" "}
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isSummaryLoading && !summaryData && !summaryError && (
            <p className="text-xs text-gray-500">Chưa có summary sẵn.</p>
          )}
        </div>

        {/* SENDER + RECIPIENTS + BODY */}
        <div className="bg-white m-0 sm:m-2 mt-2 sm:mt-2 rounded-none sm:rounded shadow p-3">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 min-w-[2.5rem] bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {data.sender?.name?.charAt(0) ?? data.sender.email.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-black truncate max-w-[200px] sm:max-w-none">
                  {data.sender?.name ?? data.sender.email}
                </span>
                <span className="text-gray-500 text-sm hidden sm:inline">
                  ({data.sender.email})
                </span>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <Star
                    className={`w-4 h-4 ${
                      data.labels?.includes("STARRED")
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-400"
                    }`}
                  />
                </button>
              </div>

              <p className="text-gray-500 text-xs sm:hidden block mb-1">
                {data.sender.email}
              </p>

              <p className="text-gray-500 text-sm truncate">
                To: {data.recipients.map((r) => r.email).join(", ")}
              </p>
              <p className="text-gray-400 text-xs">{data.date}</p>
            </div>

            <button onClick={onDelete} className="p-2">
              <Trash size={18} className="text-gray-500 hover:text-red-500" />
            </button>
          </div>

          <div className="pl-0 sm:pl-12 pr-0 sm:pr-3 my-4">
            <div className="prose max-w-none text-black break-words overflow-x-auto">
              <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
            </div>

            {data.attachments && data.attachments.length > 0 && (
              <div className="mt-4">
                <AttachmentList
                  attachments={data.attachments}
                  emailId={data.id}
                  onRemove={() => {}}
                />
              </div>
            )}

            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between mt-8 gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  className="px-4 py-2 hover:bg-gray-200 border border-gray-300 rounded text-black text-sm flex justify-center"
                  onClick={onMarkAsUnread}
                >
                  Mark as unread
                </button>
                <button
                  className="px-4 py-2 text-black hover:bg-gray-200 border border-gray-300 rounded text-sm flex justify-center"
                  onClick={() => setIsReply(true)}
                >
                  Reply
                </button>
                {onSnooze && (
                  <button
                    className="px-4 py-2 text-black hover:bg-gray-200 border border-gray-300 rounded text-sm flex justify-center"
                    onClick={() => onSnooze(4 * 60 * 60 * 1000)}
                  >
                    Snooze 4h
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  if (!data?.id) return;
                  const url = `https://mail.google.com/mail/u/0/#all/${data.id}`;
                  window.open(url, "_blank");
                }}
                className="px-4 py-2 text-black hover:bg-gray-200 border border-gray-300 rounded text-sm flex justify-center w-full xl:w-auto"
              >
                Open in Gmail
              </button>
            </div>
          </div>
        </div>

        {/* REPLY BOX */}
        {isReply && (
          <div className="bg-white m-0 sm:m-2 mb-20 sm:mb-2 rounded-none sm:rounded shadow p-3 border-t sm:border-0">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message..."
              className="w-full min-h-[150px] border border-gray-300 rounded p-3 text-black focus:outline-none focus:border-blue-500"
            />

            {replyAttachments.length > 0 && (
              <div className="mt-3">
                <AttachmentList
                  attachments={replyAttachments}
                  emailId=""
                  onRemove={handleRemoveReplyAttachment}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                disabled={replyMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm flex-1 sm:flex-none justify-center"
                onClick={() => {
                  if (!message.trim()) return alert("Message cannot be empty");

                  replyMutation.mutate({
                    to: data.recipients[0]?.email ?? "",
                    subject: `Re: ${data.subject}`,
                    html: message,
                    files: replyFiles.length > 0 ? replyFiles : undefined,
                  });
                }}
              >
                {replyMutation.isPending ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <SendHorizonal size={18} />
                    Send
                  </>
                )}
              </button>

              <button
                className="px-4 py-2 text-black hover:bg-gray-200 border border-gray-300 rounded flex items-center gap-2 text-sm flex-1 sm:flex-none justify-center"
                onClick={() => replyFileInputRef.current?.click()}
              >
                <Paperclip size={18} />
                Attach
              </button>

              <button
                className="px-4 py-2 text-red-600 hover:bg-red-50 border border-gray-300 rounded flex items-center gap-2 text-sm ml-auto sm:ml-0"
                onClick={() => {
                  setIsReply(false);
                  setMessage("");
                  setReplyAttachments([]);
                  setReplyFiles([]);
                }}
              >
                <Trash size={18} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>

            <input
              type="file"
              multiple
              ref={replyFileInputRef}
              className="hidden"
              onChange={handleReplyFileChange}
            />
          </div>
        )}
      </div>
    </Suspense>
  );
};
