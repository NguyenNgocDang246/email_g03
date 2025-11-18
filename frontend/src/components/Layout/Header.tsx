import React from "react";
import { Menu, Search, HelpCircle, Settings, Grid3x3, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { setAccessToken } from "../../api/baseAPI";

interface HeaderProps {
  onMenuToggle: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setAccessToken(null);
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("email");
    window.location.href = "/";
  };
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    const params = new URLSearchParams(location.search);
    if (value) {
      params.set("query", value);
    } else {
      params.delete("query");
    }

    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  };

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
      <div className="flex-1 max-w-2xl mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm mail"
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
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
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          K
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition cursor-pointer"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
};
