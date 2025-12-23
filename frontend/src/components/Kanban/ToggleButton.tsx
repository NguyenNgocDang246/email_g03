type ViewMode = "list" | "kanban";

interface ToggleButtonProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ToggleButton = ({
  mode,
  onChange,
}: ToggleButtonProps) => {
  return (
    <div className="inline-flex rounded-full bg-white shadow-sm overflow-hidden">
      {(["list", "kanban"] as const).map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-4 py-2 text-sm transition ${
            mode === option
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {option === "list" ? "List view" : "Kanban view"}
        </button>
      ))}
    </div>
  );
};
