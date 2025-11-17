import { Injectable } from '@nestjs/common';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Mailbox } from 'src/types';
import { PaginationDto } from './dto';

@Injectable()
export class MailboxesService {
  private mailboxes: Mailbox[];
  private emailsInMailbox = new Map();

  constructor() {
    const filePathMailboxes = join(__dirname, '..', 'mock', 'mailboxes.json');
    const dataMailboxes = readFileSync(filePathMailboxes, 'utf8');
    this.mailboxes = JSON.parse(dataMailboxes);

    const filePathEmails = join(__dirname, '..', 'mock', 'emails');
    const dataEmails = readdirSync(filePathEmails);

    for (const filename of dataEmails) {
      console.log(filename);
      const data = readFileSync(join(filePathEmails, filename), 'utf-8');
      const json = JSON.parse(data);

      this.emailsInMailbox.set(json[0].mailboxId, json);
    }
  }

  async getMailboxes() {
    return this.mailboxes;
  }

  async getEmailsInMailbox(mailboxId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const emails = this.emailsInMailbox.get(mailboxId);

    if (!emails) {
      throw new Error('No emails found for this mailbox');
    }

    const paginatedEmails = emails.slice(skip, skip + take);

    return {
      data: paginatedEmails,
      page: paginationDto.page,
      limit: paginationDto.limit,
      total: this.emailsInMailbox.get(mailboxId)?.length || 0,
    };
  }
}
