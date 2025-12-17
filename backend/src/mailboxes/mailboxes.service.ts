import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { readdirSync, readFileSync } from 'fs';
import { Model } from 'mongoose';
import { join } from 'path';
import { EmailEntity } from 'src/emails/schemas/email.schema';
import { AuthService } from '../auth/auth.service';
import { EmailsService } from '../emails/emails.service';
import { GmailMapper } from '../mappers';
import { Mailbox } from '../types';
import { PaginationDto } from './dto';

@Injectable()
export class MailboxesService {
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
  ) {
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) {
      throw new UnauthorizedException();
    }

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
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
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
