import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

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

export const SearchBar: FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  suggestions = [],
  mode,
  onModeChange,
  placeholder = "Tìm kiếm mail hoặc đặt câu hỏi",
  className = "",
  variant = "card",
}: SearchBarProps) => {
  const baseClasses =
    variant === "inline"
      ? "p-0 bg-transparent"
      : "bg-white border border-gray-200 rounded-lg shadow-sm p-3";

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const filteredSuggestions = useMemo(() => {
    const keyword = value.trim().toLowerCase();
    if (!keyword) {
      return [];
    }
    const matches = suggestions.filter((item) =>
      item.toLowerCase().includes(keyword)
    );
    return matches.slice(0, 5);
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
      className={`${baseClasses} flex flex-col gap-2 ${className}`}
    >
      <div className="flex items-center gap-3">
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
            className="w-full pl-10 pr-3 py-2 rounded-md bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          {isOpen && filteredSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
              {filteredSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSubmit(item)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(["keyword", "semantic"] as const).map((option) => (
            <button
              key={option}
              onClick={() => onModeChange(option)}
              className={`px-3 py-2 rounded-md text-sm border transition ${
                mode === option
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {option === "keyword" ? "Keyword" : "Semantic"}
            </button>
          ))}
        </div>
      </div>
      {mode === "semantic" && (
        <p className="text-xs text-gray-500">
          Semantic search dùng embedding để tìm mail liên quan nhất, nhập câu
          hỏi tự nhiên để bắt đầu.
        </p>
      )}
    </div>
  );
};
