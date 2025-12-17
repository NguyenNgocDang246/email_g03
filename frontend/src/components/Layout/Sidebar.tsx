import { useQuery } from "@tanstack/react-query";
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getMailBoxesInfo } from "../../api/inbox";
import { useMail } from "../../context/MailContext";
import { MailPlus, ChevronDown, ChevronUp } from "lucide-react";

interface SidebarProps {
  selectedMailbox: string;
  setSelectedMailbox: (id: string) => void;
}

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

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

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
        className={`w-full flex items-center gap-3 px-4 py-2 rounded text-left mb-1 transition-colors ${
          selectedMailbox === mailbox.id
            ? "bg-red-100 text-red-600 font-medium"
            : "hover:bg-gray-200 text-gray-700"
        }`}
      >
        <span className="flex-1">{formaterName}</span>
      </button>
    );};


  if (isLoading) return <p className="text-center mt-10">Loading...</p>;
  if (error)
    return (
      <p className="text-center mt-10 text-red-600">
        Error loading mailboxes info
      </p>
    );

  return (
    // 1. Thay đổi container chính: flex flex-col và h-full (hoặc h-screen tùy layout cha)
    <div className="w-full h-full flex flex-col border-r border-gray-200 bg-white">
      {/* 2. Phần nút New Email: flex-none để giữ nguyên chiều cao, không bị co lại */}
      <div className="px-2 py-4 flex-none">
        <button
          onClick={() => setSelectOnNewMail(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded flex items-center gap-2 justify-center font-medium shadow-md transition-colors"
        >
          <MailPlus size={18} />
          New Email
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 scrollbar">
        <div className="mb-1">{primaryList.map(renderMailboxItem)}</div>

        {secondaryList.length > 0 && (
          <div className="my-2">
            <button
              onClick={toggleExpand}
              className="w-full flex items-center  gap-1 px-4 py-2 rounded text-blue-600 hover:bg-blue-50 transition-colors text-sm font-semibold"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={16} />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                   Show More
                </>
              )}
            </button>
          </div>
        )}

        {isExpanded && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {secondaryList.map(renderMailboxItem)}
          </div>
        )}
      </nav>
    </div>
  );
};
