import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Menu,
  HelpCircle,
  Settings,
  Grid3x3,
  LogOut,
  Search,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

// --- SEARCH BAR COMPONENT ---
export type SearchMode = "keyword" | "semantic";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  suggestions?: string[];
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  placeholder?: string;
  className?: string;
  variant?: "card" | "inline";
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  suggestions = [],
  mode,
  onModeChange,
  placeholder = "Tìm kiếm...",
  className = "",
  variant = "card",
}) => {
  const baseClasses =
    variant === "inline"
      ? "p-0 bg-transparent"
      : "bg-white border border-gray-200 rounded-lg shadow-sm p-3";

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const filteredSuggestions = useMemo(() => {
    const keyword = value.trim().toLowerCase();
    if (!keyword) return [];
    return suggestions
      .filter((item) => item.toLowerCase().includes(keyword))
      .slice(0, 5);
  }, [suggestions, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (nextValue: string) => {
    if (!nextValue.trim()) return;
    onSubmit?.(nextValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={wrapperRef}
      className={`${baseClasses} flex flex-col gap-2 w-full ${className}`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(value);
              }
            }}
            placeholder={placeholder}
            // text-base on mobile prevents iOS zoom, sm:text-sm for desktop
            className="w-full pl-9 sm:pl-10 pr-3 py-2 rounded-md bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-base sm:text-sm placeholder:text-sm"
          />
          {isOpen && filteredSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
              {filteredSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSubmit(item)}
                  className="w-full text-left px-3 py-3 sm:py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-50 last:border-0"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Mode Toggle - Compact on mobile */}
        <div className="flex items-center bg-gray-100 rounded-md p-0.5 shrink-0">
          {(["keyword", "semantic"] as const).map((option) => (
            <button
              key={option}
              onClick={() => onModeChange(option)}
              className={`px-2 sm:px-3 py-1.5 rounded text-[10px] sm:text-xs font-medium transition-all ${
                mode === option
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {option === "keyword" ? "Key" : "AI"}
            </button>
          ))}
        </div>
      </div>
      {mode === "semantic" && (
        <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
          Semantic search: Nhập câu hỏi tự nhiên để tìm kiếm thông minh.
        </p>
      )}
    </div>
  );
};

// --- HEADER COMPONENT ---
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
    if (nextQuery) params.set("query", nextQuery);
    else params.delete("query");
    if (nextMode) params.set("mode", nextMode);
    else params.delete("mode");
    navigate(
      { pathname: location.pathname, search: params.toString() },
      { replace: true }
    );
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header>
      {/* Left: Menu & Logo */}
      <div className="bg-white border-b w-full border-gray-200 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full text-gray-600"
            onClick={onMenuToggle}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0">
              M
            </div>
            <span className="text-xl text-gray-700 hidden sm:inline font-semibold">
              Mail
            </span>
          </div>
        </div>

        {/* Middle: Search Bar (Flex-1 to take available space) */}
        <div className="flex-1 max-w-2xl mx-1 hidden sm:block min-w-0">
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

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Grid3x3 className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer select-none ring-offset-2 hover:ring-2 ring-blue-200 transition-all"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                {user.email[0].toUpperCase()}
              </div>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-xl z-50 py-1">
                  <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer text-gray-700"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </div>
                  <div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap px-2"
            >
              Login
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 max-w-2xl mx-1 block sm:hidden min-w-0">
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
    </header>
  );
};
