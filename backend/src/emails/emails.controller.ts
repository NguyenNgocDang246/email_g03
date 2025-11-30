import { Controller, Get, Param, Req } from '@nestjs/common';
import { EmailsService } from './emails.service';

@Controller('emails')
export class EmailsController {
  constructor(private emailsService: EmailsService) {}

  @Get(':id')
  getEmailDetail(@Req() req: Request, @Param('id') id: string) {
    const data = req['user'];
    const userId = data.id;
    return this.emailsService.getEmailDetail(id, userId);
  }
}
