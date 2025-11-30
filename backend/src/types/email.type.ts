export type Email = {
  id: string;
  threadId: string;
  mailboxId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];

  subject: string;
  snippet: string;
  date: string;

  isRead: boolean;

  hasAttachments: boolean;
  labels?: string[];

  fromName?: string;
  fromAvatar?: string;
};
