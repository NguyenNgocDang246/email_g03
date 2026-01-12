import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Star, RefreshCcw, Paperclip } from "lucide-react";
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
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
    mailBoxId,
    emailId,
    onMarkAsUnread,
    onDelete,
    onSnooze,
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
            FORBID_TAGS: [
                "style",
                "meta",
                "title",
                "head",
                "html",
                "body",
                "script",
            ],
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
            const message =
                error instanceof Error ? error.message : "Reply failed!";
            alert(message);
        },
    });

    if (isLoading)
        return (
            <p className="text-center  font-bold text-gray-400 mt-10">
                Loading...
            </p>
        );

    if (error)
        return (
            <p className="text-center mt-10 text-red-600">
                Error loading email
            </p>
        );

    if (!emailId || !data) {
        return (
            <div
                className={`w-full h-screen  ${
                    selectOnNewMail ? "hidden" : "block"
                }`}
            >
                <div className="h-full flex justify-center items-center text-gray-400">
                    <div className="text-center">
                        <Mail className="w-24 h-24 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">
                            Select an email to view details
                        </p>
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
                        <h1 className="text-xl font-semibold text-black ">
                            {data.subject}
                        </h1>
                    </div>
                </div>

                <div className="bg-white m-2 rounded shadow p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-sm font-semibold text-black">
                                AI Summary
                            </p>
                            <p className="text-xs text-gray-500">
                                Tóm tắt email và metadata liên quan
                            </p>
                        </div>
                        <button
                            onClick={handleRefreshSummary}
                            className="flex items-center gap-2 px-3 py-1 rounded-md border text-xs text-gray-700 hover:bg-gray-100"
                        >
                            <RefreshCcw size={14} />
                            Làm mới
                        </button>
                    </div>
                    {isSummaryLoading && (
                        <p className="text-xs text-gray-500">
                            Đang sinh tóm tắt...
                        </p>
                    )}
                    {summaryError && (
                        <p className="text-xs text-red-500">
                            {(summaryError as Error)?.message ||
                                "Không lấy được summary"}
                        </p>
                    )}
                    {summaryData && (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                {summaryData.summary ||
                                    "Chưa có summary cho email này"}
                            </p>
                            {summaryData.metadata && (
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(summaryData.metadata).map(
                                        ([key, value]) => (
                                            <div
                                                key={key}
                                                className="text-[11px] text-gray-500 bg-gray-50 rounded p-2"
                                            >
                                                <span className="font-semibold text-gray-700">
                                                    {key}:
                                                </span>{" "}
                                                <span>{String(value)}</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {!isSummaryLoading && !summaryData && !summaryError && (
                        <p className="text-xs text-gray-500">
                            Chưa có summary sẵn.
                        </p>
                    )}
                </div>

                {/* SENDER + RECIPIENTS + BODY */}
                <div className="bg-white m-2 rounded shadow p-3">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {data.sender?.name?.charAt(0) ??
                                data.sender.email.charAt(0)}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-black">
                                    {data.sender?.name ?? data.sender.email} (
                                    {data.sender.email})
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
                                To:{" "}
                                {data.recipients.map((r) => r.email).join(", ")}
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
                        <div className="pl-12 pr-3 my-4 flex">
                            <div
                                className="text-black break-words"
                                dangerouslySetInnerHTML={{ __html: cleanHtml }}
                            />
                        </div>

                        {data.attachments && data.attachments.length > 0 && (
                            <AttachmentList
                                attachments={data.attachments}
                                emailId={data.id}
                                onRemove={() => {}}
                            />
                        )}
                        {/* ACTION BUTTONS */}
                        <div className="flex items-center justify-between mt-6">
                            <div className="flex items-center gap-2">
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
                                {onSnooze && (
                                    <button
                                        className="px-4 py-2 text-black hover:bg-gray-200 border border-gray-300 rounded"
                                        onClick={() =>
                                            onSnooze(4 * 60 * 60 * 1000)
                                        }
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
                                className="px-4 py-2 text-black hover:bg-gray-200 border border-gray-300 rounded"
                            >
                                Open in Gmail
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

                        {replyAttachments.length > 0 && (
                            <div className="mt-3">
                                <AttachmentList
                                    attachments={replyAttachments}
                                    emailId=""
                                    onRemove={handleRemoveReplyAttachment}
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2 mt-6">
                            {/* SEND BUTTON */}
                            <button
                                disabled={replyMutation.isPending}
                                className="px-4 py-2 hover:bg-gray-200 border border-gray-300 rounded text-black flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                onClick={() => {
                                    if (!message.trim())
                                        return alert("Message cannot be empty");

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

                            {/* ATTACH FILE BUTTON */}
                            <button
                                className="px-4 py-2 text-black hover:bg-gray-200 border border-gray-300 rounded flex items-center gap-2"
                                onClick={() => replyFileInputRef.current?.click()}
                            >
                                <Paperclip size={18} />
                                Attach
                            </button>

                            {/* DELETE / CANCEL BUTTON */}
                            <button
                                className="px-4 py-2 text-black hover:bg-gray-200 border border-gray-300 rounded flex items-center gap-2"
                                onClick={() => {
                                    setIsReply(false);
                                    setMessage("");
                                    setReplyAttachments([]);
                                    setReplyFiles([]);
                                }}
                            >
                                <Trash size={18} />
                                Delete
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
