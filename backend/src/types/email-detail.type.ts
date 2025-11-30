import { Attachment } from './attachment.type';
import { Email } from './email.type';

export type EmailDetail = Email & {
  bodyHtml?: string;
  bodyText?: string;
  attachments?: Attachment[];
  messageIdHeader?: string | null;
  inReplyToHeader?: string | null;
  referencesHeader?: string | null;
};
