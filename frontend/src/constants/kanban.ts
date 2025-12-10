export type KanbanStatus =
  | "INBOX"
  | "TO_DO"
  | "IN_PROGRESS"
  | "DONE"
  | "SNOOZED";

export interface KanbanColumnConfig {
  id: KanbanStatus;
  title: string;
  description: string;
  accent: string;
  softBg: string;
}

export const KANBAN_STATUS_LABELS: KanbanStatus[] = [
  "INBOX",
  "TO_DO",
  "IN_PROGRESS",
  "DONE",
  "SNOOZED",
];

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: "INBOX",
    title: "Inbox",
    description: "Fresh emails waiting for triage",
    accent: "border-blue-400 text-blue-600",
    softBg: "bg-blue-50",
  },
  {
    id: "TO_DO",
    title: "To Do",
    description: "Emails that require follow-up",
    accent: "border-amber-400 text-amber-600",
    softBg: "bg-amber-50",
  },
  {
    id: "IN_PROGRESS",
    title: "In Progress",
    description: "Actively being handled",
    accent: "border-purple-400 text-purple-600",
    softBg: "bg-purple-50",
  },
  {
    id: "DONE",
    title: "Done",
    description: "No further action needed",
    accent: "border-emerald-400 text-emerald-600",
    softBg: "bg-emerald-50",
  },
  {
    id: "SNOOZED",
    title: "Snoozed",
    description: "Parked for later",
    accent: "border-slate-400 text-slate-600",
    softBg: "bg-slate-50",
  },
];

export const deriveStatusFromLabels = (
  labels: string[] = [],
): KanbanStatus => {
  const matched = labels.find((label) =>
    KANBAN_STATUS_LABELS.includes(label as KanbanStatus),
  );
  if (matched && KANBAN_STATUS_LABELS.includes(matched as KanbanStatus)) {
    return matched as KanbanStatus;
  }
  return "INBOX";
};

export const buildStatusLabelUpdate = (next: KanbanStatus) => ({
  addLabels: [next],
  removeLabels: KANBAN_STATUS_LABELS.filter((label) => label !== next),
});

export const formatStatusLabel = (status: KanbanStatus) => {
  switch (status) {
    case "INBOX":
      return "Inbox";
    case "TO_DO":
      return "To Do";
    case "IN_PROGRESS":
      return "In Progress";
    case "DONE":
      return "Done";
    case "SNOOZED":
      return "Snoozed";
    default:
      return status;
  }
};
