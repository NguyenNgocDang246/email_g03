"use client";
import { Header } from "../../components/Layout/Header";
import { Sidebar } from "../../components/Layout/Sidebar";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState("inbox");
  const [searchQuery, setSearchQuery] = useState("");

   useEffect(() => {
     if (id) {
       setSelectedMailbox(id);
     }
   }, [id]);

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
