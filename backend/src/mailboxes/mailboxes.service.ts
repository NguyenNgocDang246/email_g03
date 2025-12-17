import { Injectable, NotFoundException } from '@nestjs/common';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Mailbox } from '../types';
import { PaginationDto } from './dto';
import { EmailsService } from '../emails/emails.service';
import { AuthService } from '../auth/auth.service';
import { GmailMapper } from '../mappers';

@Injectable()
export class MailboxesService {
  private mailboxes: Mailbox[];
  private emailsInMailbox = new Map();

  constructor(
    private authService: AuthService,
    private emailsService: EmailsService,
  ) {
    const filePathMailboxes = join(__dirname, '..', 'mock', 'mailboxes.json');
    const dataMailboxes = readFileSync(filePathMailboxes, 'utf8');
    this.mailboxes = JSON.parse(dataMailboxes);

    const filePathEmails = join(__dirname, '..', 'mock', 'emails');
    const dataEmails = readdirSync(filePathEmails);

    for (const filename of dataEmails) {
      const data = readFileSync(join(filePathEmails, filename), 'utf-8');
      const json = JSON.parse(data);

      if (json.length === 0) {
        this.emailsInMailbox.set(filename.replace('.json', ''), []);
      } else {
        this.emailsInMailbox.set(json[0].mailboxId, json);
      }
    }
  }

  async getMailboxes(userId: string) {
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) return null;
    const res = await gmail.users.labels.list({
      userId: 'me',
    });
    return res.data.labels;
  }

  async getEmailsInMailbox(
    mailboxId: string,
    userId: string,
    paginationDto: PaginationDto,
  ) {
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) return null;

    const limit = Number(paginationDto?.limit) || 10;
    const pageToken = paginationDto?.pageToken;

    const list = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [mailboxId],
      maxResults: limit,
      pageToken: pageToken,
    });

    const messages = list.data.messages ?? [];
    const nextPageToken = list.data.nextPageToken ?? null;
    const total = list.data.resultSizeEstimate ?? 0;

    const emails = await Promise.all(
      messages.map(async (msg) => {
        const res = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id as string,
          format: 'full',
        });

        return GmailMapper.toEmail(res.data, mailboxId);
      }),
    );

    await this.emailsService.saveEmailSummaries(userId, emails);
    const emailsWithStatus = await this.emailsService.mergeStatuses(
      userId,
      emails,
    );

    return {
      limit: limit,
      total: total,
      nextPageToken,
      data: emailsWithStatus,
    };
  }

  async searchEmailsInMailbox(
    mailboxId: string,
    query: string,
    paginationDto: PaginationDto,
    userId: string,
  ) {
    const emails = this.emailsInMailbox.get(mailboxId);

    if (!emails) {
      throw new NotFoundException('No emails found for this mailbox');
    }

    const filteredEmails = emails.filter(
      (email) =>
        email.subject.toLowerCase().includes(query.toLowerCase()) ||
        email.preview.toLowerCase().includes(query.toLowerCase()),
    );

    const page = Number(paginationDto.pageToken) || 1;
    const limit = Number(paginationDto.limit) || filteredEmails.length;

    const skip = (page - 1) * limit;
    const take = limit || filteredEmails.length;

    const paginatedEmails = filteredEmails.slice(skip, skip + take);

    const merged = await this.emailsService.mergeStatuses(
      userId,
      paginatedEmails,
    );

    return {
      page: page,
      limit: limit,
      total: filteredEmails.length,
      data: merged,
    };
  }
}
