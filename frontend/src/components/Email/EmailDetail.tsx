import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Star, RefreshCcw } from "lucide-react";
import React, { Suspense, useState } from "react";
import { getEmailDetail, replyEmail, type ReplyEmailPayload } from "../../api/inbox";
import { Trash } from "lucide-react";
import { SendHorizonal } from "lucide-react";
import { useMail } from "../../context/MailContext";
import { AttachmentList } from "../UI/AttachmentList";
import { summarizeEmail } from "../../api/ai";

interface EmailDetailProps {
  mailBoxId:string;
  emailId: string|null;
  onMarkAsUnread: () => void;
  onDelete: () => void;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  mailBoxId,
  emailId,
  onMarkAsUnread,
  onDelete,
}) => {
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
    queryFn: () => summarizeEmail(emailId!),
    enabled: !!emailId,
    staleTime: 1000 * 60 * 10,
  });

  const queryClient = useQueryClient();

  const { selectOnNewMail } = useMail();
  const [message, setMessage] = useState("");
  const [isReply, setIsReply] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ["mailDetailInfo", emailId] });
      queryClient.invalidateQueries({ queryKey: ["emails", mailBoxId] });
    },

    onError: (error: any) => {
      alert(error.message || "Reply failed!");
    },
  });


  if (isLoading) return <p className="text-center mt-10">Loading...</p>;

  if (error)
    return (
      <p className="text-center mt-10 text-red-600">Error loading email</p>
    );

  if (!emailId || !data) {
    return (
      <div
        className={`w-full h-screen ${selectOnNewMail ? "hidden" : "block"}`}
      >
        <div className="h-full flex justify-center items-center text-gray-400">
          <div className="text-center">
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
        className={`scrollbar overflow-y-auto h-full ${
          selectOnNewMail ? "hidden" : "block"
        }`}
      >
        {/* HEADER */}
        <div className="bg-white m-2 rounded shadow">
          <div className="p-3">
            <h1 className="text-xl font-semibold text-black">{data.subject}</h1>
          </div>
        </div>

        <div className="bg-white m-2 rounded shadow p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-black">AI Summary</p>
              <p className="text-xs text-gray-500">
                Tóm tắt email và metadata liên quan
              </p>
            </div>
            <button
              onClick={() => refetchSummary()}
              className="flex items-center gap-2 px-3 py-1 rounded-md border text-xs text-gray-700 hover:bg-gray-100"
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
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {summaryData.summary || "Chưa có summary cho email này"}
              </p>
              {summaryData.metadata && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(summaryData.metadata).map(([key, value]) => (
                    <div
                      key={key}
                      className="text-[11px] text-gray-500 bg-gray-50 rounded p-2"
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
        <div className="bg-white m-2 rounded shadow p-3">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {data.sender?.name?.charAt(0) ?? data.sender.email.charAt(0)}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-black">
                  {data.sender?.name ?? data.sender.email} ({data.sender.email})
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

              <p className="text-gray-500 text-sm">
                To: {data.recipients.map((r) => r.email).join(", ")}
              </p>
              <p className="text-gray-400 text-xs">{data.date}</p>
            </div>

            <Trash
              size={18}
              className="text-gray-500 hover:text-red-500"
              onClick={onDelete}
            />
          </div>

          <div className="pl-12 pr-3 my-4">
            <div
              className="prose max-w-none text-black"
              dangerouslySetInnerHTML={{ __html: data.bodyHtml ?? "" }}
            />

            {data.attachments && data.attachments.length > 0 && (
              <AttachmentList
                attachments={data.attachments}
                onRemove={() => {}}
              />
            )}
            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 mt-6">
              <button
                className="px-4 py-2 hover:bg-gray-200 border border-gray-300 rounded text-black"
                onClick={onMarkAsUnread}
              >
                Mark as unread
              </button>
              <button
                className="px-4 py-2 text-black hover:bg-gray-200 border border-gray-300 rounded"
                onClick={() => setIsReply(true)}
              >
                Reply
              </button>
            </div>
          </div>
        </div>

        {/* REPLY BOX */}
        {isReply && (
          <div className="bg-white m-2 rounded shadow p-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message..."
              className="w-full min-h-[150px] border border-gray-300 rounded p-3 text-black focus:outline-none focus:border-blue-500"
            />

            <div className="flex items-center gap-2 mt-6">
              {/* SEND BUTTON */}
              <button
                disabled={replyMutation.isPending}
                className="px-4 py-2 hover:bg-gray-200 border border-gray-300 rounded text-black flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => {
                  if (!message.trim()) return alert("Message cannot be empty");

                  replyMutation.mutate({
                    to: data.recipients[0]?.email ?? "",
                    subject: `Re: ${data.subject}`,
                    html: message,
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

              {/* DELETE / CANCEL BUTTON */}
              <button
                className="px-4 py-2 text-black hover:bg-gray-200 border border-gray-300 rounded flex items-center gap-2"
                onClick={() => {
                  setIsReply(false);
                  setMessage("");
                }}
              >
                <Trash size={18} />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
};
