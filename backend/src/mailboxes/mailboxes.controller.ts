import { Controller, Get, Param, Query } from '@nestjs/common';
import { MailboxesService } from './mailboxes.service';
import { PaginationDto } from './dto';

@Controller('mailboxes')
export class MailboxesController {
  constructor(private mailboxesService: MailboxesService) {}

  @Get()
  getMailboxes() {
    return this.mailboxesService.getMailboxes();
  }

  @Get(':id/emails')
  getEmailsInMailbox(
    @Param('id') id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.mailboxesService.getEmailsInMailbox(id, paginationDto);
  }
}
