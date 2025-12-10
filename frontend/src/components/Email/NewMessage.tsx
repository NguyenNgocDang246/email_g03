import { useState, useRef } from "react";
import { useMail } from "../../context/MailContext";
import { SendHorizontalIcon, Trash, Paperclip } from "lucide-react";
import { AttachmentList } from "../UI/AttachmentList";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendEmail, type Attachment, type SendEmailPayload } from "../../api/inbox";

interface NewMessageProps {
  mailboxId: string;
}

const NewMessage: React.FC<NewMessageProps> = ({ mailboxId }) => {
  const [to, setTo] = useState<string>("");
  const [cc, setCc] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const { selectOnNewMail, setSelectOnNewMail } = useMail();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  // Chọn file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray: Attachment[] = Array.from(e.target.files).map((file) => ({
      id: crypto.randomUUID(),
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));
    setAttachments((prev) => [...prev, ...filesArray]);
    e.target.value = "";
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  // useMutation gửi email
  const mutation = useMutation({
    mutationFn: (payload: SendEmailPayload) => sendEmail(payload),
    onSuccess: (data) => {
      alert(data.message);
      setTo("");
      setCc("");
      setSubject("");
      setBody("");
      setAttachments([]);
      setSelectOnNewMail(false);
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Gửi email thất bại!";
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
    });
  };

  return (
    <div
      className={`border rounded-md bg-white shadow py-2 w-full h-full max-w-3xl mx-auto flex flex-col justify-between ${
        selectOnNewMail ? "block" : "hidden"
      }`}
    >
      <div>
        {/* Send Row */}
        <div className="flex justify-between items-center px-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex items-center gap-2 justify-center font-medium shadow-md transition-colors disabled:opacity-50"
            >
              <SendHorizontalIcon size={18} />
            </button>
          </div>
          <div className="flex justify-between gap-3">
            <Paperclip
              size={18}
              className="text-gray-500 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            />
            <Trash
              size={18}
              className="text-gray-500"
              onClick={() => setSelectOnNewMail(false)}
            />
            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="border-b border-gray-300 w-full"></div>

        {/* To */}
        <div className="flex items-center border-b py-2 px-4">
          <div className="w-16 font-medium text-black border border-gray-200 text-center rounded">
            To
          </div>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="flex-1 outline-none border-b border-gray-200 mx-2 text-black"
          />
        </div>

        {/* Cc */}
        <div className="flex items-center border-b py-2 px-4">
          <div className="w-16 font-medium text-black border border-gray-200 text-center rounded">
            Cc
          </div>
          <input
            type="text"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            className="flex-1 outline-none border-b border-gray-200 mx-2 text-black"
          />
        </div>

        {/* Subject */}
        <div className="border-b p-2 px-4">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full outline-none border-b border-b-gray-200 text-black"
            placeholder="Add subject"
          />
        </div>

        {/* Body */}
        <div className="p-2 h-64 px-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-full outline-none resize-none text-black"
            placeholder="Nhập / để chèn tệp và nội dung khác"
          ></textarea>
        </div>
      </div>

      <div className="p-4">
        {attachments.length > 0 && (
          <AttachmentList
            attachments={attachments}
            onRemove={handleRemoveAttachment}
          />
        )}
      </div>
    </div>
  );
};

export default NewMessage;
