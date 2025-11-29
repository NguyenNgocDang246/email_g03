import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useNavigate } from "react-router-dom";
import { getMailBoxesInfo } from "../../api/inbox";
import { ComposeButton } from "../UI/ComposeButton";

interface SidebarProps {
    selectedMailbox: string;
    setSelectedMailbox: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    selectedMailbox,
    setSelectedMailbox,
}) => {
    const navigate = useNavigate();
    // if (!accessToken) {
    //   navigate("/login");
    //   return null;
    // }

    const {
        data = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["mailboxesInfo"],
        queryFn: () => getMailBoxesInfo(),
        retry: false,
        refetchOnWindowFocus: false,
        // enabled: !!accessToken,
    });

    if (isLoading) return <p className="text-center mt-10">Loading...</p>;
    if (error)
        return (
            <p className="text-center mt-10 text-red-600">
                Error loading mailboxes info
            </p>
        );

    return (
        <div className="w-full border-r border-gray-200  overflow-y-auto ">
            <div className="p-4">
                <ComposeButton />
            </div>
            <nav className="px-2">
                {data.map((mailbox) => (
                    <button
                        key={mailbox.id}
                        onClick={() => {
                            setSelectedMailbox(mailbox.id);
                            navigate(`/mailbox/${mailbox.id}`);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-left mb-1 transition-colors ${
                            selectedMailbox === mailbox.id
                                ? "bg-red-100 text-red-600 font-medium"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                    >
                        {/* <span className="text-xl">{mailbox.icon}</span> */}
                        <span className="flex-1">{mailbox.name}</span>
                        {mailbox.unreadCount > 0 && (
                            <span className="text-sm font-semibold">
                                {mailbox.unreadCount}
                            </span>
                        )}
                    </button>
                ))}
            </nav>
        </div>
    );
};
