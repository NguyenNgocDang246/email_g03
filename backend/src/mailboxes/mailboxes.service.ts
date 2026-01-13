import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { readdirSync, readFileSync } from 'fs';
import { Model } from 'mongoose';
import { join } from 'path';
import { EmailEntity } from '../emails/schemas/email.schema';
import { AuthService } from '../auth/auth.service';
import { EmailsService } from '../emails/emails.service';
import { GmailMapper } from '../mappers';
import { Mailbox } from '../types';
import { PaginationDto } from './dto';

@Injectable()
export class MailboxesService {
  private readonly logger = new Logger(MailboxesService.name);
  private mailboxes: Mailbox[];
  private emailsInMailbox = new Map();

  constructor(
    private authService: AuthService,
    private emailsService: EmailsService,
    @InjectModel(EmailEntity.name)
    private emailModel: Model<EmailEntity>,
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
    options?: { refresh?: boolean },
  ) {
    const shouldRefresh = options?.refresh === true;
    if (shouldRefresh && !paginationDto?.pageToken) {
      await this.refreshMailboxCache(mailboxId, userId, paginationDto);
      return this.getCachedEmailsInMailbox(mailboxId, userId, paginationDto);
    }

    const cached = await this.getCachedEmailsInMailbox(
      mailboxId,
      userId,
      paginationDto,
    );

    if (!paginationDto?.pageToken) {
      void this.refreshMailboxCache(mailboxId, userId, paginationDto).catch(
        (error) => {
          this.logger.warn(
            `Failed to refresh mailbox cache: ${error instanceof Error ? error.message : String(error)}`,
          );
        },
      );
    }

    return cached;
  }

  private parseCachePageToken(pageToken?: string) {
    if (!pageToken) return 0;
    if (pageToken.startsWith('db:')) {
      const raw = Number(pageToken.slice(3));
      return Number.isFinite(raw) && raw > 0 ? raw : 0;
    }
    const raw = Number(pageToken);
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  }

  private buildCachePageToken(offset: number) {
    return `db:${offset}`;
  }

  private async getCachedEmailsInMailbox(
    mailboxId: string,
    userId: string,
    paginationDto: PaginationDto,
  ) {
    await this.emailsService.refreshSnoozedStatuses(userId);
    const limit = Number(paginationDto?.limit) || 10;
    const offset = this.parseCachePageToken(paginationDto?.pageToken);
    const filter = { userId, labels: mailboxId };
    const total = await this.emailModel.countDocuments(filter);
    const docs = await this.emailModel
      .find(filter)
      .sort({ receivedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const nextOffset = offset + docs.length;
    const nextPageToken =
      nextOffset < total ? this.buildCachePageToken(nextOffset) : null;

    return {
      limit: limit,
      total: total,
      nextPageToken,
      data: docs.map((doc) => ({
        id: doc.emailId,
        mailboxId,
        from: doc.sender,
        subject: doc.subject || '',
        snippet: doc.snippet ?? '',
        date: doc.receivedAt
          ? new Date(doc.receivedAt).toISOString()
          : new Date().toISOString(),
        isRead: !(doc.labels || []).includes('UNREAD'),
        labels: doc.labels || [],
        status: (doc.status as any) || 'INBOX',
        hasAttachments: doc.hasAttachments || false,
      })),
    };
  }

  private async refreshMailboxCache(
    mailboxId: string,
    userId: string,
    paginationDto: PaginationDto,
  ) {
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) {
      throw new UnauthorizedException();
    }

    const limit = Number(paginationDto?.limit) || 10;
    const pageToken =
      paginationDto?.pageToken && !paginationDto.pageToken.startsWith('db:')
        ? paginationDto.pageToken
        : undefined;

    const list = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [mailboxId],
      maxResults: limit,
      pageToken,
    });

    const messages = list.data.messages ?? [];

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

    await this.emailsService.saveEmailSummaries(userId, emails, mailboxId);
  }

  async searchEmailsInMailbox(
    mailboxId: string,
    query: string,
    paginationDto: PaginationDto,
    userId: string,
  ) {
    const gmail = await this.authService.getGmail(userId);

    if (!gmail) {
      throw new UnauthorizedException();
    }

    const pageToken = paginationDto?.pageToken;
    const limit = Number(paginationDto.limit) || 10;

    const list = await gmail?.users.messages.list({
      userId: 'me',
      labelIds: [mailboxId],
      q: query,
      maxResults: limit,
      pageToken,
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
}
