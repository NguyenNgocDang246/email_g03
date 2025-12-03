import { FiFile, FiImage, FiTrash2 } from "react-icons/fi";
import { HiDocumentText } from "react-icons/hi";

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  previewUrl?: string; // optional, chỉ dùng với hình ảnh
}

interface AttachmentListProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onRemove,
}) => {
  const mimeMap: Record<string, string> = {
    "application/pdf": "PDF",
    "application/msword": "DOC",
    "vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "image/png": "PNG",
    "image/jpeg": "JPG",
    "image/jpg": "JPG",
    "image/gif": "GIF",
    "text/plain": "TXT",
  };

  return (
    <div className="mt-6 w-full">
      <h3 className="font-medium text-black mb-2">Attachments</h3>
      <ul className="flex overflow-x-auto space-x-2 py-2 scrollbar">
        {attachments.map((att) => {
          const fileSizeKB = (att.size / 1024).toFixed(1);
          const maxLength = 25;
          const displayName =
            att.filename && att.filename.length > 0
              ? att.filename.length > maxLength
                ? att.filename.slice(0, maxLength - 3) + "..."
                : att.filename
              : "No Tittle";

          const mimeType = att.mimeType.split("/")[1]?.toLowerCase() || "file";
          const displayType = mimeMap[mimeType] || mimeType.toUpperCase();

          let IconComponent;
          let iconColor = "text-gray-600";
          if (att.mimeType === "application/pdf") {
            IconComponent = HiDocumentText;
            iconColor = "text-red-600";
          } else if (att.mimeType.startsWith("image/")) {
            IconComponent = FiImage;
            iconColor = "text-green-600";
          } else {
            IconComponent = FiFile;
            iconColor = "text-gray-600";
          }

          return (
            <li key={att.id} className="shrink-0 w-48">
              <div className="flex justify-between items-center p-2 bg-gray-100 rounded hover:bg-gray-200 transition">
                <IconComponent className={`w-6 h-6 ${iconColor}`} />
                <div className="flex-1 min-w-0 ml-2">
                  <p className="font-medium text-gray-800 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500">
                    {displayType} • {fileSizeKB} KB
                  </p>
                </div>
                <button
                  onClick={() => onRemove(att.id)}
                  className="text-red-500 hover:text-red-700 ml-3 p-1"
                  title="Xóa"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
