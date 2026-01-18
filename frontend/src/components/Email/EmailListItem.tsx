import React from "react";
import { Star } from "lucide-react";
import type { MailInfo } from "../../api/inbox";
import { useMail } from "../../context/MailContext";

interface EmailListItemProps {
  email: MailInfo;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: (email: MailInfo) => void;
  onToggleStar: (
    emailId: string,
    isStar: boolean,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => void;
}

export const EmailListItem: React.FC<EmailListItemProps> = ({
  email,
  isSelected,
  isChecked,
  onSelect,
  onToggleStar,
}) => {
  const { setSelectOnNewMail } = useMail();

  return (
    <div
      onClick={() => {
        setSelectOnNewMail(false);
        onSelect(email);
      }}
      className={`
        group flex items-start sm:items-center 
        gap-2 sm:gap-3 
        p-3 sm:px-4 sm:py-3 
        border-b border-gray-100 cursor-pointer 
        hover:shadow-md transition-all
        ${
          isSelected
            ? "bg-blue-50 border-l-4 border-l-blue-600"
            : "border-l-4 border-l-transparent"
        }
        ${!email.isRead ? "bg-white font-semibold" : "bg-gray-50/50"}
      `}
    >
      {/* Checkbox: Ẩn trên mobile để tiết kiệm chỗ, hiện trên desktop */}
      <div
        className="hidden sm:flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => {}} // Controlled by parent usually
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {/* Star Button */}
      <button
        onClick={(e) => {
          onToggleStar(email.id, email.isStarred, e);
        }}
        className="mt-0.5 sm:mt-0 p-1 hover:bg-gray-200 rounded-full transition-colors shrink-0"
      >
        <Star
          className={`w-4 h-4 sm:w-5 sm:h-5 ${
            email.isStarred
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300 group-hover:text-gray-400"
          }`}
        />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        {/* Row 1: Sender & Time */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm sm:text-base truncate ${
              email.isRead ? "text-gray-600" : "text-black"
            }`}
          >
            {email.from}
          </span>
          <span
            className={`text-[10px] sm:text-xs whitespace-nowrap ${
              !email.isRead ? "text-blue-600 font-bold" : "text-gray-400"
            }`}
          >
            {email.timestamp}
          </span>
        </div>

        {/* Row 2: Subject */}
        <div
          className={`text-sm truncate leading-tight ${
            email.isRead ? "text-gray-500" : "text-gray-800"
          }`}
        >
          {email.subject}
        </div>

        {/* Row 3: Preview */}
        <div className="text-xs text-gray-400 truncate leading-tight">
          {email.preview}
        </div>
      </div>
    </div>
  );
};
