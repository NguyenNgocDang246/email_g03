"use client";
import { Header } from "../../components/Layout/Header";
import { Sidebar } from "../../components/Layout/Sidebar";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MailContext } from "../../context/MailContext";

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState("SENT");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">(
    "keyword"
  );
  const [selectOnNewMail, setSelectOnNewMail] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [onlyWithAttachments, setOnlyWithAttachments] = useState(false);

  useEffect(() => {
    if (id) {
      setSelectedMailbox(id);
    }
  }, [id]);

  // Đóng mobile menu khi id thay đổi (người dùng đã chọn xong)
  useEffect(() => {
    setShowMobileMenu(false);
  }, [id]);

  return (
    <MailContext.Provider
      value={{
        selectOnNewMail,
        setSelectOnNewMail,
        searchSuggestions,
        setSearchSuggestions,
        onlyWithAttachments,
        setOnlyWithAttachments,
      }}
    >
      <div className="h-[100dvh] w-full flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <Header
          onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchMode={searchMode}
          setSearchMode={setSearchMode}
          searchSuggestions={searchSuggestions}
        />

        <div className="flex flex-1 overflow-hidden relative">
          {/* --- DESKTOP SIDEBAR --- */}
          {/* Ẩn trên mobile, hiện trên desktop với độ rộng cố định w-64 (thay vì 1/5) */}
          <div className="hidden md:block w-64 bg-white border-r border-gray-200 flex-shrink-0">
            <Sidebar
              selectedMailbox={selectedMailbox}
              setSelectedMailbox={setSelectedMailbox}
            />
          </div>

          {/* --- MOBILE SIDEBAR (DRAWER) --- */}
          {/* Chỉ hiện khi showMobileMenu = true */}
          {showMobileMenu && (
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
              onClick={() => setShowMobileMenu(false)}
            >
              <div
                className="w-3/4 max-w-[300px] h-full bg-white shadow-xl animate-in slide-in-from-left duration-300"
                onClick={(e) => e.stopPropagation()} // Ngăn click vào sidebar làm đóng menu
              >
                <Sidebar
                  selectedMailbox={selectedMailbox}
                  setSelectedMailbox={(mailboxId) => {
                    setSelectedMailbox(mailboxId);
                    setShowMobileMenu(false); // Đóng menu sau khi chọn
                  }}
                />
              </div>
            </div>
          )}

          {/* --- MAIN CONTENT --- */}
          {/* flex-1 để chiếm hết không gian còn lại, w-full để đảm bảo rộng 100% trên mobile */}
          <main className="flex-1 w-full flex flex-col overflow-hidden bg-white">
            {children}
          </main>
        </div>
      </div>
    </MailContext.Provider>
  );
}
