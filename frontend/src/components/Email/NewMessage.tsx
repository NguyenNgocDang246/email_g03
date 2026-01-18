import { useState, useRef } from "react";
import { useMail } from "../../context/MailContext";
import { SendHorizontalIcon, Trash, Paperclip, X } from "lucide-react"; // Thêm icon X để đóng trên mobile
import { AttachmentList } from "../UI/AttachmentList";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sendEmail,
  type Attachment,
  type SendEmailPayload,
} from "../../api/inbox";

interface NewMessageProps {
  mailboxId: string;
}

const NewMessage: React.FC<NewMessageProps> = ({ mailboxId }) => {
  const [to, setTo] = useState<string>("");
  const [cc, setCc] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const { selectOnNewMail, setSelectOnNewMail } = useMail();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setAttachments((prev) => [...prev, ...filesArray]);
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const handleRemoveAttachment = (id: string) => {
    const index = attachments.findIndex((att) => att.id === id);
    if (index !== -1) {
      setAttachments((prev) => prev.filter((att) => att.id !== id));
      setFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const mutation = useMutation({
    mutationFn: (payload: SendEmailPayload) => sendEmail(payload),
    onSuccess: (data) => {
      alert(data.message);
      setTo("");
      setCc("");
      setSubject("");
      setBody("");
      setAttachments([]);
      setFiles([]);
      setSelectOnNewMail(false);
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Gửi email thất bại!";
      alert(message);
    },
  });

  const handleSend = () => {
    if (!to || !body) {
      alert("Vui lòng nhập địa chỉ người nhận và nội dung email.");
      return;
    }

    mutation.mutate({
      to,
      subject,
      html: body,
      files: files.length > 0 ? files : undefined,
    });
  };


  if (!selectOnNewMail) return null;

  return (
    <div
      className={`
        bg-white flex flex-col
        // Mobile: Full screen, đè lên tất cả
        fixed inset-0 z-50 h-[100dvh] w-full
        // Desktop: Trở về dạng khối nằm trong layout chính
        sm:static sm:h-full sm:max-w-3xl sm:mx-auto sm:border sm:rounded-md sm:shadow sm:z-auto
      `}
    >
      {/* HEADER / TOOLBAR */}
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSend}
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 sm:px-6 py-2 rounded-full sm:rounded flex items-center gap-2 justify-center font-medium shadow-sm transition-colors text-sm sm:text-base"
          >
            {mutation.isPending ? (
              <span className="animate-pulse">Sending...</span>
            ) : (
              <>
                <SendHorizontalIcon size={18} />
                <span>Gửi</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-600"
            title="Đính kèm file"
          >
            <Paperclip size={20} />
          </button>

          <button
            onClick={() => setSelectOnNewMail(false)}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-600 sm:hidden"
            title="Đóng"
          >
            <X size={20} />
          </button>

          <button
            onClick={() => setSelectOnNewMail(false)}
            className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full text-gray-600 hidden sm:block"
            title="Hủy & Xóa"
          >
            <Trash size={20} />
          </button>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* FORM INPUTS */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* To */}
        <div className="flex items-center border-b border-gray-100 py-3 px-4">
          <span className="w-10 sm:w-16 text-sm font-medium text-gray-500">
            To
          </span>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="flex-1 outline-none text-black text-base placeholder:text-sm"
            placeholder="Người nhận..."
          />
        </div>

        {/* Cc */}
        <div className="flex items-center border-b border-gray-100 py-3 px-4">
          <span className="w-10 sm:w-16 text-sm font-medium text-gray-500">
            Cc
          </span>
          <input
            type="text"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            className="flex-1 outline-none text-black text-base placeholder:text-sm"
          />
        </div>

        {/* Subject */}
        <div className="border-b border-gray-100 py-3 px-4">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full outline-none text-black font-medium text-base placeholder:font-normal"
            placeholder="Chủ đề"
          />
        </div>

        {/* Body - Flex-1 để chiếm hết không gian còn lại */}
        <div className="flex-1 p-4 min-h-[200px]">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-full outline-none resize-none text-black text-base leading-relaxed"
            placeholder="Soạn nội dung email..."
          ></textarea>
        </div>

        {/* Attachments Area */}
        {attachments.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <AttachmentList
              attachments={attachments}
              emailId=""
              onRemove={handleRemoveAttachment}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NewMessage;
