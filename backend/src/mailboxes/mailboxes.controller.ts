import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { MailboxesService } from './mailboxes.service';
import type { PaginationDto } from './dto';
import type { Request } from 'express';

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
    @Query('refresh') refresh?: string,
  ) {
    const data = req['user'];
    const userId = data.id;
    const shouldRefresh = refresh === 'true' || refresh === '1';
    return this.mailboxesService.getEmailsInMailbox(id, userId, paginationDto, {
      refresh: shouldRefresh,
    });
  }

  @Get(':id/emails/search')
  searchEmailsInMailbox(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('query') query: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const data = req['user'];
    const userId = data.id;
    return this.mailboxesService.searchEmailsInMailbox(
      id,
      query,
      paginationDto,
      userId,
    );
  }
}
