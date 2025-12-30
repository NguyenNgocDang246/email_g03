import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import contentDisposition from 'content-disposition';
import { EmailsService } from './emails.service';
import type { Request } from 'express';
import { EmailStatus } from './schemas/email.schema';

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

  @Post(':id/status')
  async updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const data = req['user'];
    const userId = data.id;
    const { status, snoozedUntil, previousStatus } = body || {};
    return this.emailsService.updateStatus(userId, id, status as EmailStatus, {
      snoozedUntil,
      previousStatus,
    });
  }

  @Get(':id/attachments/:index/stream')
  async streamAttachment(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('index') index: string,
    @Res() res: any,
  ) {
    const data = req['user'];
    const userId = data.id;
    // const userId = '6929c1a4f090673ab256f767';
    const mail = await this.emailsService.getEmailDetail(id, userId);
    if (!mail) {
      throw new BadRequestException('Email not found');
    }
    if (!mail.attachments || mail.attachments.length === 0) {
      throw new BadRequestException('No attachments found');
    }
    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || idx >= mail.attachments.length) {
      throw new BadRequestException('Invalid attachment index');
    }
    const attachmentId = mail.attachments[idx].id;
    const attachment = mail.attachments[idx];

    const fileData = await this.emailsService.streamAttachment(
      userId,
      id,
      attachmentId,
    );
    const fileBuffer = Buffer.from(fileData, 'base64');
    const { mimeType, fileName } = attachment;
    res.setHeader('Content-Disposition', contentDisposition(fileName));
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', fileBuffer.length);
    res.send(fileBuffer);
  }

  @Get(':id')
  async getEmailDetail(@Req() req: Request, @Param('id') id: string) {
    const data = req['user'];
    const userId = data.id;
    console.log('Fetching email detail for ID:', id, 'User ID:', userId);
    return await this.emailsService.getEmailDetail(id, userId);
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
