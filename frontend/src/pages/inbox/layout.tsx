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

   useEffect(() => {
     if (id) {
       setSelectedMailbox(id);
     }
   }, [id]);

  return (
    <MailContext.Provider
      value={{
        selectOnNewMail,
        setSelectOnNewMail,
        searchSuggestions,
        setSearchSuggestions,
      }}>
      <div className="h-screen flex flex-col bg-gray-50 w-screen">
        <Header
          onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchMode={searchMode}
          setSearchMode={setSearchMode}
          searchSuggestions={searchSuggestions}
        />

        <div className="flex flex-1 overflow-hidden">
          <div className="hidden md:block w-1/5 bg-gray-100 ">
            <Sidebar
              selectedMailbox={selectedMailbox}
              setSelectedMailbox={setSelectedMailbox}
            />
          </div>

          <main className="flex w-4/5">{children}</main>
        </div>
      </div>
    </MailContext.Provider>
  );
}
