import React from "react";

import {MailPlus} from "lucide-react"

export const ComposeButton: React.FC = () => {
  return (
    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6  py-3 rounded flex items-center gap-2 justify-center font-medium shadow-md transition-colors">
      <MailPlus size={18}/>
      New Email
    </button>
  );
};
