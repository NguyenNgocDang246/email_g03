"use client";
import { Header } from "../../components/Layout/Header";
import { Sidebar } from "../../components/Layout/Sidebar";
import { useState } from "react";

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState("inbox");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="h-screen flex flex-col bg-gray-50 w-screen">
      <Header
        onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block w-1/5 bg-white">
          <Sidebar
            selectedMailbox={selectedMailbox}
            setSelectedMailbox={setSelectedMailbox}
          />
        </div>

        <main className="flex w-4/5">{children}</main>
      </div>
    </div>
  );
}
