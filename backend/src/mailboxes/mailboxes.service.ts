import { Injectable, NotFoundException } from '@nestjs/common';
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
      const data = readFileSync(join(filePathEmails, filename), 'utf-8');
      const json = JSON.parse(data);

      this.emailsInMailbox.set(json[0].mailboxId, json);
    }
  }

  async getMailboxes() {
    return this.mailboxes;
  }

  async getEmailsInMailbox(mailboxId: string, paginationDto: PaginationDto) {
    const emails = this.emailsInMailbox.get(mailboxId);

    if (!emails) {
      throw new NotFoundException('No emails found for this mailbox');
    }

    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || emails.length;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit) || emails.length;

    const paginatedEmails = emails.slice(skip, skip + take);

    return {
      page: page,
      limit: limit,
      total: emails.length,
      data: paginatedEmails,
    };
  }

  async searchEmailsInMailbox(
    mailboxId: string,
    query: string,
    paginationDto: PaginationDto,
  ) {
    const emails = this.emailsInMailbox.get(mailboxId);

    if (!emails) {
      throw new NotFoundException('No emails found for this mailbox');
    }

    const filteredEmails = emails.filter(
      (email) =>
        email.subject.toLowerCase().includes(query.toLowerCase()) ||
        email.previewText.toLowerCase().includes(query.toLowerCase()),
    );

    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || filteredEmails.length;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit) || filteredEmails.length;

    const paginatedEmails = filteredEmails.slice(skip, skip + take);

    return {
      page: page,
      limit: limit,
      total: filteredEmails.length,
      data: paginatedEmails,
    };
  }
}
