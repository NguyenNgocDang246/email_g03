import React from "react";
import { FiFile, FiImage, FiTrash2 } from "react-icons/fi";
import { HiDocumentText } from "react-icons/hi";

const backendURL = import.meta.env.VITE_BACKEND_URL;

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  previewUrl?: string;
}

interface AttachmentListProps {
  attachments: Attachment[];
  emailId: string;
  onRemove: (id: string) => void;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  emailId,
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

  const handleDownload = (index: number) => {
    const url = `${backendURL}/emails/${emailId}/attachments/${index}/stream`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-4 sm:mt-6 w-full">
      <h3 className="font-medium text-black mb-2 text-sm sm:text-base">
        Attachments ({attachments.length})
      </h3>

      {/* Responsive: overflow-x-auto allows horizontal scrolling on mobile */}
      <ul className="flex overflow-x-auto space-x-3 py-2 scrollbar pb-4 sm:pb-2">
        {attachments.map((att, index) => {
          const fileSizeKB = (att.size / 1024).toFixed(1);
          const maxLength = 25;
          const displayName =
            att.filename && att.filename.length > 0
              ? att.filename.length > maxLength
                ? att.filename.slice(0, maxLength - 3) + "..."
                : att.filename
              : "No Title";

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
            <li key={att.id} className="shrink-0 w-40 sm:w-48">
              <div
                className="group relative flex flex-col justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer h-full"
                onClick={() => handleDownload(index)}
                title="Click to download"
              >
                <div className="flex items-start justify-between mb-2">
                  <IconComponent
                    className={`w-6 h-6 sm:w-8 sm:h-8 ${iconColor}`}
                  />
                  {/* Remove Button - Larger touch area */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(att.id);
                    }}
                    className="text-gray-400 hover:text-red-500 p-1 -mr-2 -mt-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-xs sm:text-sm truncate break-words">
                    {displayName}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    {displayType} • {fileSizeKB} KB
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
