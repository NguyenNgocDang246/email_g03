import { Controller, Get, Param } from '@nestjs/common';
import { MailboxesService } from './mailboxes.service';

@Controller('mailboxes')
export class MailboxesController {
  constructor(private mailboxesService: MailboxesService) {}

  @Get()
  getMailboxes() {
    return this.mailboxesService.getMailboxes();
  }

  @Get(':id/emails')
  getEmailsInMailbox(@Param('id') id: string) {
    return this.mailboxesService.getEmailsInMailbox(id);
  }
}
