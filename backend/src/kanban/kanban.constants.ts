export const MAX_KANBAN_COLUMNS = 10;
export const SNOOZED_COLUMN_NAME = 'SNOOZED';

export const DEFAULT_KANBAN_COLUMNS = [
  {
    name: 'INBOX',
    displayName: 'Inbox',
    description: 'Fresh emails waiting for triage',
    position: 0,
    isLocked: true,
  },
  {
    name: 'TO_DO',
    displayName: 'To Do',
    description: 'Emails that require follow-up',
    position: 1,
    isLocked: false,
  },
  {
    name: 'IN_PROGRESS',
    displayName: 'In Progress',
    description: 'Actively being handled',
    position: 2,
    isLocked: false,
  },
  {
    name: 'DONE',
    displayName: 'Done',
    description: 'No further action needed',
    position: 3,
    isLocked: false,
  },
  {
    name: SNOOZED_COLUMN_NAME,
    displayName: 'Snoozed',
    description: 'Parked for later',
    position: 4,
    isLocked: true,
  },
];
