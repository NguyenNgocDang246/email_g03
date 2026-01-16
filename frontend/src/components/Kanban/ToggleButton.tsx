type ViewMode = "list" | "kanban";

interface ToggleButtonProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ToggleButton = ({ mode, onChange }: ToggleButtonProps) => {
  return (
    <div className="inline-flex rounded-md sm:rounded-full bg-white shadow-sm border border-gray-200 p-0.5 sm:p-1">
      {(["list", "kanban"] as const).map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`
            px-3 py-1.5 sm:px-4 sm:py-1.5 
            text-xs sm:text-sm font-medium rounded sm:rounded-full transition-all whitespace-nowrap
            ${
              mode === option
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }
          `}
        >
          {option === "list" ? "List" : "Kanban"}
        </button>
      ))}
    </div>
  );
};
