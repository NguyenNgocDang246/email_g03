import React, { useEffect, useRef, useState } from "react";
import { Menu, HelpCircle, Settings, Grid3x3, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { SearchBar, type SearchMode } from "../Search/SearchBar";

interface HeaderProps {
  onMenuToggle: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchMode: SearchMode;
  setSearchMode: (mode: SearchMode) => void;
  searchSuggestions: string[];
}

export const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  searchQuery,
  setSearchQuery,
  searchMode,
  setSearchMode,
  searchSuggestions,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
  };
  const updateSearchParams = (nextQuery: string, nextMode: SearchMode) => {
    const params = new URLSearchParams(location.search);
    if (nextQuery) {
      params.set("query", nextQuery);
    } else {
      params.delete("query");
    }
    if (nextMode) {
      params.set("mode", nextMode);
    } else {
      params.delete("mode");
    }
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateSearchParams(value, searchMode);
  };

  const handleSearchSubmit = (value: string) => {
    const trimmedValue = value.trim();
    setSearchQuery(trimmedValue);
    updateSearchParams(trimmedValue, searchMode);
  };

  const handleSearchModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    updateSearchParams(searchQuery, mode);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b w-full border-gray-200 px-4 py-2 flex items-center justify-between gap-4 sticky top-0 z-20 ">
      <button className="lg:hidden p-2 hover:bg-gray-100 rounded-full" onClick={onMenuToggle}>
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
        <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
          M
        </div>
        <span className="text-xl text-gray-700 hidden sm:inline">Mail</span>
      </div>
      <div className="flex-1 max-w-2xl mx-4">
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          onSubmit={handleSearchSubmit}
          suggestions={searchSuggestions}
          mode={searchMode}
          onModeChange={handleSearchModeChange}
          placeholder="Tìm kiếm mail"
          className="shadow-none border-0 p-0"
          variant="inline"
        />
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
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <div
              className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              {user.email[0].toUpperCase()}
            </div>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                <div
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 text-sm">Settings</span>
                </div>
                <div
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Logout</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition cursor-pointer"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
};
