import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { EmailsService } from './emails.service';

@Controller('emails')
export class EmailsController {
  constructor(private emailsService: EmailsService) {}

  @Post(':id/reply')
  async reply(@Body() body, @Req() req: Request, @Param('id') id: string) {
    const data = req['user'];
    const userId = data.id;
    // const userId = '6929c1a4f090673ab256f767';
    if (!body.to || !body.html) {
      throw new BadRequestException('Missing required fields: to, html');
    }
    if (!body.subject) {
      body.subject = '';
    }
    const emailDetail = await this.emailsService.getEmailDetail(id, userId);
    if (!emailDetail) {
      throw new BadRequestException('Original email not found');
    }
    const threadId = emailDetail.threadId || '';
    const messageIdHeader = emailDetail.messageIdHeader || '';
    const referencesHeader = emailDetail.referencesHeader || '';
    return this.emailsService.replyEmail(
      userId,
      body,
      threadId,
      messageIdHeader,
      referencesHeader,
    );
  }

  @Post(':id/modify')
  async modify(@Body() body, @Req() req: Request, @Param('id') id: string) {
    const data = req['user'];
    const userId = data.id;
    // const userId = '6929c1a4f090673ab256f767';
    const addLabels = body.addLabels || [];
    const removeLabels = body.removeLabels || [];

    if (body.isStar === true) addLabels.push('STARRED');
    else if (body.isStar === false) removeLabels.push('STARRED');
    if (body.isRead === true) removeLabels.push('UNREAD');
    else if (body.isRead === false) addLabels.push('UNREAD');
    if (body.isDelete === true) addLabels.push('TRASH');
    else if (body.isDelete === false) removeLabels.push('TRASH');

    return this.emailsService.modifyEmailLabels(
      userId,
      id,
      addLabels,
      removeLabels,
    );
  }

  @Get(':id')
  getEmailDetail(@Req() req: Request, @Param('id') id: string) {
    const data = req['user'];
    const userId = data.id;
    return this.emailsService.getEmailDetail(id, userId);
  }

  @Post('send')
  async send(@Body() body, @Req() req: Request) {
    const data = req['user'];
    const userId = data.id;
    // const userId = '6929c1a4f090673ab256f767';
    if (!body.to || !body.html) {
      throw new BadRequestException('Missing required fields: to, html');
    }
    if (!body.subject) {
      body.subject = '';
    }
    return this.emailsService.sendEmail(userId, body);
  }
}
