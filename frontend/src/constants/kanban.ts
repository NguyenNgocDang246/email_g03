export type KanbanStatus = string;

export interface KanbanColumnConfig {
  id: KanbanStatus;
  title: string;
  description: string;
  accent: string;
  softBg: string;
  isLocked?: boolean;
}

const DEFAULT_COLUMN_STYLES: Record<
  string,
  { title: string; description: string; accent: string; softBg: string }
> = {
  INBOX: {
    title: "Inbox",
    description: "Fresh emails waiting for triage",
    accent: "border-blue-400 text-blue-600",
    softBg: "bg-blue-50",
  },
  TO_DO: {
    title: "To Do",
    description: "Emails that require follow-up",
    accent: "border-amber-400 text-amber-600",
    softBg: "bg-amber-50",
  },
  IN_PROGRESS: {
    title: "In Progress",
    description: "Actively being handled",
    accent: "border-purple-400 text-purple-600",
    softBg: "bg-purple-50",
  },
  DONE: {
    title: "Done",
    description: "No further action needed",
    accent: "border-emerald-400 text-emerald-600",
    softBg: "bg-emerald-50",
  },
  SNOOZED: {
    title: "Snoozed",
    description: "Parked for later",
    accent: "border-slate-400 text-slate-600",
    softBg: "bg-slate-50",
  },
};

const FALLBACK_STYLES = [
  { accent: "border-teal-400 text-teal-600", softBg: "bg-teal-50" },
  { accent: "border-rose-400 text-rose-600", softBg: "bg-rose-50" },
  { accent: "border-cyan-400 text-cyan-600", softBg: "bg-cyan-50" },
  { accent: "border-lime-400 text-lime-600", softBg: "bg-lime-50" },
  { accent: "border-orange-400 text-orange-600", softBg: "bg-orange-50" },
  { accent: "border-indigo-400 text-indigo-600", softBg: "bg-indigo-50" },
];

const toTitleCase = (value: string) =>
  value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const buildKanbanColumns = (
  columns: { name: string; displayName: string; isLocked?: boolean }[],
  mailboxId?: string
): KanbanColumnConfig[] => {
  return columns.map((column, index) => {
    const defaults = DEFAULT_COLUMN_STYLES[column.name];
    const fallback = FALLBACK_STYLES[index % FALLBACK_STYLES.length];
    const baseTitle = defaults?.title ?? toTitleCase(column.name);
    const title =
      column.name === "INBOX" && mailboxId ? mailboxId : column.displayName || baseTitle;
    const description =
      column.name === "INBOX" && mailboxId
        ? `Mailbox: ${mailboxId}`
        : defaults?.description || baseTitle;

    return {
      id: column.name,
      title,
      description,
      accent: defaults?.accent ?? fallback.accent,
      softBg: defaults?.softBg ?? fallback.softBg,
      isLocked: column.isLocked,
    };
  });
};

export const formatStatusLabel = (status: KanbanStatus) => {
  const defaults = DEFAULT_COLUMN_STYLES[status];
  if (defaults) return defaults.title;
  return toTitleCase(status || "");
};
