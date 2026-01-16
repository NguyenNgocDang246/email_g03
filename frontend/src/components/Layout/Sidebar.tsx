import { useQuery } from "@tanstack/react-query";
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getMailBoxesInfo } from "../../api/inbox";
import { useMail } from "../../context/MailContext";
import {
  MailPlus,
  ChevronDown,
  ChevronUp,
  Inbox,
  Send,
  Archive,
  Trash2,
  File,
  Star,
} from "lucide-react";

interface SidebarProps {
  selectedMailbox: string;
  setSelectedMailbox: (id: string) => void;
}

// Helper to get icon based on mailbox name
const getMailboxIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("inbox")) return <Inbox size={18} />;
  if (lower.includes("sent")) return <Send size={18} />;
  if (lower.includes("draft")) return <File size={18} />;
  if (lower.includes("trash") || lower.includes("bin"))
    return <Trash2 size={18} />;
  if (lower.includes("star") || lower.includes("important"))
    return <Star size={18} />;
  return <Archive size={18} />;
};

export const Sidebar: React.FC<SidebarProps> = ({
  selectedMailbox,
  setSelectedMailbox,
}) => {
  const navigate = useNavigate();
  const { setSelectOnNewMail } = useMail();
  const [isExpanded, setIsExpanded] = useState(false);
  const LIMIT = 7;

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["mailboxesInfo"],
    queryFn: () => getMailBoxesInfo(),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { primaryList, secondaryList } = useMemo(() => {
    if (!data) return { primaryList: [], secondaryList: [] };
    return {
      primaryList: data.slice(0, LIMIT),
      secondaryList: data.slice(LIMIT),
    };
  }, [data]);

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  const renderMailboxItem = (mailbox: any) => {
    const lowerCaseName = mailbox.name.toLowerCase().replace(/_/g, " ");
    const formaterName =
      lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.slice(1);

    return (
      <button
        key={mailbox.id}
        onClick={() => {
          setSelectedMailbox(mailbox.id);
          navigate(`/mailbox/${mailbox.id}`);
        }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 sm:py-2 rounded-r-full sm:rounded-md text-left mb-1 transition-colors ${
          selectedMailbox === mailbox.id
            ? "bg-blue-100 text-blue-700 font-semibold"
            : "hover:bg-gray-100 text-gray-700"
        }`}
      >
        <span className="shrink-0">{getMailboxIcon(mailbox.name)}</span>
        <span className="flex-1 truncate text-sm sm:text-base">
          {formaterName}
        </span>
        {/* Giả sử có count thì hiển thị ở đây */}
        {/* <span className="text-xs font-semibold">12</span> */}
      </button>
    );
  };

  if (isLoading)
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        Loading folders...
      </div>
    );
  if (error)
    return (
      <div className="p-4 text-center text-red-500 text-sm">
        Error loading folders
      </div>
    );

  return (
    <div className="w-full h-full flex flex-col bg-white sm:border-r border-gray-200">
      {/* Compose Button - Fixed at top */}
      <div className="p-3 sm:p-4 flex-none">
        <button
          onClick={() => setSelectOnNewMail(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-3 rounded-xl sm:rounded-lg flex items-center gap-3 justify-center font-medium shadow-md transition-all group"
        >
          <MailPlus size={20} />
          <span className="font-medium">New Email</span>
        </button>
      </div>

      {/* Mailbox List - Scrollable */}
      <nav className="flex-1 overflow-y-auto px-0 sm:px-2 pb-20 sm:pb-4 scrollbar">
        <div className="mb-1">{primaryList.map(renderMailboxItem)}</div>

        {secondaryList.length > 0 && (
          <div className="mt-2 px-4 sm:px-0">
            <button
              onClick={toggleExpand}
              className="w-full flex items-center gap-2 px-2 py-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {isExpanded ? "Show Less" : "Show More"}
            </button>
          </div>
        )}

        {isExpanded && (
          <div className="mt-1 animate-in slide-in-from-top-2 fade-in duration-200">
            {secondaryList.map(renderMailboxItem)}
          </div>
        )}
      </nav>
    </div>
  );
};
