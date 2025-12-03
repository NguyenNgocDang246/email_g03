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
    emailId:string,
    isStar:boolean,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => void;
  // onCheckboxChange: (
  //   emailId: number,
  //   e: React.ChangeEvent<HTMLInputElement>
  // ) => void;
}

export const EmailListItem: React.FC<EmailListItemProps> = ({
  email,
  isSelected,
  isChecked,
  onSelect,
  onToggleStar,
  // onCheckboxChange,
}) => {

  const {setSelectOnNewMail}=useMail()
  
  return (
    <div
      onClick={() => {
        setSelectOnNewMail(false);
        onSelect(email);
        
      }}
      className={`flex items-center gap-3 px-4 py-3 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow ${
        isSelected ? "bg-blue-50" : ""
      } ${!email.isRead ? "bg-white" : "bg-gray-50"}`}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) =>{}}
        className="w-4 h-4 rounded"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => {onToggleStar(email.id,email.isStarred,e);}}
        className="p-1 hover:bg-gray-200 rounded"
      >
        <Star
          className={`w-4 h-4 ${
            email.isStarred
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-400"
          }`}
        />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm truncate ${
              !email.isRead ? "text-gray-500" : "font-medium text-black"
            }`}
          >
            {email.from}
          </span>
          <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">
            {email.timestamp}
          </span>
        </div>
        <div
          className={`text-sm truncate ${
            !email.isRead ? "text-gray-500" : "font-medium text-black"
          }`}
        >
          {email.subject}
        </div>
        <div className="text-xs text-gray-500 truncate ">{email.preview}</div>
      </div>
    </div>
  );
};
