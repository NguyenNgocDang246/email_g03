import React from "react";
import { Plus } from "lucide-react";

export const ComposeButton: React.FC = () => {
  return (
    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full flex items-center gap-2 justify-center font-medium shadow-md transition-colors">
      <Plus className="w-5 h-5" />
      Tạo Mới
    </button>
  );
};
