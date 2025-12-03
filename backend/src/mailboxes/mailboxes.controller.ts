import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { MailboxesService } from './mailboxes.service';
import { PaginationDto } from './dto';

@Controller('mailboxes')
export class MailboxesController {
  constructor(private mailboxesService: MailboxesService) {}

  @Get()
  getMailboxes(@Req() req: Request) {
    const data = req['user'];
    const userId = data.id;
    return this.mailboxesService.getMailboxes(userId);
  }

  @Get(':id/emails')
  getEmailsInMailbox(
    @Req() req: Request,
    @Param('id') id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const data = req['user'];
    const userId = data.id;
    return this.mailboxesService.getEmailsInMailbox(id, userId, paginationDto);
  }

  @Get(':id/emails/search')
  searchEmailsInMailbox(
    @Param('id') id: string,
    @Query('query') query: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.mailboxesService.searchEmailsInMailbox(
      id,
      query,
      paginationDto,
    );
  }
}
