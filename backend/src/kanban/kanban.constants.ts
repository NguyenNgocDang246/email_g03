export const MAX_KANBAN_COLUMNS = 10;
export const SNOOZED_COLUMN_NAME = 'SNOOZED';

export const DEFAULT_KANBAN_COLUMNS = [
  { name: 'INBOX', displayName: 'Inbox', position: 0, isLocked: true },
  { name: 'TO_DO', displayName: 'To Do', position: 1, isLocked: false },
  {
    name: 'IN_PROGRESS',
    displayName: 'In Progress',
    position: 2,
    isLocked: false,
  },
  { name: 'DONE', displayName: 'Done', position: 3, isLocked: false },
  {
    name: SNOOZED_COLUMN_NAME,
    displayName: 'Snoozed',
    position: 4,
    isLocked: true,
  },
];
