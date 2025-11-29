import { Injectable, NotFoundException } from '@nestjs/common';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Mailbox } from '../types';
import { PaginationDto } from './dto';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class MailboxesService {
  private mailboxes: Mailbox[];
  private emailsInMailbox = new Map();

  constructor(private authService: AuthService) {
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
    return await gmail.users.labels.list({
      userId: 'me',
    });
  }

  async getEmailsInMailbox(mailboxId: string, paginationDto: PaginationDto) {
    const emails = this.emailsInMailbox.get(mailboxId);

    if (!emails) {
      throw new NotFoundException('No emails found for this mailbox');
    }

    const page = Number(paginationDto.page) || 1;
    const limit = Number(paginationDto.limit) || emails.length;

    const skip = (page - 1) * limit;
    const take = limit || emails.length;

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
        email.preview.toLowerCase().includes(query.toLowerCase()),
    );

    const page = Number(paginationDto.page) || 1;
    const limit = Number(paginationDto.limit) || filteredEmails.length;

    const skip = (page - 1) * limit;
    const take = limit || filteredEmails.length;

    const paginatedEmails = filteredEmails.slice(skip, skip + take);

    return {
      page: page,
      limit: limit,
      total: filteredEmails.length,
      data: paginatedEmails,
    };
  }
}
