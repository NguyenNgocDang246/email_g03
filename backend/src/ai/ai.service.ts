import { Injectable } from '@nestjs/common';
import { EmailsService } from '../emails/emails.service';
import { MailboxesService } from '../mailboxes/mailboxes.service';

@Injectable()
export class AiService {
  constructor(
    private readonly emailsService: EmailsService,
    private readonly mailboxesService: MailboxesService,
  ) {}

  async semanticSearch(mailboxId: string | undefined, query: string) {
    if (!query) return [];
    if (mailboxId) {
      const results = await this.mailboxesService.searchEmailsInMailbox(
        mailboxId,
        query,
        { limit: 50, pageToken: 1 } as any,
      );
      return results.data || [];
    }
    return [];
  }

  async summarizeEmail(emailId: string, userId: string) {
    const detail = await this.emailsService.getEmailDetail(emailId, userId);
    if (!detail) return null;

    const senderEmail = detail.from;
    const senderName = (detail as any)?.fromName;

    const baseText =
      detail.snippet ||
      detail.bodyText ||
      detail.bodyHtml?.replace(/<[^>]+>/g, '') ||
      '';

    const summary =
      baseText?.slice(0, 280) ||
      'No content available to summarize for this email.';

    return {
      summary,
      metadata: {
        sender: senderEmail,
        senderName,
        subject: detail.subject,
        date: detail.date,
        mailboxId: detail.mailboxId,
      },
      fullText: detail.bodyText,
      status: detail.status,
    };
  }
}
