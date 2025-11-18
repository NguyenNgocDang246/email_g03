import React from "react";
import { ChevronLeft, Star, Mail } from "lucide-react";
import type { Email } from "../../data/mockData";

interface EmailDetailProps {
  email: Email | null;
  onToggleStar: (
    emailId: number,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => void;
  onMarkAsUnread: () => void;
  onDelete: () => void;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  email,
  onToggleStar,
  onMarkAsUnread,
  onDelete,
}) => {
  if (!email) {
    return (
      <div className="p-6 bg-white w-2/3">
        <div className="h-full flex  justify-center items-center text-gray-400 p-6">
          <div className="text-center">
            <Mail className="w-24 h-24 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Select an email to view details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
 
      <div className="p-6 w-2/3 bg-white">

        <div className="mb-6">
          <h1 className="text-xl font-semibold mb-4 text-black">{email.subject}</h1>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-black font-semibold">
              {email.from.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-black">{email.from}</span>
                <button
                  onClick={(e) => onToggleStar(email.id, e)}
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
              </div>
              <p className="text-gray-500 text-sm">{email.timestamp}</p>
            </div>
          </div>

          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />
        </div>

        <div className="flex items-center gap-2 mt-6">
          <button
            className="px-4 py-2 bg-green-500 rounded hover:bg-gray-300 text-black font-medium"
            onClick={onMarkAsUnread}
          >
            Mark as unread
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>

  );
};
