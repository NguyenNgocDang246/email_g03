import React from "react";
import { Menu, HelpCircle, Settings, Grid3x3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuToggle: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const GuestHeader: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  return (
    <header className="bg-white border-b w-full border-gray-200 px-4 py-2 flex items-center justify-between gap-4 sticky top-0 z-20 ">
      <button className="lg:hidden p-2 hover:bg-gray-100 rounded-full" onClick={onMenuToggle}>
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
        <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center text-white font-bold">
          M
        </div>
        <span className="text-xl text-gray-700 hidden sm:inline">Gmail</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-100 rounded-full hidden sm:block">
          <HelpCircle className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full hidden sm:block">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full hidden sm:block">
          <Grid3x3 className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </header>
  );
};
