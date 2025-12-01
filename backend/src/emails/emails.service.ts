import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { EmailDetailMapper } from 'src/mappers';

@Injectable()
export class EmailsService {
  constructor(private authService: AuthService) {}

  async getEmailDetail(id: string, userId: string) {
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) return null;

    const emailDetail = await gmail.users.messages.get({
      userId: 'me',
      id: id,
      format: 'full',
    });

    const emailDetailMapped = EmailDetailMapper.toEmailDetail(
      emailDetail.data,
      undefined,
    );

    return emailDetailMapped;
  }

  buildMimeEmail(to: string, subject: string, html: string) {
    const mime = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      html,
    ].join('\n');

    // Base64 → chuẩn base64url
    return Buffer.from(mime)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async sendEmail(userId: string, { to, subject, html }) {
    const raw = this.buildMimeEmail(to, subject, html);
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) return null;
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    return {
      message: 'Email sent!',
      id: res.data.id,
    };
  }

  buildReplyMime({ to, subject, html, messageIdHeader, referencesHeader }) {
    let references = messageIdHeader;
    if (referencesHeader && referencesHeader.trim().length) {
      references = referencesHeader.trim() + ' ' + messageIdHeader;
    }

    const mime = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `In-Reply-To: ${messageIdHeader}`,
      `References: ${references}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      html,
    ].join('\n');

    const raw = Buffer.from(mime)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return raw;
  }

  async replyEmail(
    userId: string,
    { to, subject, html },
    threadId: string,
    messageIdHeader: string,
    referencesHeader?: string,
  ) {
    const raw = this.buildReplyMime({
      to,
      subject,
      html,
      messageIdHeader,
      referencesHeader,
    });
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) return null;
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw, threadId },
    });

    return {
      message: 'Email replied!',
      id: res.data.id,
    };
  }

  async modifyEmailLabels(
    userId: string,
    messageId: string,
    addLabels: string[],
    removeLabels: string[],
  ) {
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) return null;
    if (addLabels.length === 0 && removeLabels.length === 0) {
      return null;
    }
    const res = await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: addLabels,
        removeLabelIds: removeLabels,
      },
    });
  }

  async streamAttachment(
    userId: string,
    messageId: string,
    attachmentId: string,
  ) {
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) throw new NotFoundException('Gmail not found');

    const attachment = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId,
    });

    if (!attachment?.data?.data) {
      throw new NotFoundException('Attachment content not found');
    }

    return attachment.data.data;
  }
}
