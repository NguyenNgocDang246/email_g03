import { Controller, Get, Param } from '@nestjs/common';
import { EmailsService } from './emails.service';

@Controller('emails')
export class EmailsController {
  constructor(private emailsService: EmailsService) {}

  @Get(':id')
  getEmailDetail(@Param('id') id: string) {
    return this.emailsService.getEmailDetail(id);
  }
}
